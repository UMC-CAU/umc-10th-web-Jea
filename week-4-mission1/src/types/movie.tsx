export type Movie = {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
};

export type MovieResponse = {
    page: number;
    results: Movie[];
    total_pages: number;
    total_results: number;
};

export type MovieDetail = {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    release_date: string;
    vote_average: number;
    runtime: number;
    tagline: string;
    genres: { id: number; name: string }[];
};

export type Cast = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
};

export type Crew = {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
};

export type Credits = {
    cast: Cast[];
    crew: Crew[];
};