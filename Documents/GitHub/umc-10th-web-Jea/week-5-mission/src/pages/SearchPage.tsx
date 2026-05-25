import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X, Clock } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import useDebounce from "../hooks/useDebounce";

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

const fetchSearchLps = async ({
    query,
    cursor,
}: {
    query: string;
    cursor: number | null;
}): Promise<LPPage> => {
    const params = new URLSearchParams({ search: query });
    if (cursor !== null) params.append("cursor", String(cursor));
    const res = await axiosInstance.get(`/v1/lps?${params.toString()}`);
    if (Array.isArray(res.data)) return { data: res.data, nextCursor: null };
    return res.data;
};

const RECENT_KEY = "recentSearches";

const getRecentSearches = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
        return [];
    }
};

const saveRecentSearch = (query: string) => {
    const prev = getRecentSearches().filter(q => q !== query);
    const updated = [query, ...prev].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};

const removeRecentSearch = (query: string) => {
    const updated = getRecentSearches().filter(q => q !== query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};

const SkeletonCard = () => (
    <div className="aspect-square rounded-lg bg-neutral-800 animate-pulse" />
);

export const SearchPage = () => {
    const navigate = useNavigate();
    const [input, setInput] = useState("");
    const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // ✅ useDebounce로 지연된 값 생성 (300ms)
    const debouncedQuery = useDebounce(input, 300);

    // ✅ useInfiniteQuery 연계
    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        // ✅ queryKey에 지연된 값 포함
        queryKey: ["search", debouncedQuery] as string[],
        queryFn: ({ pageParam }: { pageParam: number | null }) =>
            fetchSearchLps({ query: debouncedQuery, cursor: pageParam }),
        initialPageParam: null as number | null,
        // ✅ getNextPageParam으로 cursor/nextCursor 기반 페이지네이션
        getNextPageParam: (lastPage: LPPage) =>
            lastPage.nextCursor ?? undefined,
        // ✅ 빈 검색어일 땐 쿼리 실행 안 함
        enabled: debouncedQuery.trim().length > 0,
        // ✅ staleTime / gcTime 설정으로 불필요한 재요청 감소
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 2,
    });

    const allResults: LP[] = data?.pages.flatMap((page: LPPage) => page.data) ?? [];

    // 무한 스크롤 sentinel
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

    const handleSelectRecent = (query: string) => {
        setInput(query);
    };

    const handleSaveRecent = (query: string) => {
        if (!query.trim()) return;
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
    };

    const handleRemoveRecent = (query: string) => {
        removeRecentSearch(query);
        setRecentSearches(getRecentSearches());
    };

    const handleClearAll = () => {
        localStorage.removeItem(RECENT_KEY);
        setRecentSearches([]);
    };

    const showSkeleton = isLoading && debouncedQuery.trim().length > 0;
    const showEmpty = !isLoading && debouncedQuery.trim().length > 0 && allResults.length === 0;
    const showResults = !isLoading && allResults.length > 0;
    const showRecent = debouncedQuery.trim().length === 0 && recentSearches.length > 0;
    const showInitial = debouncedQuery.trim().length === 0 && recentSearches.length === 0;

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* 검색 인풋 */}
                <div className="flex items-center gap-3 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 mb-6 focus-within:border-pink-500 transition">
                    <Search size={18} className="text-neutral-400 shrink-0" />
                    <input
                        autoFocus
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleSaveRecent(input);
                        }}
                        placeholder="제목 또는 아티스트로 검색"
                        className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                    />
                    {input && (
                        <button
                            onClick={() => setInput("")}
                            className="text-neutral-400 hover:text-white transition shrink-0"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* 최근 검색어 */}
                {showRecent && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-neutral-400">최근 검색어</span>
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-neutral-500 hover:text-white transition"
                            >
                                모두 지우기
                            </button>
                        </div>
                        <div className="flex flex-col gap-1">
                            {recentSearches.map(query => (
                                <div
                                    key={query}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition group cursor-pointer"
                                    onClick={() => handleSelectRecent(query)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock size={14} className="text-neutral-500" />
                                        <span className="text-sm text-neutral-300">{query}</span>
                                    </div>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleRemoveRecent(query);
                                        }}
                                        className="text-neutral-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 초기 상태 */}
                {showInitial && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Search size={36} className="text-neutral-700" />
                        <p className="text-neutral-500 text-sm">검색어를 입력해주세요.</p>
                    </div>
                )}

                {/* 스켈레톤 */}
                {showSkeleton && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {/* 검색 결과 없음 */}
                {showEmpty && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Search size={36} className="text-neutral-700" />
                        <p className="text-neutral-500 text-sm">
                            <span className="text-white font-medium">"{debouncedQuery}"</span>에 대한 결과가 없어요.
                        </p>
                    </div>
                )}

                {/* 검색 결과 */}
                {showResults && (
                    <>
                        <p className="text-xs text-neutral-500 mb-4">
                            <span className="text-white font-medium">"{debouncedQuery}"</span> 검색 결과 {allResults.length}개
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {allResults.map(lp => (
                                <div
                                    key={lp.id}
                                    onClick={() => {
                                        handleSaveRecent(input);
                                        navigate(`/lp/${lp.id}`);
                                    }}
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

                        {/* 추가 로딩 스켈레톤 */}
                        {isFetchingNextPage && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <SkeletonCard key={`next-${i}`} />
                                ))}
                            </div>
                        )}

                        {/* 무한 스크롤 sentinel */}
                        <div ref={sentinelRef} className="h-4 mt-4" />

                        {!hasNextPage && allResults.length > 0 && (
                            <p className="text-center text-neutral-700 text-xs py-4">
                                모든 결과를 불러왔어요.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};