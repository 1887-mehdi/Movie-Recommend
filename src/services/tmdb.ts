import type {
  Genre,
  MovieCategory,
  MovieDetails,
  MovieSummary,
  MPAA,
  OmdbInfo,
  Occasion,
  QuizAnswers,
  RecommendationResult,
} from "../types/movie";
import {
  cachePersianTranslation,
  getCachedPersianTranslation,
  isPersianText,
  translateOverviewToPersian,
} from "./translation";

const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const OMDB_API_BASE = "https://www.omdbapi.com/";

export const genreIds: Record<Genre, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "sci-fi": 878,
  thriller: 53,
  war: 10752,
};

const moodGenres: Record<string, Genre[]> = {
  happy: ["comedy", "animation", "adventure", "family"],
  relaxed: ["comedy", "romance", "animation", "family"],
  sad: ["drama", "romance"],
  anxious: ["thriller", "mystery", "horror"],
  angry: ["action", "thriller", "crime"],
  excited: ["action", "adventure", "thriller", "sci-fi"],
  unsure: [],
};

const occasionGenres: Record<Occasion, Genre[]> = {
  normal: ["comedy", "drama", "action"],
  alone: ["drama", "thriller", "horror", "sci-fi"],
  family: ["animation", "adventure", "comedy", "fantasy", "family"],
  date: ["romance", "comedy", "drama"],
  party: ["comedy", "action", "music"],
  friends: ["comedy", "action", "adventure", "horror"],
  special: ["drama", "fantasy", "sci-fi", "romance"],
};

const keywordSearch: Partial<Record<MovieCategory, string>> = {
  "award-winning": "award winner",
  "book-adaptation": "based on novel",
  "true-story": "based on true story",
  "happy-ending": "happy ending",
  "twist-ending": "plot twist",
};

const certificationOrder: MPAA[] = ["G", "PG", "PG-13", "R", "NC-17"];

function getApiKey() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY?.trim();
  if (!apiKey || apiKey === "your_tmdb_api_key") {
    throw new Error(
      "کلید TMDB را در فایل .env.local تنظیم کن تا پیشنهاد فیلم فعال شود.",
    );
  }
  return apiKey;
}

async function request<T>(
  path: string,
  params: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "کلید TMDB معتبر نیست؛ مقدار آن را در .env.local بررسی کن.",
      );
    }
    if (response.status === 429) {
      throw new Error("درخواست‌ها زیاد شده‌اند؛ کمی صبر کن و دوباره تلاش کن.");
    }
    throw new Error(`دریافت اطلاعات از TMDB ناموفق بود (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  original_language: string;
  runtime?: number | null;
  tagline?: string;
  genres?: Array<{ id: number; name: string }>;
  imdb_id?: string | null;
  credits?: MovieDetails["credits"];
  videos?: MovieDetails["videos"];
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string; release_date: string }>;
    }>;
  };
};

type DiscoverResponse = { results: TmdbMovie[]; total_pages?: number };

type OmdbResponse = {
  Response: "True" | "False";
  Error?: string;
  Poster?: string;
  Plot?: string;
  Runtime?: string;
  Rated?: string;
  imdbRating?: string;
  Metascore?: string;
  Awards?: string;
  Director?: string;
  Actors?: string;
  BoxOffice?: string;
};

function isUsefulOmdbValue(value: string | undefined): value is string {
  return Boolean(value && value !== "N/A" && value.trim());
}

function getOmdbApiKey() {
  const apiKey = import.meta.env.VITE_OMDB_API_KEY?.trim();
  return apiKey && apiKey !== "your_omdb_api_key" ? apiKey : null;
}

async function getOmdbFallback(
  imdbId: string | null | undefined,
  signal?: AbortSignal,
): Promise<{
  poster: string | null;
  plot: string | null;
  runtime: number | null;
  info: OmdbInfo | null;
}> {
  const apiKey = getOmdbApiKey();
  if (!apiKey || !imdbId) {
    return { poster: null, plot: null, runtime: null, info: null };
  }

  try {
    const url = new URL(OMDB_API_BASE);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("i", imdbId);
    url.searchParams.set("plot", "full");
    url.searchParams.set("r", "json");
    const response = await fetch(url, { signal });
    if (!response.ok)
      return { poster: null, plot: null, runtime: null, info: null };
    const data = (await response.json()) as OmdbResponse;
    if (data.Response !== "True")
      return { poster: null, plot: null, runtime: null, info: null };

    const runtimeMatch = data.Runtime?.match(/^(\d+)\s+min$/i);
    return {
      poster:
        isUsefulOmdbValue(data.Poster) && /^https:\/\//i.test(data.Poster)
          ? data.Poster
          : null,
      plot: isUsefulOmdbValue(data.Plot) ? data.Plot : null,
      runtime: runtimeMatch ? Number(runtimeMatch[1]) : null,
      info: {
        rating: isUsefulOmdbValue(data.imdbRating) ? data.imdbRating : null,
        metascore: isUsefulOmdbValue(data.Metascore) ? data.Metascore : null,
        awards: isUsefulOmdbValue(data.Awards) ? data.Awards : null,
        director: isUsefulOmdbValue(data.Director) ? data.Director : null,
        actors: isUsefulOmdbValue(data.Actors)
          ? data.Actors.split(", ").slice(0, 6)
          : [],
        rated: isUsefulOmdbValue(data.Rated) ? data.Rated : null,
        boxOffice: isUsefulOmdbValue(data.BoxOffice) ? data.BoxOffice : null,
      },
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    // OMDb is a fallback provider; a transient OMDb error should not hide TMDB data.
    return { poster: null, plot: null, runtime: null, info: null };
  }
}

function normalizeMovie(movie: TmdbMovie): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    fallbackPosterUrl: null,
    backdropPath: movie.backdrop_path,
    releaseDate: movie.release_date,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    popularity: movie.popularity,
    genreIds: movie.genre_ids ?? [],
    originalLanguage: movie.original_language,
    recommendationReasons: [],
  };
}

export async function getFeaturedMovies(
  signal?: AbortSignal,
): Promise<MovieSummary[]> {
  const data = await request<DiscoverResponse>(
    "/movie/popular",
    { language: "fa-IR", page: "1", region: "US" },
    signal,
  );
  return data.results
    .filter((movie) => movie.backdrop_path)
    .slice(0, 7)
    .map((movie) => ({
      ...normalizeMovie(movie),
      recommendationReasons: ["از فیلم‌های پرطرفدار این روزها"],
    }));
}

type TmdbTranslations = {
  translations: Array<{
    iso_3166_1: string;
    iso_639_1: string;
    data: { overview?: string };
  }>;
};

export async function getPersianMovieOverview(
  movieId: number,
  sourceOverview: string,
  signal?: AbortSignal,
) {
  if (!sourceOverview.trim() || isPersianText(sourceOverview))
    return sourceOverview;
  const cached = getCachedPersianTranslation(movieId);
  if (cached) return cached;

  try {
    const translations = await request<TmdbTranslations>(
      `/movie/${movieId}/translations`,
      {},
      signal,
    );
    const persian = translations.translations
      .find((item) => item.iso_639_1 === "fa" || item.iso_3166_1 === "IR")
      ?.data.overview?.trim();
    if (persian && isPersianText(persian)) {
      cachePersianTranslation(movieId, persian);
      return persian;
    }
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  try {
    const translated = await translateOverviewToPersian(
      movieId,
      sourceOverview,
      signal,
    );
    return isPersianText(translated) ? translated : "";
  } catch (error) {
    if (signal?.aborted) throw error;
    return "";
  }
}

const keywordIdCache = new Map<string, number | undefined>();

async function searchKeywordId(query: string, signal?: AbortSignal) {
  if (keywordIdCache.has(query)) return keywordIdCache.get(query);
  const data = await request<{ results: Array<{ id: number }> }>(
    "/search/keyword",
    { query, page: "1" },
    signal,
  );
  const id = data.results[0]?.id;
  keywordIdCache.set(query, id);
  return id;
}

function getYearFilters(
  movieAge: QuizAnswers["movieAge"],
): Record<string, string> {
  const today = new Date();
  const date = (yearsAgo: number) => {
    const year = today.getFullYear() - yearsAgo;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (movieAge === "5") return { "primary_release_date.gte": date(5) };
  if (movieAge === "10") return { "primary_release_date.gte": date(10) };
  if (movieAge === "20") return { "primary_release_date.gte": date(20) };
  if (movieAge === "older") return { "primary_release_date.lte": date(20) };
  return {};
}

async function discover(
  answers: QuizAnswers,
  { relaxOptionalFilters = false } = {},
  signal?: AbortSignal,
  page = 1,
) {
  const keywordQueries = answers.categories
    .map((category) => keywordSearch[category])
    .filter((value): value is string => Boolean(value));
  const keywordIds = relaxOptionalFilters
    ? []
    : (
        await Promise.all(
          keywordQueries.map((query) => searchKeywordId(query, signal)),
        )
      ).filter((id): id is number => typeof id === "number");

  const params: Record<string, string> = {
    language: "fa-IR",
    include_adult: "false",
    include_video: "false",
    page: String(page),
    sort_by: "popularity.desc",
    ...getYearFilters(answers.movieAge),
  };
  if (answers.genres.length) {
    params.with_genres = answers.genres
      .map((genre) => genreIds[genre])
      .join("|");
  }
  if (keywordIds.length) params.with_keywords = keywordIds.join("|");
  if (!relaxOptionalFilters && answers.mpaaRatings.length) {
    params.certification_country = "US";
    params.region = "US";
    params.certification = certificationOrder
      .filter((rating) => answers.mpaaRatings.includes(rating))
      .join("|");
  }
  if (answers.categories.includes("high-rated")) {
    params["vote_average.gte"] = "7.3";
    params["vote_count.gte"] = "100";
    params.sort_by = "vote_average.desc";
  }
  if (answers.categories.includes("award-winning")) {
    params["vote_average.gte"] = "7.2";
    params["vote_count.gte"] = "250";
  }
  if (answers.categories.includes("hidden-gem")) {
    params["vote_average.gte"] = "6.8";
    params["vote_count.gte"] = "30";
    params["vote_count.lte"] = "1600";
    params.sort_by = "popularity.asc";
  }
  if (answers.categories.includes("popular"))
    params.sort_by = "popularity.desc";
  if (
    answers.categories.includes("famous-cast") ||
    answers.categories.includes("famous-director")
  ) {
    params["vote_count.gte"] = params["vote_count.gte"] ?? "500";
  }

  const data = await request<DiscoverResponse>(
    "/discover/movie",
    params,
    signal,
  );
  return data;
}

async function findFreshMovies(
  answers: QuizAnswers,
  excludedIds: number[],
  relaxOptionalFilters: boolean,
  signal?: AbortSignal,
) {
  const firstPage = await discover(
    answers,
    { relaxOptionalFilters },
    signal,
    1,
  );
  const freshFrom = (movies: TmdbMovie[]) =>
    movies.filter((movie) => !excludedIds.includes(movie.id));
  const firstBatch = freshFrom(firstPage.results);
  if (firstBatch.length) return firstBatch;

  const totalPages = Math.min(firstPage.total_pages ?? 1, 500);
  if (totalPages < 2) return [];

  const start = 2 + Math.floor(Math.random() * (totalPages - 1));
  const pagesToScan = Math.min(totalPages - 1, 8);
  for (let offset = 0; offset < pagesToScan; offset += 1) {
    const page = 2 + ((start - 2 + offset) % (totalPages - 1));
    const data = await discover(
      answers,
      { relaxOptionalFilters },
      signal,
      page,
    );
    const batch = freshFrom(data.results);
    if (batch.length) return batch;
  }
  return [];
}

function scoreMovie(movie: TmdbMovie, answers: QuizAnswers) {
  const moodMatches = (moodGenres[answers.mood] ?? []).filter((genre) =>
    movie.genre_ids?.includes(genreIds[genre]),
  ).length;
  const occasionMatches = (occasionGenres[answers.occasion] ?? []).filter(
    (genre) => movie.genre_ids?.includes(genreIds[genre]),
  ).length;
  const selectedGenreMatches = answers.genres.filter((genre) =>
    movie.genre_ids?.includes(genreIds[genre]),
  ).length;
  let score = movie.vote_average * 4 + Math.log10(movie.vote_count + 1) * 2;
  score += moodMatches * 7 + occasionMatches * 5 + selectedGenreMatches * 4;
  if (answers.categories.includes("popular"))
    score += Math.log10(movie.popularity + 1) * 5;
  if (answers.categories.includes("hidden-gem"))
    score -= Math.log10(movie.popularity + 1) * 2;
  if (answers.categories.includes("high-rated") && movie.vote_average >= 7.3)
    score += 8;
  if (answers.categories.includes("award-winning") && movie.vote_count >= 250)
    score += 5;
  if (
    answers.categories.includes("famous-cast") ||
    answers.categories.includes("famous-director")
  ) {
    score += Math.log10(movie.vote_count + 1) * 2;
  }
  return score;
}

function recommendationReasons(movie: TmdbMovie, answers: QuizAnswers) {
  const reasons: string[] = [];
  const matches = answers.genres.filter((genre) =>
    movie.genre_ids?.includes(genreIds[genre]),
  );
  if (matches.length) reasons.push("با ژانرهای دلخواهت جور است");
  if (
    (moodGenres[answers.mood] ?? []).some((genre) =>
      movie.genre_ids?.includes(genreIds[genre]),
    )
  ) {
    reasons.push("با حال‌وهوای امروزت هم‌خوانی دارد");
  }
  if (
    (occasionGenres[answers.occasion] ?? []).some((genre) =>
      movie.genre_ids?.includes(genreIds[genre]),
    )
  ) {
    reasons.push("برای این دورهمی انتخاب خوبی است");
  }
  if (movie.vote_average >= 7.5) reasons.push("امتیاز مخاطبان بالایی دارد");
  if (!reasons.length) reasons.push("یک انتخاب محبوب برای کشف فیلمی تازه");
  return reasons.slice(0, 3);
}

export async function getRecommendations(
  answers: QuizAnswers,
  excludedIds: number[] = [],
  signal?: AbortSignal,
): Promise<RecommendationResult> {
  let results = await findFreshMovies(answers, excludedIds, false, signal);
  let filtersWereRelaxed = false;

  if (!results.length) {
    results = await findFreshMovies(answers, excludedIds, true, signal);
    filtersWereRelaxed = results.length > 0;
  }
  if (!results.length && answers.genres.length) {
    results = await findFreshMovies(
      { ...answers, genres: [] },
      excludedIds,
      true,
      signal,
    );
    filtersWereRelaxed = results.length > 0;
  }
  if (!results.length) {
    // A TMDB catalogue is finite. Once every matching title has been shown,
    // start a fresh, broader cycle so the user can keep browsing indefinitely.
    const broadAnswers: QuizAnswers = {
      ...answers,
      mood: "unsure",
      genres: [],
      movieAge: "any",
      mpaaRatings: [],
      categories: [],
    };
    results = await findFreshMovies(broadAnswers, [], true, signal);
    filtersWereRelaxed = true;
  }

  const seen = new Set<number>();
  const ranked = results
    .filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    })
    .map((movie) => ({ movie, score: scoreMovie(movie, answers) }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.movie.popularity - left.movie.popularity,
    )
    .map(({ movie }) => ({
      ...normalizeMovie(movie),
      recommendationReasons: recommendationReasons(movie, answers),
    }));

  return { movies: ranked, filtersWereRelaxed };
}

export async function getMovieDetails(
  id: number,
  signal?: AbortSignal,
): Promise<MovieDetails> {
  const movie = await request<TmdbMovie>(
    `/movie/${id}`,
    { append_to_response: "credits,videos,release_dates", language: "fa-IR" },
    signal,
  );
  let videos = movie.videos ?? { results: [] };
  const hasYoutubeTrailer = videos.results.some(
    (video) =>
      video.site === "YouTube" && video.type === "Trailer" && video.key,
  );
  // TMDB may return no Persian-tagged videos. Retry in English so the detail
  // page can still offer the original trailer when one exists.
  if (!hasYoutubeTrailer) {
    try {
      const englishVideos = await request<MovieDetails["videos"]>(
        `/movie/${id}/videos`,
        { language: "en-US" },
        signal,
      );
      const unique = new Set(videos.results.map((video) => video.key));
      videos = {
        results: [
          ...videos.results,
          ...englishVideos.results.filter((video) => {
            if (!video.key || unique.has(video.key)) return false;
            unique.add(video.key);
            return true;
          }),
        ],
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      // Video lookup is optional; other movie details should remain available.
    }
  }
  const usRelease = movie.release_dates?.results.find(
    (release) => release.iso_3166_1 === "US",
  );
  const certification =
    usRelease?.release_dates.find((release) => release.certification)
      ?.certification ?? "";
  const omdb = await getOmdbFallback(movie.imdb_id, signal);
  const overview = await getPersianMovieOverview(
    id,
    movie.overview || omdb.plot || "",
    signal,
  );
  return {
    ...normalizeMovie(movie),
    overview,
    runtime: movie.runtime ?? omdb.runtime,
    tagline: movie.tagline ?? "",
    genres: movie.genres ?? [],
    certification: certification || omdb.info?.rated || "",
    imdbId: movie.imdb_id ?? null,
    fallbackPosterUrl: movie.poster_path ? null : omdb.poster,
    omdb: omdb.info,
    credits: movie.credits ?? { crew: [], cast: [] },
    videos,
  };
}

export function getImageUrl(
  path: string | null,
  size: "w342" | "w500" | "original" = "w500",
) {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function formatYear(date: string) {
  if (!date) return "سال نامشخص";
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year > 1800
    ? new Intl.NumberFormat("fa-IR").format(year)
    : "سال نامشخص";
}

export function formatScore(score: number) {
  return score > 0
    ? new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(score)
    : "—";
}
