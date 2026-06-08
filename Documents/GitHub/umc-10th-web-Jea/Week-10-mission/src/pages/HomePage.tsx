import { useState, useCallback } from 'react'
import SearchForm from '../components/SearchForm'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
import { searchMovies, type Movie } from '../api/tmdb'

export default function HomePage() {
  const [query, setQuery] = useState<string>('')
  const [includeAdult, setIncludeAdult] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>('ko-KR')
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searched, setSearched] = useState<boolean>(false)
  const [searchedQuery, setSearchedQuery] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)  // ← 추가

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    setSearchedQuery(query.trim())
    try {
      const results = await searchMovies({ query: query.trim(), language, includeAdult })
      setMovies(results)
    } catch {
      setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setMovies([])
    } finally {
      setLoading(false)
    }
  }, [query, language, includeAdult])

  return (
    <main className="max-w-[860px] mx-auto px-5 pt-7 pb-16">
      <SearchForm
        query={query} setQuery={setQuery}
        includeAdult={includeAdult} setIncludeAdult={setIncludeAdult}
        language={language} setLanguage={setLanguage}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* 결과 영역 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b7280]">
          <div className="w-9 h-9 rounded-full border-[3px] border-[#1e2333] border-t-[#3d7ef5] animate-spin-custom mb-4" />
          <p className="text-sm">검색 중...</p>
        </div>

      ) : error ? (
        <div className="text-center py-20 text-[#6b7280]">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>

      ) : !searched ? (
        <div className="text-center py-20 text-[#6b7280]">
          <div className="text-5xl mb-4">🎥</div>
          <p className="text-sm">영화 제목을 입력하고 검색해보세요.</p>
        </div>

      ) : movies.length === 0 ? (
        <div className="text-center py-20 text-[#6b7280]">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-sm">"{searchedQuery}"에 대한 검색 결과가 없습니다.</p>
        </div>

      ) : (
        <div>
          <p className="text-[13px] text-[#6b7280] mb-5">
            "<strong className="text-[#e8c94a]">{searchedQuery}</strong>" 검색 결과{' '}
            <strong className="text-[#e8c94a]">{movies.length}</strong>개
          </p>
          <div className="grid grid-cols-4 gap-[18px]">
            {movies.map((movie, i) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                index={i}
                onClick={setSelectedMovie}  // ← 추가
              />
            ))}
          </div>
        </div>
      )}

      {/* 모달 */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </main>
  )
}