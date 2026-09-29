export type Mood =
  "happy" | "relaxed" | "sad" | "anxious" | "angry" | "excited" | "unsure";

export type Occasion =
  "normal" | "alone" | "family" | "date" | "party" | "friends" | "special";

export type Genre =
  | "action"
  | "adventure"
  | "animation"
  | "comedy"
  | "crime"
  | "documentary"
  | "drama"
  | "family"
  | "fantasy"
  | "history"
  | "horror"
  | "music"
  | "mystery"
  | "romance"
  | "sci-fi"
  | "thriller"
  | "war";

export type MovieAge = "any" | "5" | "10" | "20" | "older";
export type MPAA = "G" | "PG" | "PG-13" | "R" | "NC-17";

export type MovieCategory =
  | "award-winning"
  | "high-rated"
  | "popular"
  | "hidden-gem"
  | "book-adaptation"
  | "true-story"
  | "happy-ending"
  | "twist-ending"
  | "famous-cast"
  | "famous-director";

export type QuizAnswers = {
  mood: Mood;
  occasion: Occasion;
  genres: Genre[];
  movieAge: MovieAge;
  mpaaRatings: MPAA[];
  categories: MovieCategory[];
};

export type MovieSummary = {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  fallbackPosterUrl?: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;
  recommendationReasons: string[];
};

export type MovieDetails = MovieSummary & {
  runtime: number | null;
  tagline: string;
  genres: Array<{ id: number; name: string }>;
  certification: string;
  imdbId: string | null;
  omdb: OmdbInfo | null;
  credits: {
    crew: Array<{ id: number; name: string; job: string }>;
    cast: Array<{ id: number; name: string; character: string }>;
  };
  videos: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }>;
  };
};

export type OmdbInfo = {
  rating: string | null;
  metascore: string | null;
  awards: string | null;
  director: string | null;
  actors: string[];
  rated: string | null;
  boxOffice: string | null;
};

export type RecommendationResult = {
  movies: MovieSummary[];
  filtersWereRelaxed: boolean;
};
