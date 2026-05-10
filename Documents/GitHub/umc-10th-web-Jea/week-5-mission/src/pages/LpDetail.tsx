import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Pencil, Trash2, Heart, RotateCcw } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

interface LP {
    id: number;
    title: string;
    artist: string;
    cover: string;
    likes: number;
    createdAt: string;
    description?: string;
    tags?: string[];
}

/* ─────────────────────────────────────────
   Skeleton — 목록과 동일한 패턴 사용
───────────────────────────────────────── */
const SkeletonDetail = () => (
    <div className="min-h-screen bg-neutral-950 px-4 py-6 w-full max-w-md mx-auto animate-pulse">
        {/* 뒤로가기 */}
        <div className="w-20 h-5 bg-neutral-800 rounded mb-8" />

        {/* 작성자 헤더 */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-800" />
                <div className="w-24 h-4 bg-neutral-800 rounded" />
            </div>
            <div className="w-12 h-4 bg-neutral-800 rounded" />
        </div>

        {/* 제목 */}
        <div className="w-48 h-7 bg-neutral-800 rounded mb-6" />

        {/* LP 플레이어 영역 */}
        <div className="w-full aspect-square bg-neutral-800 rounded-2xl mb-6" />

        {/* 본문 */}
        <div className="space-y-2 mb-6">
            <div className="w-full h-4 bg-neutral-800 rounded" />
            <div className="w-4/5 h-4 bg-neutral-800 rounded" />
        </div>

        {/* 태그 */}
        <div className="flex gap-2 mb-6">
            {[60, 72, 56, 80].map((w, i) => (
                <div key={i} className="h-6 bg-neutral-800 rounded-full" style={{ width: w }} />
            ))}
        </div>

        {/* 좋아요 */}
        <div className="w-16 h-6 bg-neutral-800 rounded" />
    </div>
);

/* ─────────────────────────────────────────
   Error State — 목록과 동일한 패턴 사용
───────────────────────────────────────── */
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
            <RotateCcw size={24} className="text-neutral-500" />
        </div>
        <p className="text-neutral-400 text-sm text-center">데이터를 불러오지 못했어요.</p>
        <button
            onClick={onRetry}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm transition"
        >
            다시 시도
        </button>
    </div>
);

/* ─────────────────────────────────────────
   Spinning LP Disc
───────────────────────────────────────── */
const SpinningLP = ({ cover, title, isPlaying }: { cover: string; title: string; isPlaying: boolean }) => (
    <div className="relative w-full flex items-center justify-center select-none py-6"
         style={{ background: "radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 70%)" }}>
        {/* 외곽 바닥 그림자 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-black/60 blur-2xl rounded-full" />

        {/* LP 디스크 — 화면 너비의 85% */}
        <div
            className="relative rounded-full overflow-hidden"
            style={{
                width: "min(85vw, 500px)",
                height: "min(85vw, 500px)",
                animation: isPlaying ? "lp-spin 4s linear infinite" : "none",
                boxShadow: "0 0 0 3px #2a2a2a, 0 0 0 6px #111, 0 12px 60px rgba(0,0,0,0.9), 0 0 80px rgba(236,72,153,0.08)",
            }}
        >
            {/* 앨범 커버 이미지 (LP 모양) */}
            <img
                src={cover}
                alt={title}
                className="w-full h-full object-cover"
                onError={e => {
                    (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x400/1a1a1a/555?text=LP";
                }}
            />

            {/* LP 그루브 오버레이 */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: `
                        repeating-radial-gradient(
                            circle at 50% 50%,
                            transparent 0px,
                            transparent 6px,
                            rgba(0,0,0,0.12) 6px,
                            rgba(0,0,0,0.12) 7px
                        )
                    `,
                }}
            />

            {/* 중앙 라벨 */}
            <div
                className="absolute inset-0 m-auto rounded-full flex items-center justify-center"
                style={{
                    width: "28%",
                    height: "28%",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, #1f1f1f 60%, #111 100%)",
                    boxShadow: "0 0 0 2px #333",
                }}
            >
                {/* 중앙 홀 */}
                <div className="w-3 h-3 rounded-full bg-neutral-950 border border-neutral-700" />
            </div>
        </div>
    </div>
);

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export const LpDetail = () => {
    const { lpId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editArtist, setEditArtist] = useState("");
    const [liked, setLiked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);

    /* ── 데이터 패칭: queryKey에 lpId 포함 ── */
    const {
        data: lp,
        isLoading,
        isError,
        refetch,
    } = useQuery<LP>({
        queryKey: ["lp", lpId],   // ✅ lpId 포함
        queryFn: async () => {
            const res = await axiosInstance.get(`/v1/lps/${lpId}`);
            return res.data;
        },
    });

    /* ── Mutations ── */
    const editMutation = useMutation({
        mutationFn: () =>
            axiosInstance.patch(`/v1/lps/${lpId}`, { title: editTitle, artist: editArtist }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lp", lpId] });
            queryClient.invalidateQueries({ queryKey: ["lps"] });
            setIsEditing(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => axiosInstance.delete(`/v1/lps/${lpId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lps"] });
            navigate("/");
        },
    });

    const likeMutation = useMutation({
        mutationFn: () => axiosInstance.post(`/v1/lps/${lpId}/like`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lp", lpId] });
            setLiked(true);
        },
    });

    /* ── Handlers ── */
    const handleEditStart = () => {
        setEditTitle(lp?.title || "");
        setEditArtist(lp?.artist || "");
        setIsEditing(true);
    };

    const handleDelete = () => {
        if (confirm("정말 삭제하시겠어요?")) deleteMutation.mutate();
    };

    const formatDate = (dateStr: string) => {
        const diff = Math.floor(
            (Date.now() - new Date(dateStr).getTime()) / 1000 / 60 / 60 / 24
        );
        if (diff === 0) return "오늘";
        return `${diff}일 전`;
    };

    /* ── 로딩 / 에러 — 목록과 동일한 컴포넌트 패턴 ── */
    if (isLoading) return <SkeletonDetail />;
    if (isError) return <ErrorState onRetry={() => refetch()} />;

    return (
        <>
            {/* ── LP 스핀 애니메이션 keyframe ── */}
            <style>{`
                @keyframes lp-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>

            <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
            {/* 상단 텍스트 영역 — 컨텐츠 폭 제한 */}
            <div className="w-full max-w-md mx-auto px-6 pt-6 flex-shrink-0">

                {/* ── 섹션 1: 네비게이션 ── */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-neutral-400 hover:text-white mb-8 transition text-sm"
                >
                    <ChevronLeft size={18} />
                    뒤로가기
                </button>

                {/* ── 섹션 2: 작성자 헤더 ── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                            {lp?.artist?.[0] ?? "?"}
                        </div>
                        <span className="text-sm text-neutral-300 font-medium">{lp?.artist}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                        {lp?.createdAt ? formatDate(lp.createdAt) : ""}
                    </span>
                </div>

                {/* ── 섹션 3: 제목 + 수정/삭제 버튼 ── */}
                <div className="flex items-center justify-between mb-6">
                    {isEditing ? (
                        <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-pink-500 text-lg font-bold flex-1 mr-2"
                            autoFocus
                        />
                    ) : (
                        <h1 className="text-xl font-bold truncate mr-2">{lp?.title}</h1>
                    )}

                    {/* ✅ 수정/삭제 버튼 UI 배치 */}
                    <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => editMutation.mutate()}
                                    disabled={editMutation.isPending}
                                    className="text-xs px-3 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg transition"
                                >
                                    저장
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-xs px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition"
                                >
                                    취소
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleEditStart}
                                    className="text-neutral-400 hover:text-white transition"
                                    aria-label="수정"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="text-neutral-400 hover:text-red-500 disabled:opacity-50 transition"
                                    aria-label="삭제"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>{/* end 상단 텍스트 영역 */}

                {/* ── 섹션 4: LP 플레이어 — full-width, 정사각형 ── */}
                <div
                    className="w-full cursor-pointer relative"
                    style={{ maxWidth: "100vw" }}
                    onClick={() => setIsPlaying(p => !p)}
                    title={isPlaying ? "일시정지" : "재생"}
                >
                    <SpinningLP
                        cover={lp?.cover ?? ""}
                        title={lp?.title ?? ""}
                        isPlaying={isPlaying}
                    />
                    <p className="text-center text-xs text-neutral-600 pb-3">
                        {isPlaying ? "탭하면 정지" : "탭하면 재생"}
                    </p>
                </div>

            {/* 하단 텍스트 영역 — 컨텐츠 폭 제한 */}
            <div className="w-full max-w-md mx-auto px-6 pb-8 flex-shrink-0">

                {/* 아티스트 수정 인풋 (편집 모드) */}
                {isEditing && (
                    <input
                        value={editArtist}
                        onChange={e => setEditArtist(e.target.value)}
                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-pink-500 text-sm w-full mb-4"
                        placeholder="아티스트"
                    />
                )}

                {/* ── 섹션 5: 본문 설명 ── */}
                {lp?.description && (
                    <p className="text-sm text-neutral-400 leading-relaxed mb-5 mt-2">
                        {lp.description}
                    </p>
                )}

                {/* ── 섹션 6: 태그 ── */}
                {lp?.tags && lp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {lp.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs hover:bg-neutral-700 transition cursor-default"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── 섹션 7: 좋아요 버튼 ── */}
                <div className="flex items-center gap-2 pt-4 border-t border-neutral-800">
                    <button
                        onClick={() => !liked && likeMutation.mutate()}
                        disabled={liked || likeMutation.isPending}
                        className={`flex items-center gap-1.5 transition ${
                            liked
                                ? "text-pink-500 cursor-default"
                                : "text-neutral-400 hover:text-pink-500"
                        }`}
                        aria-label="좋아요"
                    >
                        <Heart
                            size={20}
                            fill={liked ? "currentColor" : "none"}
                            className={liked ? "" : "transition-transform hover:scale-110"}
                        />
                        <span className="text-sm font-medium">{lp?.likes ?? 0}</span>
                    </button>
                </div>
            </div>
            </div>
        </>
    );
};