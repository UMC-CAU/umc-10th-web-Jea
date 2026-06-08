import { useEffect } from 'react'
import { type Movie, IMG_BASE } from '../api/tmdb'

interface MovieModalProps {
  movie: Movie
  onClose: () => void
}

function formatDate(d: string): string {
  if (!d) return '날짜 미정'
  const [y, m, day] = d.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(day)}일`
}

export default function MovieModal({ movie, onClose }: MovieModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    // 모달 열릴 때 스크롤 막기
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const imdbUrl = `https://www.imdb.com/find?q=${encodeURIComponent(movie.title)}`
  const backdropUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : null

  return (
    // 배경 오버레이
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* 모달 박스 */}
      <div
        className="relative w-full max-w-[680px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        style={{ background: '#161a24', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg transition-all hover:bg-white/20"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          ✕
        </button>

        {/* 상단 배경 이미지 */}
        <div className="relative w-full overflow-hidden" style={{ height: 260 }}>
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: 'linear-gradient(135deg, #1e2333, #12151f)' }}
            >
              🎬
            </div>
          )}
          {/* 하단 그라데이션 페이드 */}
          <div
            className="absolute inset-x-0 bottom-0 h-32"
            style={{ background: 'linear-gradient(to bottom, transparent, #161a24)' }}
          />
          {/* 제목 오버레이 */}
          <div className="absolute bottom-0 left-0 px-6 pb-4">
            <h2 className="text-2xl font-bold text-white leading-tight">{movie.title}</h2>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-sm mt-1" style={{ color: '#8a9099' }}>{movie.original_title}</p>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="flex gap-5 px-6 pt-4 pb-6">
          {/* 좌측 포스터 */}
          <div className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)]" style={{ marginTop: -48 }}>
            {movie.poster_path ? (
              <img
                src={IMG_BASE + movie.poster_path}
                alt={movie.title}
                className="w-full h-auto block"
              />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center text-3xl"
                style={{ background: '#1e2333' }}
              >
                🎬
              </div>
            )}
          </div>

          {/* 우측 정보 */}
          <div className="flex-1 min-w-0">
            {/* 평점 */}
            {movie.vote_average > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold" style={{ color: '#3d7ef5' }}>
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="text-sm" style={{ color: '#6b7280' }}>
                  ({movie.vote_count?.toLocaleString() ?? 0} 평가)
                </span>
              </div>
            )}

            {/* 개봉일 */}
            <div className="mb-3">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>
                개봉일
              </div>
              <div className="text-sm font-medium" style={{ color: '#e8eaf0' }}>
                {formatDate(movie.release_date)}
              </div>
            </div>

            {/* 인기도 */}
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>
                인기도
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2333' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((movie.popularity ?? 0) / 300 * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #3d7ef5, #e8c94a)',
                  }}
                />
              </div>
            </div>

            {/* 줄거리 */}
            {movie.overview && (
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>
                  줄거리
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#c0c4cc' }}>
                  {movie.overview}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 px-6 pb-6">
            <button
                onClick={() => window.open(imdbUrl, '_blank', 'noopener,noreferrer')}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#3d7ef5' }}
            >
                IMDb에서 검색
            </button>
            <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e8eaf0' }}
            >
                닫기
            </button>
        </div>
        
      </div>
    </div>
  )
}