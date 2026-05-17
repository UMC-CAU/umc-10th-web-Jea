import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Settings, User } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

interface UserProfile {
    id: number;
    email: string;
    nickname: string;
    bio?: string;
    profileImage?: string;
}

const fetchMe = async (): Promise<UserProfile> => {
    const res = await axiosInstance.get("/api/auth/me");
    return res.data;
};

export const MyPage = () => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setNickname: setNavNickname } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [previewImage, setPreviewImage] = useState<string>("");

    const { data: user, isLoading } = useQuery<UserProfile>({
        queryKey: ["me"],
        queryFn: fetchMe,
    });

    useEffect(() => {
        if (user) {
            setNickname(user.nickname);
            setBio(user.bio ?? "");
            setPreviewImage(user.profileImage ?? "");
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: () =>
            axiosInstance.patch("/api/auth/me", {
                nickname,
                bio: bio || null,
                profileImage: previewImage || null,
            }),
        onMutate: () => {
            // 서버 응답 전에 Nav-Bar와 마이페이지 닉네임 즉시 변경
            setNavNickname(nickname);
            queryClient.setQueryData<UserProfile>(["me"], old =>
                old ? { ...old, nickname, bio, profileImage: previewImage } : old
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["me"] });
            setIsEditing(false);
        },
        onError: () => {
            // 실패 시 원래 값으로 롤백
            queryClient.invalidateQueries({ queryKey: ["me"] });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleEditStart = () => {
        setNickname(user?.nickname ?? "");
        setBio(user?.bio ?? "");
        setPreviewImage(user?.profileImage ?? "");
        setIsEditing(true);
    };

    const handleCancel = () => {
        setNickname(user?.nickname ?? "");
        setBio(user?.bio ?? "");
        setPreviewImage(user?.profileImage ?? "");
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4 w-full max-w-md px-6">
                    <div className="w-24 h-24 rounded-full bg-neutral-800" />
                    <div className="w-40 h-6 bg-neutral-800 rounded" />
                    <div className="w-56 h-4 bg-neutral-800 rounded" />
                    <div className="w-full h-10 bg-neutral-800 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <div className="max-w-md mx-auto px-6 py-10">

                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-lg font-bold">마이페이지</h1>
                    {!isEditing && (
                        <button
                            onClick={handleEditStart}
                            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition text-sm"
                        >
                            <Settings size={16} />
                            설정
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6 mb-8">
                    <div
                        className="relative shrink-0 cursor-pointer"
                        onClick={() => isEditing && fileInputRef.current?.click()}
                    >
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
                            {previewImage || user?.profileImage ? (
                                <img
                                    src={previewImage || user?.profileImage}
                                    alt="프로필"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={40} className="text-neutral-600" />
                            )}
                        </div>
                        {isEditing && (
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">변경</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                        {isEditing ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        placeholder="이름"
                                        className="flex-1 bg-transparent border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500 transition"
                                    />
                                    <button
                                        onClick={() => updateMutation.mutate()}
                                        disabled={!nickname.trim() || updateMutation.isPending}
                                        className="text-pink-500 hover:text-pink-400 disabled:opacity-40 transition"
                                    >
                                        <Check size={18} />
                                    </button>
                                </div>
                                <input
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="bio를 입력하세요 (선택)"
                                    className="bg-transparent border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500 transition"
                                />
                                <p className="text-xs text-neutral-500">{user?.email}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-base font-bold">{user?.nickname}</p>
                                {user?.bio && (
                                    <p className="text-sm text-neutral-400">{user.bio}</p>
                                )}
                                <p className="text-xs text-neutral-500">{user?.email}</p>
                            </>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <button
                        onClick={handleCancel}
                        className="w-full py-2.5 rounded-lg text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-500 hover:text-white transition"
                    >
                        취소
                    </button>
                )}
            </div>
        </div>
    );
};