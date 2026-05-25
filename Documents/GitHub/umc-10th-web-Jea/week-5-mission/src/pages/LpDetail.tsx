import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Pencil, Trash2, Heart, RotateCcw, Send, MoreVertical, Check } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

interface LP {
    id: number;
    title: string;
    artist: string;
    authorId: number;
    cover: string;
    likes: number;
    likedByMe?: boolean;
    createdAt: string;
    description?: string;
    tags?: string[];
}

interface Comment {
    id: number;
    content: string;
    author: string;
    authorId: number;
    createdAt: string;
}

interface CommentPage {
    data: Comment[];
    nextCursor: number | null;
}

const fetchComments = async ({
    lpId,
    order,
    cursor,
}: {
    lpId: string;
    order: "newest" | "oldest";
    cursor: number | null;
}): Promise<CommentPage> => {
    const params = new URLSearchParams({ order });
    if (cursor !== null) params.append("cursor", String(cursor));
    const res = await axiosInstance.get(`/v1/lps/${lpId}/comments?${params.toString()}`);
    if (Array.isArray(res.data)) return { data: res.data, nextCursor: null };
    return res.data;
};

const getCurrentUser = () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
};

const SkeletonDetail = () => (
    <div className="min-h-screen bg-neutral-950 px-4 py-6 w-full max-w-md mx-auto animate-pulse">
        <div className="w-20 h-5 bg-neutral-800 rounded mb-8" />
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-800" />
                <div className="w-24 h-4 bg-neutral-800 rounded" />
            </div>
            <div className="w-12 h-4 bg-neutral-800 rounded" />
        </div>
        <div className="w-48 h-7 bg-neutral-800 rounded mb-6" />
        <div className="w-full aspect-square bg-neutral-800 rounded-2xl mb-6" />
        <div className="space-y-2 mb-6">
            <div className="w-full h-4 bg-neutral-800 rounded" />
            <div className="w-4/5 h-4 bg-neutral-800 rounded" />
        </div>
        <div className="flex gap-2 mb-6">
            {[60, 72, 56, 80].map((w, i) => (
                <div key={i} className="h-6 bg-neutral-800 rounded-full" style={{ width: w }} />
            ))}
        </div>
        <div className="w-16 h-6 bg-neutral-800 rounded" />
    </div>
);

const SkeletonComment = () => (
    <div className="animate-pulse flex flex-col gap-2 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-800" />
            <div className="w-20 h-3 bg-neutral-800 rounded" />
            <div className="w-12 h-3 bg-neutral-700 rounded ml-auto" />
        </div>
        <div className="w-4/5 h-4 bg-neutral-800 rounded" />
    </div>
);

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

const SpinningLP = ({ cover, title, isPlaying }: {
    cover: string;
    title: string;
    isPlaying: boolean;
}) => (
    <div
        className="relative w-full flex items-center justify-center select-none py-6"
        style={{ background: "radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 70%)" }}
    >
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-black/60 blur-2xl rounded-full" />
        <div
            className="relative rounded-full overflow-hidden"
            style={{
                width: "min(85vw, 500px)",
                height: "min(85vw, 500px)",
                animation: isPlaying ? "lp-spin 4s linear infinite" : "none",
                boxShadow: "0 0 0 3px #2a2a2a, 0 0 0 6px #111, 0 12px 60px rgba(0,0,0,0.9), 0 0 80px rgba(236,72,153,0.08)",
            }}
        >
            <img
                src={cover}
                alt={title}
                className="w-full h-full object-cover"
                onError={e => {
                    (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x400/1a1a1a/555?text=LP";
                }}
            />
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: `repeating-radial-gradient(
                        circle at 50% 50%,
                        transparent 0px, transparent 6px,
                        rgba(0,0,0,0.12) 6px, rgba(0,0,0,0.12) 7px
                    )`,
                }}
            />
            <div
                className="absolute rounded-full flex items-center justify-center"
                style={{
                    width: "28%", height: "28%",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, #1f1f1f 60%, #111 100%)",
                    boxShadow: "0 0 0 2px #333",
                }}
            >
                <div className="w-3 h-3 rounded-full bg-neutral-950 border border-neutral-700" />
            </div>
        </div>
    </div>
);

export const LpDetail = () => {
    const { lpId } = useParams<{ lpId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = getCurrentUser();

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editArtist, setEditArtist] = useState("");
    const [isPlaying, setIsPlaying] = useState(true);
    const [order, setOrder] = useState<"newest" | "oldest">("newest");
    const [commentText, setCommentText] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const { data: lp, isLoading, isError, refetch } = useQuery<LP>({
        queryKey: ["lp", lpId],
        queryFn: async () => {
            const res = await axiosInstance.get(`/v1/lps/${lpId}`);
            return res.data;
        },
    });

    const isMyLp = currentUser && lp && currentUser.id === lp.authorId;

    const {
        data: commentData,
        isLoading: isCommentsLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: ["lpComments", lpId, order] as string[],
        queryFn: ({ pageParam }: { pageParam: number | null }) =>
            fetchComments({ lpId: lpId!, order, cursor: pageParam }),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage: CommentPage) =>
            lastPage.nextCursor ?? undefined,
    });

    const allComments: Comment[] = commentData?.pages.flatMap(
        (page: CommentPage) => page.data
    ) ?? [];

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

    useEffect(() => {
        const handleClick = () => setOpenMenuId(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    const editMutation = useMutation({
        mutationFn: () =>
            axiosInstance.patch(`/v1/lps/${lpId}`, { title: editTitle, artist: editArtist }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lp", lpId] });
            queryClient.invalidateQueries({ queryKey: ["lps"] });
            setIsEditing(false);
        },
        onError: () => {
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
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["lp", lpId] });
            const previous = queryClient.getQueryData<LP>(["lp", lpId]);
            queryClient.setQueryData<LP>(["lp", lpId], old => {
                if (!old) return old;
                const isLiked = old.likedByMe ?? false;
                return { ...old, likes: old.likes + (isLiked ? -1 : 1), likedByMe: !isLiked };
            });
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["lp", lpId], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["lp", lpId] });
        },
    });

    const commentMutation = useMutation({
        mutationFn: () =>
            axiosInstance.post(`/v1/lps/${lpId}/comments`, { content: commentText }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lpComments", lpId, order] });
            setCommentText("");
        },
        onError: () => {
            alert("댓글 작성에 실패했어요. 다시 시도해주세요.");
        },
    });

    const editCommentMutation = useMutation({
        mutationFn: (commentId: number) =>
            axiosInstance.patch(`/v1/lps/${lpId}/comments/${commentId}`, {
                content: editingCommentText,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lpComments", lpId, order] });
            setEditingCommentId(null);
            setEditingCommentText("");
        },
        onError: () => {
            alert("댓글 수정에 실패했어요. 다시 시도해주세요.");
            setEditingCommentId(null);
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: number) =>
            axiosInstance.delete(`/v1/lps/${lpId}/comments/${commentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lpComments", lpId, order] });
        },
        onError: () => {
            alert("댓글 삭제에 실패했어요. 다시 시도해주세요.");
        },
    });

    const handleEditStart = () => {
        setEditTitle(lp?.title || "");
        setEditArtist(lp?.artist || "");
        setIsEditing(true);
    };
    const handleDelete = () => {
        if (confirm("정말 삭제하시겠어요?")) deleteMutation.mutate();
    };

    const handleCommentSubmit = () => {
        if (!commentText.trim()) return;
        commentMutation.mutate();
    };

    const handleCommentEditStart = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.content);
        setOpenMenuId(null);
    };

    const handleCommentEditSubmit = (commentId: number) => {
        if (!editingCommentText.trim()) return;
        editCommentMutation.mutate(commentId);
    };

    const handleCommentDelete = (commentId: number) => {
        if (confirm("댓글을 삭제하시겠어요?")) {
            deleteCommentMutation.mutate(commentId);
            setOpenMenuId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const diff = Math.floor(
            (Date.now() - new Date(dateStr).getTime()) / 1000 / 60 / 60 / 24
        );
        if (diff === 0) return "오늘";
        if (diff < 60) return `${diff}일 전`;
        return new Date(dateStr).toLocaleDateString();
    };

    if (isLoading) return <SkeletonDetail />;
    if (isError) return <ErrorState onRetry={() => refetch()} />;

    return (
        <>
            <style>{`
                @keyframes lp-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>

            <div className="min-h-screen bg-neutral-950 text-white flex flex-col">

                <div className="w-full max-w-md mx-auto px-6 pt-6 flex-shrink-0">

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-white mb-8 transition text-sm"
                    >
                        <ChevronLeft size={18} />
                        뒤로가기
                    </button>

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

                        {isMyLp && (
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
                        )}
                    </div>
                </div>

                <div
                    className="w-full cursor-pointer"
                    onClick={() => setIsPlaying(p => !p)}
                    title={isPlaying ? "일시정지" : "재생"}
                >
                    <SpinningLP cover={lp?.cover ?? ""} title={lp?.title ?? ""} isPlaying={isPlaying} />
                    <p className="text-center text-xs text-neutral-600 pb-3">
                        {isPlaying ? "탭하면 정지" : "탭하면 재생"}
                    </p>
                </div>

                <div className="w-full max-w-md mx-auto px-6 pb-12 flex-shrink-0">

                    {isEditing && isMyLp && (
                        <input
                            value={editArtist}
                            onChange={e => setEditArtist(e.target.value)}
                            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-pink-500 text-sm w-full mb-4"
                            placeholder="아티스트명"
                        />
                    )}

                    {lp?.description && (
                        <p className="text-sm text-neutral-400 leading-relaxed mb-5 mt-2">
                            {lp.description}
                        </p>
                    )}

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

                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-800 mb-8">
                        <button
                            onClick={() => likeMutation.mutate()}
                            disabled={likeMutation.isPending}
                            className={`flex items-center gap-1.5 transition ${
                                lp?.likedByMe ? "text-pink-500" : "text-neutral-400 hover:text-pink-500"
                            }`}
                            aria-label="좋아요"
                        >
                            <Heart size={20} fill={lp?.likedByMe ? "currentColor" : "none"} />
                            <span className="text-sm font-medium">{lp?.likes ?? 0}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white">댓글</h2>
                        <div className="flex">
                            <button
                                onClick={() => setOrder("oldest")}
                                className={`px-3 py-1 text-xs font-medium border transition rounded-l-md ${
                                    order === "oldest"
                                        ? "bg-white text-black border-white"
                                        : "bg-transparent text-neutral-400 border-neutral-600 hover:text-white"
                                }`}
                            >
                                오래된순
                            </button>
                            <button
                                onClick={() => setOrder("newest")}
                                className={`px-3 py-1 text-xs font-medium border-t border-b border-r transition rounded-r-md ${
                                    order === "newest"
                                        ? "bg-white text-black border-white"
                                        : "bg-transparent text-neutral-400 border-neutral-600 hover:text-white"
                                }`}
                            >
                                최신순
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex gap-2">
                            <input
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleCommentSubmit()}
                                placeholder="댓글을 입력하세요"
                                maxLength={200}
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                            />
                            <button
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim() || commentMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition shrink-0"
                            >
                                <Send size={14} />
                                작성
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 px-1">
                            {commentText.length > 0 && commentText.trim().length === 0 ? (
                                <p className="text-xs text-red-400">공백만 입력할 수 없어요.</p>
                            ) : (
                                <span />
                            )}
                            <p className={`text-xs ml-auto ${commentText.length >= 180 ? "text-red-400" : "text-neutral-600"}`}>
                                {commentText.length}/200
                            </p>
                        </div>
                    </div>

                    {isCommentsLoading && (
                        <div>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonComment key={i} />
                            ))}
                        </div>
                    )}

                    {!isCommentsLoading && (
                        <>
                            {allComments.length === 0 ? (
                                <p className="text-center text-neutral-600 text-sm py-8">
                                    첫 댓글을 남겨보세요!
                                </p>
                            ) : (
                                <div className="flex flex-col">
                                    {allComments.map(comment => {
                                        const isMyComment = currentUser && comment.authorId === currentUser.id;
                                        const isEditingThis = editingCommentId === comment.id;

                                        return (
                                            <div key={comment.id} className="py-4 border-b border-neutral-800">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-pink-500/80 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {comment.author?.[0] ?? "?"}
                                                    </div>
                                                    <span className="text-xs text-neutral-300 font-medium">
                                                        {comment.author}
                                                    </span>
                                                    <span className="text-xs text-neutral-600 ml-auto">
                                                        {formatDate(comment.createdAt)}
                                                    </span>

                                                    {isMyComment && !isEditingThis && (
                                                        <div className="relative">
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(
                                                                        openMenuId === comment.id ? null : comment.id
                                                                    );
                                                                }}
                                                                className="text-neutral-500 hover:text-white transition p-0.5"
                                                            >
                                                                <MoreVertical size={14} />
                                                            </button>

                                                            {openMenuId === comment.id && (
                                                                <div className="absolute right-0 top-6 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10 overflow-hidden w-24">
                                                                    <button
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            handleCommentEditStart(comment);
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-700 transition"
                                                                    >
                                                                        <Pencil size={12} />
                                                                        수정
                                                                    </button>
                                                                    <button
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            handleCommentDelete(comment.id);
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-neutral-700 transition"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                        삭제
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {isEditingThis ? (
                                                    <div className="flex items-center gap-2 pl-8">
                                                        <input
                                                            value={editingCommentText}
                                                            onChange={e => setEditingCommentText(e.target.value)}
                                                            onKeyDown={e => e.key === "Enter" && handleCommentEditSubmit(comment.id)}
                                                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-pink-500 transition"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleCommentEditSubmit(comment.id)}
                                                            disabled={editCommentMutation.isPending}
                                                            className="text-pink-500 hover:text-pink-400 disabled:opacity-40 transition"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCommentId(null)}
                                                            className="text-neutral-500 hover:text-white transition text-xs"
                                                        >
                                                            취소
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-neutral-300 pl-8">
                                                        {comment.content}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {isFetchingNextPage && (
                                <div className="mt-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <SkeletonComment key={`next-${i}`} />
                                    ))}
                                </div>
                            )}

                            <div ref={sentinelRef} className="h-4" />

                            {!hasNextPage && allComments.length > 0 && (
                                <p className="text-center text-neutral-700 text-xs py-4">
                                    모든 댓글을 불러왔어요.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};