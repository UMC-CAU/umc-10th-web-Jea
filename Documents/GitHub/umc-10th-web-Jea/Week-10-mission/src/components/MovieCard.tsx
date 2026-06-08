import { type Movie, IMG_BASE } from '../api/tmdb'

interface MovieCardProps {
  movie: Movie
  index: number
  onClick: (movie: Movie) => void   // ← 추가
}

function formatDate(d: string): string {
  if (!d) return '날짜 미정'
  const [y, m, day] = d.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(day)}일`
}

export default function MovieCard({ movie, index, onClick }: MovieCardProps) {
  return (
    <div
      className="animate-fade-in-up bg-[#161a24] border border-white/[0.07] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:border-[#3d7ef5]/30"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => onClick(movie)}   // ← 추가
    >
      {/* 포스터 */}
      <div className="relative bg-[#1e2333]" style={{ aspectRatio: '2/3' }}>
        {movie.poster_path ? (
          <img
            src={IMG_BASE + movie.poster_path}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover block"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #1e2333, #12151f)' }}
          >
            🎬
          </div>
        )}
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/75 backdrop-blur border border-white/10 rounded-md px-2 py-[3px] text-xs font-bold text-[#e8c94a]">
            {movie.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <div className="text-[13px] font-bold text-[#e8eaf0] mb-1 leading-[1.4] line-clamp-2">
          {movie.title}
        </div>
        <div className="text-[11px] text-[#6b7280] mb-2">
          {formatDate(movie.release_date)}
        </div>
        {movie.overview && (
          <div className="text-[11px] text-[#8a9099] leading-[1.5] line-clamp-3">
            {movie.overview}
          </div>
        )}
      </div>
    </div>
  )
}