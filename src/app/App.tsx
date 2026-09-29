import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LoginPage } from "../components/LoginPage";
import { LandingPage } from "../components/LandingPage";
import { QuizWizard } from "../components/QuizWizard";
import { RecommendationPage } from "../components/RecommendationPage";
import { getRecommendations } from "../services/tmdb";
import { supabase } from "../services/supabase";
import type { Genre, MovieSummary, QuizAnswers } from "../types/movie";

type Screen = "home" | "quiz" | "result" | "login";
const FAVORITES_KEY = "film-jo-favorites-v1";

function readFavorites(): MovieSummary[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? (JSON.parse(saved) as MovieSummary[]) : [];
  } catch {
    return [];
  }
}

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [initialGenre, setInitialGenre] = useState<Genre | undefined>();
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filtersWereRelaxed, setFiltersWereRelaxed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<MovieSummary[]>(readFavorites);
  const [favoritesAreOpen, setFavoritesAreOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Keep recommendations usable when browser storage is disabled or full.
    }
  }, [favorites]);

  useEffect(() => () => requestController.current?.abort(), []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthUser(data.session?.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const currentMovie = movies[currentIndex] ?? null;
  const favoriteIds = useMemo(
    () => new Set(favorites.map((movie) => movie.id)),
    [favorites],
  );

  function startQuiz(genre?: Genre) {
    requestController.current?.abort();
    setIsLoading(false);
    setInitialGenre(genre);
    setScreen("quiz");
    setFavoritesAreOpen(false);
    setError("");
  }

  async function loadRecommendations(
    selectedAnswers: QuizAnswers,
    excluded: number[],
    append: boolean,
  ) {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setIsLoading(true);
    setError("");
    try {
      const result = await getRecommendations(
        selectedAnswers,
        excluded,
        controller.signal,
      );
      setFiltersWereRelaxed(
        (wasRelaxed) => wasRelaxed || result.filtersWereRelaxed,
      );
      if (!result.movies.length) {
        if (!append) setMovies([]);
        setError(
          "با این ترکیب به فیلم تازه‌ای نرسیدیم. چندتا از انتخاب‌هات رو عوض کن و دوباره امتحان کن.",
        );
        return;
      }
      if (append) {
        setMovies((existing) => [...existing, ...result.movies]);
        setCurrentIndex((index) => index + 1);
      } else {
        setMovies(result.movies);
        setCurrentIndex(0);
      }
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "دریافت پیشنهاد فیلم ناموفق بود.",
      );
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }

  async function submitQuiz(selectedAnswers: QuizAnswers) {
    setAnswers(selectedAnswers);
    setMovies([]);
    setCurrentIndex(0);
    setFiltersWereRelaxed(false);
    setScreen("result");
    await loadRecommendations(selectedAnswers, [], false);
  }

  function nextRecommendation() {
    if (!answers || isLoading) return;
    if (currentIndex + 1 < movies.length) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    void loadRecommendations(
      answers,
      movies.map((movie) => movie.id),
      true,
    );
  }

  function retryRecommendations() {
    if (answers && !isLoading) void loadRecommendations(answers, [], false);
  }

  function toggleFavorite(movie: MovieSummary) {
    setFavorites((saved) =>
      saved.some((item) => item.id === movie.id)
        ? saved.filter((item) => item.id !== movie.id)
        : [movie, ...saved].slice(0, 50),
    );
  }

  function showFavorite(movie: MovieSummary) {
    requestController.current?.abort();
    setIsLoading(false);
    setMovies([movie]);
    setCurrentIndex(0);
    setFiltersWereRelaxed(false);
    setFavoritesAreOpen(false);
    setScreen("result");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setScreen("home");
  }

  return (
    <div className="site-shell">
      <div className="grain" aria-hidden="true" />
      <header className="site-header">
        <div className="header-inner container">
          <a
            className="brand"
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              setScreen("home");
            }}
            aria-label="فیلم‌جو، صفحهٔ اصلی"
          >
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              فیلم‌جو<span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="main-nav" aria-label="منوی اصلی">
            <a
              className={screen === "home" ? "is-current" : ""}
              href="#home"
              onClick={(event) => {
                event.preventDefault();
                setScreen("home");
              }}
            >
              خانه
            </a>
            {screen === "home" ? <a href="#genres">ژانرها</a> : null}
            {screen === "home" ? (
              <a href="#how-it-works">چطور کار می‌کنه؟</a>
            ) : null}
          </nav>
          <div className="header-actions">
            {authUser ? (
              <div className="account-actions">
                <span className="account-email" title={authUser.email ?? ""}>
                  {authUser.email}
                </span>
                <button
                  className="account-button"
                  type="button"
                  onClick={() => void signOut()}
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                className="account-button"
                type="button"
                onClick={() => setScreen("login")}
              >
                ورود
              </button>
            )}
            <button
              className={`favorites-button${favoritesAreOpen ? " is-open" : ""}`}
              type="button"
              onClick={() => setFavoritesAreOpen((open) => !open)}
              aria-expanded={favoritesAreOpen}
            >
              <span aria-hidden="true">♡</span>
              <span className="favorites-button__label">علاقه‌مندی‌ها</span>
              <b>{new Intl.NumberFormat("fa-IR").format(favorites.length)}</b>
            </button>
            <button
              className="button button--small button--outline"
              type="button"
              onClick={() => startQuiz()}
            >
              شروع آزمون <span aria-hidden="true">↙</span>
            </button>
            <button
              className="mobile-fav"
              type="button"
              aria-label={`علاقه‌مندی‌ها، ${favorites.length} فیلم`}
              onClick={() => setFavoritesAreOpen((open) => !open)}
            >
              ♡<b>{favorites.length}</b>
            </button>
          </div>
        </div>
      </header>

      {favoritesAreOpen ? (
        <div
          className="drawer-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setFavoritesAreOpen(false)
          }
        >
          <section
            className="favorites-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="favorites-title"
          >
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">برای بعد نگه داشتیم</p>
                <h2 id="favorites-title">فیلم‌های تو</h2>
              </div>
              <button
                type="button"
                className="drawer-close"
                aria-label="بستن"
                onClick={() => setFavoritesAreOpen(false)}
              >
                ×
              </button>
            </div>
            {favorites.length ? (
              <div className="favorites-list">
                {favorites.map((movie) => (
                  <div className="favorite-item" key={movie.id}>
                    <button
                      type="button"
                      className="favorite-item__open"
                      onClick={() => showFavorite(movie)}
                    >
                      <span className="favorite-item__poster">
                        {movie.posterPath || movie.fallbackPosterUrl ? (
                          <img
                            src={
                              movie.posterPath
                                ? `https://image.tmdb.org/t/p/w185${movie.posterPath}`
                                : movie.fallbackPosterUrl!
                            }
                            alt=""
                          />
                        ) : (
                          "✳"
                        )}
                      </span>
                      <span>
                        <strong>{movie.title}</strong>
                        <small>
                          {movie.releaseDate.slice(0, 4)} · ★{" "}
                          {movie.voteAverage.toFixed(1)}
                        </small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="favorite-remove"
                      aria-label={`حذف ${movie.title} از علاقه‌مندی‌ها`}
                      onClick={() => toggleFavorite(movie)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="favorites-empty">
                <span>♡</span>
                <p>هنوز فیلمی ذخیره نکردی.</p>
                <small>هر پیشنهادی رو دوست داشتی، برای بعد نگهش دار.</small>
              </div>
            )}
          </section>
        </div>
      ) : null}

      <main>
        {screen === "home" ? <LandingPage onStart={startQuiz} /> : null}
        {screen === "login" ? (
          <LoginPage
            onBack={() => setScreen("home")}
            onAuthenticated={() => setScreen("home")}
          />
        ) : null}
        {screen === "quiz" ? (
          <QuizWizard
            key={initialGenre ?? "all"}
            initialGenre={initialGenre}
            onCancel={() => setScreen("home")}
            onSubmit={(selectedAnswers) => void submitQuiz(selectedAnswers)}
          />
        ) : null}
        {screen === "result" ? (
          <>
            {currentMovie ? (
              <RecommendationPage
                movie={currentMovie}
                current={currentIndex + 1}
                total={movies.length}
                isSaved={favoriteIds.has(currentMovie.id)}
                filtersWereRelaxed={filtersWereRelaxed}
                isLoadingNext={isLoading}
                onNext={nextRecommendation}
                onRestart={() => startQuiz()}
                onToggleSave={toggleFavorite}
              />
            ) : null}
            {isLoading && !currentMovie ? (
              <div className="recommendation-loading container">
                <span className="loader-mark">✳</span>
                <p>داریم بین کلی فیلم می‌گردیم…</p>
                <small>یک انتخاب خوب داره پیدا می‌شه.</small>
              </div>
            ) : null}
            {error ? (
              <div className="recommendation-error container" role="alert">
                <span>☁</span>
                <p>{error}</p>
                <div>
                  {answers ? (
                    <button
                      className="button button--lime"
                      type="button"
                      onClick={retryRecommendations}
                    >
                      دوباره تلاش کن <span aria-hidden="true">↻</span>
                    </button>
                  ) : null}
                  <button
                    className="quiet-button"
                    type="button"
                    onClick={() => startQuiz()}
                  >
                    تغییر انتخاب‌ها
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <a
            className="brand brand--footer"
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              setScreen("home");
            }}
          >
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              فیلم‌جو<span className="brand-dot">.</span>
            </span>
          </a>
          <span>برای شب‌هایی که انتخاب سخته.</span>
          <small>
            اطلاعات فیلم از{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
            >
              TMDB
            </a>{" "}
            و{" "}
            <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">
              OMDb
            </a>{" "}
            · ساخته‌شده برای عاشقای فیلم
          </small>
        </div>
      </footer>
    </div>
  );
}
