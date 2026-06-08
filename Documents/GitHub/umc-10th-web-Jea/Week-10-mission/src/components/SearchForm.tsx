interface SearchFormProps {
  query: string
  setQuery: (v: string) => void
  includeAdult: boolean
  setIncludeAdult: (v: boolean) => void
  language: string
  setLanguage: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
}

export default function SearchForm({
  query, setQuery,
  includeAdult, setIncludeAdult,
  language, setLanguage,
  onSubmit,
  loading,
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="bg-[#161a24] border border-white/[0.07] rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)] mb-8">

        {/* 상단 2열 그리드 */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          {/* 영화 제목 */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6b7280] mb-2">
              🎬 영화 제목
            </label>
            <input
              type="text"
              placeholder="영화 제목을 입력하세요"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              className="w-full bg-[#1e2333] border border-white/[0.07] rounded-xl px-4 py-3 text-[#e8eaf0] text-sm outline-none placeholder:text-[#6b7280] focus:border-[#3d7ef5] focus:ring-2 focus:ring-[#3d7ef5]/20 transition-all"
            />
          </div>

          {/* 성인 콘텐츠 체크박스 */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6b7280] mb-2">
              ⚙️ 옵션
            </label>
            <label className="flex items-center gap-3 bg-[#1e2333] border border-white/[0.07] rounded-xl px-4 h-[46px] cursor-pointer hover:border-white/20 transition-all">
              <input
                type="checkbox"
                checked={includeAdult}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeAdult(e.target.checked)}
                className="hidden"
              />
              <div
                className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all text-white text-xs font-bold
                  ${includeAdult
                    ? 'bg-[#3d7ef5] border-[#3d7ef5]'
                    : 'bg-[#161a24] border-[#6b7280]'
                  }`}
              >
                {includeAdult && '✓'}
              </div>
              <span className="text-[13px] text-[#e8eaf0] select-none">성인 콘텐츠 표시</span>
            </label>
          </div>
        </div>

        {/* 언어 선택 */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#6b7280] mb-2">
            🌐 언어
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
              className="w-full bg-[#1e2333] border border-white/[0.07] rounded-xl px-4 py-3 text-[#e8eaf0] text-sm outline-none appearance-none cursor-pointer focus:border-[#3d7ef5] focus:ring-2 focus:ring-[#3d7ef5]/20 transition-all"
            >
              <option value="ko-KR">한국어</option>
              <option value="en-US">영어</option>
              <option value="ja-JP">일본어</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280]">
              <svg width="12" height="8" fill="none" viewBox="0 0 12 8">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full py-[14px] bg-[#3d7ef5] rounded-xl text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(61,126,245,0.3)] hover:bg-[#5a8ff7] hover:shadow-[0_6px_24px_rgba(61,126,245,0.4)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          🔍 검색하기
        </button>

      </div>
    </form>
  )
}