import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { type MovieDetail, type Credits } from '../types/movie';

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMGNjOTVlYzA0NGNkMDAxZGE2MTdlYmQ0YWM1NmYyNyIsIm5iZiI6MTc3NDg1Mjc4OS44MzcsInN1YiI6IjY5Y2ExYWI1M2NiMjJmOGI1ZGNlMzg0ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A_5DIJZDguvuQ0sgNKJhgP0YihVU4aqeI7AfZq6eZa0';

const MovieDetailPage = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const [movie, setMovie] = useState<MovieDetail | null>(null);
    const [credits, setCredits] = useState<Credits | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const headers = { Authorization: `Bearer ${ACCESS_TOKEN}` };
                const [movieRes, creditsRes] = await Promise.all([
                    axios.get<MovieDetail>(
                        `https://api.themoviedb.org/3/movie/${movieId}?language=ko-KR`,
                        { headers }
                    ),
                    axios.get<Credits>(
                        `https://api.themoviedb.org/3/movie/${movieId}/credits?language=ko-KR`,
                        { headers }
                    ),
                ]);
                setMovie(movieRes.data);
                setCredits(creditsRes.data);
            } catch(err) {
                console.error(err);
                setError('영화 정보를 불러오는 데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [movieId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    if (!movie) return null;

    const director = credits?.crew.find((c) => c.job === 'Director');

    return (
        <div className="bg-black min-h-screen text-white">
            {/* 배경 + 영화 정보 */}
            <div className="relative">
                <img
                    src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                    alt={movie.title}
                    className="w-full h-[420px] object-cover opacity-40"
                />
                <div className="absolute inset-0 flex items-end p-10">
                    <div>
                        <h1 className="text-4xl font-bold mb-1">{movie.title}</h1>
                        {movie.tagline && (
                            <p className="text-gray-300 text-lg italic mb-3">{movie.tagline}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-300 mb-4">
                            <span>평균 {movie.vote_average.toFixed(1)}</span>
                            <span>{movie.release_date.slice(0, 4)}</span>
                            <span>{movie.runtime}분</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {movie.genres.map((g) => (
                                <span key={g.id} className="px-3 py-1 bg-white/10 rounded-full text-xs">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 줄거리 */}
            <div className="px-10 py-8 max-w-4xl">
                <h2 className="text-xl font-bold mb-3">{movie.tagline || '줄거리'}</h2>
                <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
            </div>

            {/* 감독/출연 */}
            <div className="px-10 pb-12">
                <h2 className="text-xl font-bold mb-6">감독/출연</h2>
                <div className="flex gap-6 overflow-x-auto pb-4">
                    {/* 감독 먼저 */}
                    {director && (
                        <div className="flex flex-col items-center min-w-[80px]">
                            <img
                                src={
                                    director.profile_path
                                        ? `https://image.tmdb.org/t/p/w185${director.profile_path}`
                                        : 'https://placehold.co/80x80/333/fff?text=?'
                                }
                                alt={director.name}
                                className="w-20 h-20 rounded-full object-cover mb-2"
                            />
                            <p className="text-sm font-semibold text-center">{director.name}</p>
                            <p className="text-xs text-gray-400 text-center">감독</p>
                        </div>
                    )}
                    {/* 출연진 */}
                    {credits?.cast.slice(0, 20).map((actor) => (
                        <div key={actor.id} className="flex flex-col items-center min-w-[80px]">
                            <img
                                src={
                                    actor.profile_path
                                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                        : 'https://placehold.co/80x80/333/fff?text=?'
                                }
                                alt={actor.name}
                                className="w-20 h-20 rounded-full object-cover mb-2"
                            />
                            <p className="text-sm font-semibold text-center">{actor.name}</p>
                            <p className="text-xs text-gray-400 text-center">{actor.character}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieDetailPage;