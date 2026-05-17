import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, User, LogOut, Search, RefreshCw } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { ConfirmModal } from "../components/navbar";

interface LP {
    id: number;
    title: string;
    artist: string;
    cover: string;
    likes: number;
    createdAt: string;
}

interface LPPage {
    data: LP[];
    nextCursor: number | null;
}

interface OutletContext {
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

const fetchLps = async ({
    sort,
    cursor,
}: {
    sort: string;
    cursor: number | null;
}): Promise<LPPage> => {
    const params = new URLSearchParams({ sort });
    if (cursor !== null) params.append("cursor", String(cursor));
    const res = await axiosInstance.get(`/v1/lps?${params.toString()}`);
    if (Array.isArray(res.data)) return { data: res.data, nextCursor: null };
    return res.data;
};

const AddModal = ({
    onClose,
    onAdd,
}: {
    onClose: () => void;
    onAdd: (lp: { title: string; artist: string; content: string; tags: string[]; cover: string }) => void;
}) => {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [content, setContent] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [coverPreview, setCoverPreview] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleAddTag = () => {
        const trimmed = tagInput.trim();
        if (!trimmed || tags.includes(trimmed) || tags.length >= 5) return;
        setTags(prev => [...prev, trimmed]);
        setTagInput("");
    };

    const handleRemoveTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd({ title: title.trim(), artist: artist.trim(), content, tags, cover: coverPreview });
        onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
        >
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm flex flex-col overflow-hidden">
                <div
                    className="relative w-full flex items-center justify-center py-8 cursor-pointer"
                    style={{ background: "radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 100%)" }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <button
                        onClick={e => { e.stopPropagation(); onClose(); }}
                        className="absolute top-3 right-3 text-neutral-400 hover:text-white transition z-10"
                    >
                        <X size={20} />
                    </button>

                    <div
                        className="relative rounded-full overflow-hidden"
                        style={{
                            width: 140,
                            height: 140,
                            boxShadow: "0 0 0 3px #2a2a2a, 0 0 0 6px #111, 0 8px 32px rgba(0,0,0,0.8)",
                        }}
                    >
                        {coverPreview ? (
                            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                <span className="text-neutral-600 text-xs text-center leading-relaxed px-3">
                                    클릭하여<br />커버 선택
                                </span>
                            </div>
                        )}
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: `repeating-radial-gradient(
                                    circle at 50% 50%,
                                    transparent 0px, transparent 5px,
                                    rgba(0,0,0,0.15) 5px, rgba(0,0,0,0.15) 6px
                                )`,
                            }}
                        />
                        <div
                            className="absolute rounded-full"
                            style={{
                                width: "30%", height: "30%",
                                top: "50%", left: "50%",
                                transform: "translate(-50%, -50%)",
                                background: "radial-gradient(circle, #1a1a1a 60%, #0d0d0d 100%)",
                                boxShadow: "0 0 0 2px #333",
                            }}
                        >
                            <div
                                className="absolute rounded-full bg-neutral-950 border border-neutral-700"
                                style={{
                                    width: 10, height: 10,
                                    top: "50%", left: "50%",
                                    transform: "translate(-50%, -50%)",
                                }}
                            />
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="px-5 py-5 flex flex-col gap-3">
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="LP Name"
                        className="w-full bg-transparent border-b border-neutral-700 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                    />
                    <input
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                        placeholder="Artist (선택 - 비우면 닉네임으로 등록)"
                        className="w-full bg-transparent border-b border-neutral-700 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                    />
                    <input
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="LP Content"
                        className="w-full bg-transparent border-b border-neutral-700 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                    />
                    <div className="flex items-center gap-2">
                        <input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddTag()}
                            placeholder="LP Tag"
                            className="flex-1 bg-transparent border-b border-neutral-700 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                        />
                        <button
                            onClick={handleAddTag}
                            disabled={!tagInput.trim() || tags.length >= 5}
                            className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-md transition shrink-0"
                        >
                            Add
                        </button>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map(tag => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full"
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-neutral-500 hover:text-white transition"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="w-full py-3 rounded-lg text-sm font-bold transition mt-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    >
                        Add LP
                    </button>
                </div>
            </div>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="aspect-square rounded-lg bg-neutral-800 animate-pulse" />
);

export const HomePage = () => {
    const [showModal, setShowModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [sort, setSort] = useState<"newest" | "oldest">("newest");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { sidebarOpen, setSidebarOpen } = useOutletContext<OutletContext>();
    const { logout } = useAuth();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setSidebarOpen(false);
            }
        };
        if (sidebarOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sidebarOpen]);

    const {
        data,
        isLoading,
        isError,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["lps", sort] as string[],
        queryFn: ({ pageParam }: { pageParam: number | null }) =>
            fetchLps({ sort, cursor: pageParam }),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage: LPPage) => lastPage.nextCursor ?? undefined,
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
    });

    const allLps: LP[] = data?.pages.flatMap((page: LPPage) => page.data) ?? [];

    const filtered = allLps.filter(
        lp => lp.title.includes(search) || lp.artist.includes(search)
    );

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [handleObserver]);

    const addMutation = useMutation({
        mutationFn: (newLp: { title: string; artist: string; content: string; tags: string[]; cover: string }) =>
            axiosInstance.post("/v1/lps", newLp),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lps"] });
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: () => axiosInstance.delete("/api/auth/withdraw"),
        onSuccess: () => {
            logout();
            navigate("/login");
        },
    });

    return (
        <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30" />}

            <div
                ref={sidebarRef}
                className={`fixed top-14 left-0 bottom-0 w-44 bg-neutral-900 border-r border-neutral-800 py-6 px-3 flex flex-col z-40 transition-transform duration-300 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col gap-1 flex-1">
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-neutral-800 transition text-left">
                        <Search size={16} className="text-neutral-400 flex-shrink-0" />
                        찾기
                    </button>
                    <button
                        onClick={() => { navigate("/mypage"); setSidebarOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-neutral-800 transition text-left"
                    >
                        <User size={16} className="text-neutral-400 flex-shrink-0" />
                        마이페이지
                    </button>
                </div>
                <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-left"
                >
                    <LogOut size={16} className="flex-shrink-0" />
                    탈퇴하기
                </button>
            </div>

            <main className="flex-1 bg-neutral-950 px-4 md:px-8 py-6">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <div className="flex">
                        <button
                            onClick={() => setSort("oldest")}
                            className={`px-4 py-1.5 text-sm font-medium border transition rounded-l-lg ${
                                sort === "oldest"
                                    ? "bg-white text-black border-white"
                                    : "bg-transparent text-neutral-400 border-neutral-600 hover:text-white"
                            }`}
                        >
                            오래된순
                        </button>
                        <button
                            onClick={() => setSort("newest")}
                            className={`px-4 py-1.5 text-sm font-medium border-t border-b border-r transition rounded-r-lg ${
                                sort === "newest"
                                    ? "bg-white text-black border-white"
                                    : "bg-transparent text-neutral-400 border-neutral-600 hover:text-white"
                            }`}
                        >
                            최신순
                        </button>
                    </div>

                    <div className="relative flex-1 min-w-[160px] max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="제목 / 아티스트 검색"
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-8 pr-4 py-1.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                        />
                    </div>
                </div>

                {isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {isError && (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <p className="text-neutral-400 text-sm">데이터를 불러오지 못했어요.</p>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm transition"
                        >
                            <RefreshCw size={16} />
                            다시 시도
                        </button>
                    </div>
                )}

                {!isLoading && !isError && (
                    filtered.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-neutral-500 text-sm">
                            아직 추가된 곡이 없어요. + 버튼을 눌러 추가해보세요!
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {filtered.map(lp => (
                                    <div
                                        key={lp.id}
                                        onClick={() => navigate(`/lp/${lp.id}`)}
                                        className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
                                    >
                                        <img
                                            src={lp.cover}
                                            alt={lp.title}
                                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-75"
                                            onError={e => {
                                                (e.target as HTMLImageElement).src =
                                                    "https://via.placeholder.com/300x300/222/fff?text=LP";
                                            }}
                                        />
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-white font-bold text-sm truncate">{lp.title}</p>
                                            <p className="text-neutral-300 text-xs truncate">{lp.artist}</p>
                                            <p className="text-neutral-400 text-xs mt-1">♥ {lp.likes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isFetchingNextPage && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
                                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={`next-${i}`} />)}
                                </div>
                            )}

                            <div ref={sentinelRef} className="h-4 mt-4" />

                            {!hasNextPage && allLps.length > 0 && (
                                <p className="text-center text-neutral-600 text-xs mt-6 pb-4">
                                    모든 LP를 불러왔어요.
                                </p>
                            )}
                        </>
                    )
                )}
            </main>

            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center shadow-lg transition z-40"
            >
                <Plus size={24} className="text-white" />
            </button>

            {showModal && (
                <AddModal
                    onClose={() => setShowModal(false)}
                    onAdd={lp => addMutation.mutate(lp)}
                />
            )}

            {showWithdrawModal && (
                <ConfirmModal
                    message="정말 탈퇴하시겠습니까?"
                    onConfirm={() => {
                        setShowWithdrawModal(false);
                        withdrawMutation.mutate();
                    }}
                    onCancel={() => setShowWithdrawModal(false)}
                />
            )}
        </div>
    );
};