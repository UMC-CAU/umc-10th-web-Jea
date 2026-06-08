const TOKEN = import.meta.env.VITE_TMDB_TOKEN as string
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p/w342'

export interface Movie {
  id: number
  title: string
  original_title: string    
  poster_path: string | null
  release_date: string
  overview: string
  vote_average: number
  vote_count: number            
  popularity: number           
}

export interface SearchParams {
  query: string
  language: string
  includeAdult: boolean
}

async function tmdbFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function searchMovies({ query, language, includeAdult }: SearchParams): Promise<Movie[]> {
  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=${language}&include_adult=${includeAdult}&page=1`
  const res = await tmdbFetch(url)
  if (!res.ok) throw new Error('API 오류')
  const data = await res.json()
  return data.results as Movie[]
}