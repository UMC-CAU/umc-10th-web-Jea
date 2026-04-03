import axios from 'axios';
import { type MovieResponse, type Movie } from '../types/movie';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'

const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMGNjOTVlYzA0NGNkMDAxZGE2MTdlYmQ0YWM1NmYyNyIsIm5iZiI6MTc3NDg1Mjc4OS44MzcsInN1YiI6IjY5Y2ExYWI1M2NiMjJmOGI1ZGNlMzg0ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A_5DIJZDguvuQ0sgNKJhgP0YihVU4aqeI7AfZq6eZa0';

const MoviePage = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchMovies = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await axios.get<MovieResponse>(
                    `https://api.themoviedb.org/3/movie/popular?language=ko-KR&page=${page}`,
                    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
                );
                setMovies(data.results);
                setTotalPages(data.total_pages);
            } catch (err) {
                setError('영화 데이터를 불러오는 데 실패했습니다. 다시 시도해주세요.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovies();
    }, [page]);

    const handlePrev = () => {
        if (page > 1) setPage(prev => prev - 1);
    };

    const handleNext = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <p className="text-red-500 text-lg font-medium">{error}</p>
                <button
                    onClick={() => setPage(1)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-center items-center gap-4 my-6">
                <button
                    onClick={handlePrev}
                    disabled={page === 1}
                    className={`w-10 h-10 rounded-lg border border-gray-300 bg-gray-100 text-gray-800 text-lg cursor-pointer transition-opacity ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                >
                    ‹
                </button>
                <span className="text-gray-800 text-sm min-w-[80px] text-center font-medium">
                    {page} 페이지
                </span>
                <button
                    onClick={handleNext}
                    disabled={page === totalPages}
                    className={`w-10 h-10 rounded-lg border-none bg-red-500 text-white text-lg cursor-pointer transition-opacity ${page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-600'}`}
                >
                    ›
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-6">
                {movies.map((movie) => (
                    <Link key={movie.id} to={`/movies/${movie.id}`}className="relative group cursor-pointer">
                        <img
                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            alt={movie.title}
                            className="rounded-lg block w-full transition-all duration-300 group-hover:blur-sm group-hover:brightness-50"
                        />
                        <div className="absolute inset-0 flex flex-col justify-center items-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-sm font-bold text-center mb-2 line-clamp-2">
                                {movie.title}
                            </p>
                            <p className="text-gray-300 text-xs text-center line-clamp-4">
                                {movie.overview || '줄거리 정보가 없습니다.'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default MoviePage;