import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, User, LogOut, Search, RefreshCw } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

interface LP {
    id: number;
    title: string;
    artist: string;
    cover: string;
    likes: number;
    createdAt: string;
}

// 서버 응답이 배열이므로 페이지 단위로 래핑하는 타입
interface LPPage {
    data: LP[];
    nextCursor: number | null;
}

interface OutletContext {
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
}

/* ── API: 서버는 LP[] 배열을 그대로 반환 ── */
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

    // 서버가 LP[] 배열로 응답 → LPPage로 래핑
    if (Array.isArray(res.data)) {
        return { data: res.data, nextCursor: null };
    }
    // 서버가 { data, nextCursor } 구조로 응답하는 경우
    return res.data;
};

/* ── AddModal ── */
const AddModal = ({
    onClose,
    onAdd,
}: {
    onClose: () => void;
    onAdd: (lp: { title: string; artist: string; cover: string }) => void;
}) => {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [cover, setCover] = useState("");

    const handleSubmit = () => {
        if (!title || !artist) return;
        onAdd({ title, artist, cover });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">곡 추가하기</span>
                    <button onClick={onClose}>
                        <X size={20} className="text-neutral-400 hover:text-white" />
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="곡 제목"
                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                    />
                    <input
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                        placeholder="아티스트"
                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                    />
                    <input
                        value={cover}
                        onChange={e => setCover(e.target.value)}
                        placeholder="앨범 커버 URL (선택)"
                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-pink-500 transition"
                    />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!title || !artist}
                    className={`py-3 rounded-lg font-bold transition ${
                        title && artist
                            ? "bg-pink-500 hover:bg-pink-600 text-white"
                            : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }`}
                >
                    추가하기
                </button>
            </div>
        </div>
    );
};

/* ── Skeleton ── */
const SkeletonCard = () => (
    <div className="aspect-square rounded-lg bg-neutral-800 animate-pulse" />
);

/* ── HomePage ── */
export const HomePage = () => {
    const [showModal, setShowModal] = useState(false);
    const [sort, setSort] = useState<"newest" | "oldest">("newest");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { sidebarOpen, setSidebarOpen } = useOutletContext<OutletContext>();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    /* ── 사이드바 외부 클릭 닫기 ── */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setSidebarOpen(false);
            }
        };
        if (sidebarOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sidebarOpen]);

    /* ── useInfiniteQuery ── */
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
        getNextPageParam: (lastPage: LPPage) =>
            lastPage.nextCursor ?? undefined,
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
    });

    /* ── 모든 페이지 LP 합산 ── */
    const allLps: LP[] = data?.pages.flatMap((page: LPPage) => page.data) ?? [];

    /* ── 검색 필터 ── */
    const filtered = allLps.filter(
        lp => lp.title.includes(search) || lp.artist.includes(search)
    );

    /* ── IntersectionObserver → fetchNextPage ── */
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

    /* ── LP 추가 mutation ── */
    const addMutation = useMutation({
        mutationFn: (newLp: { title: string; artist: string; cover: string }) =>
            axiosInstance.post("/v1/lps", newLp),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lps"] });
        },
    });

    return (
        <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30" />}

            {/* ── 사이드바 ── */}
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
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-left">
                    <LogOut size={16} className="flex-shrink-0" />
                    탈퇴하기
                </button>
            </div>

            {/* ── 메인 ── */}
            <main className="flex-1 bg-neutral-950 px-4 md:px-8 py-6">
                {/* 정렬 토글 + 검색 */}
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

                    {/* 검색 인풋 */}
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

                {/* 로딩 — 첫 페이지 스켈레톤 */}
                {isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {/* 에러 상태 */}
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

                {/* LP 그리드 */}
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

                            {/* 다음 페이지 로딩 스켈레톤 */}
                            {isFetchingNextPage && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <SkeletonCard key={`next-${i}`} />
                                    ))}
                                </div>
                            )}

                            {/* 무한 스크롤 sentinel */}
                            <div ref={sentinelRef} className="h-4 mt-4" />

                            {/* 마지막 페이지 안내 */}
                            {!hasNextPage && allLps.length > 0 && (
                                <p className="text-center text-neutral-600 text-xs mt-6 pb-4">
                                    모든 LP를 불러왔어요.
                                </p>
                            )}
                        </>
                    )
                )}
            </main>

            {/* + 버튼 */}
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
        </div>
    );
};