import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  formatScore,
  formatYear,
  getFeaturedMovies,
  getImageUrl,
  getPersianMovieOverview,
} from "../services/tmdb";
import { isPersianText } from "../services/translation";
import type { Genre, MovieSummary } from "../types/movie";

type SpotlightSliderProps = { onStart: (genre?: Genre) => void };

const fallbackSlides = [
  { title: "امشب، قصه با تو شروع می‌شه", label: "ویترین فیلم‌جو", hue: "plum" },
  {
    title: "برای حالِ همین امشبت",
    label: "انتخابی به حال‌وهوای تو",
    hue: "amber",
  },
  { title: "یه فیلم، یه حالِ تازه", label: "کشف بعدی تو", hue: "blue" },
];

export function SpotlightSlider({ onStart }: SpotlightSliderProps) {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [persianOverview, setPersianOverview] = useState("");
  const [isTranslatingOverview, setIsTranslatingOverview] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getFeaturedMovies(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted && items.length) {
          setMovies(items);
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, []);

  const activeMovie = movies[activeIndex];

  useEffect(() => {
    if (!activeMovie?.overview || isPersianText(activeMovie.overview)) {
      setPersianOverview(activeMovie?.overview ?? "");
      setIsTranslatingOverview(false);
      return;
    }
    const controller = new AbortController();
    setPersianOverview("");
    setIsTranslatingOverview(true);
    getPersianMovieOverview(
      activeMovie.id,
      activeMovie.overview,
      controller.signal,
    )
      .then((overview) => {
        if (!controller.signal.aborted) setPersianOverview(overview);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPersianOverview("");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsTranslatingOverview(false);
      });
    return () => controller.abort();
  }, [activeMovie?.id, activeMovie?.overview]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const slideCount = movies.length || fallbackSlides.length;
  const activeFallback = fallbackSlides[activeIndex % fallbackSlides.length]!;
  const backdrop = activeMovie
    ? getImageUrl(activeMovie.backdropPath, "original")
    : null;
  const imageStyle = backdrop
    ? ({ "--spotlight-image": `url("${backdrop}")` } as CSSProperties)
    : undefined;

  const releaseYear = activeMovie?.releaseDate
    ? formatYear(activeMovie.releaseDate)
    : null;
  const score =
    activeMovie && activeMovie.voteAverage > 0
      ? formatScore(activeMovie.voteAverage)
      : null;
  const activeLabel = activeMovie?.title ?? activeFallback.title;

  const previewIndices = useMemo(() => {
    const size = Math.min(5, slideCount);
    return Array.from(
      { length: size },
      (_, index) => (activeIndex + index) % slideCount,
    );
  }, [activeIndex, slideCount]);

  function goTo(index: number) {
    setActiveIndex((index + slideCount) % slideCount);
  }

  useEffect(() => {
    if (isPaused || isInteracting || reducedMotion || slideCount < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slideCount);
    }, 7200);
    return () => window.clearInterval(timer);
  }, [isPaused, isInteracting, reducedMotion, slideCount]);

  return (
    <section
      className={`spotlight-slider${activeMovie ? " has-movies" : " is-editorial"}`}
      aria-label="ویترین فیلم‌ها"
      aria-roledescription="اسلایدر"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocus={() => setIsInteracting(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setIsInteracting(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goTo(activeIndex + 1);
        if (event.key === "ArrowRight") goTo(activeIndex - 1);
      }}
    >
      <div
        className={`spotlight-stage spotlight-stage--${activeMovie ? "photo" : activeFallback.hue}`}
        style={imageStyle}
        key={activeMovie?.id ?? activeFallback.hue}
      >
        {backdrop ? (
          <img className="spotlight-backdrop" src={backdrop} alt="" />
        ) : null}
        <div className="spotlight-grain" aria-hidden="true" />
        <div className="spotlight-content">
          <div className="spotlight-overline">
            <span className="spotlight-live-dot" />
            {activeMovie ? "از ویترین محبوب‌ها" : activeFallback.label}
          </div>
          <div
            className="spotlight-copy"
            key={activeMovie?.id ?? activeFallback.title}
          >
            <p className="spotlight-kicker">
              FILM-JO / {String(activeIndex + 1).padStart(2, "0")}
            </p>
            <h1>{activeMovie?.title ?? activeFallback.title}</h1>
            {activeMovie?.originalTitle &&
            activeMovie.originalTitle !== activeMovie.title ? (
              <p className="spotlight-original">{activeMovie.originalTitle}</p>
            ) : null}
            <p className="spotlight-description">
              {activeMovie
                ? isPersianText(activeMovie.overview)
                  ? activeMovie.overview
                  : persianOverview ||
                    (isTranslatingOverview
                      ? "داریم خلاصهٔ فارسی رو آماده می‌کنیم…"
                      : "خلاصهٔ فارسی این فیلم فعلاً در دسترس نیست.")
                : "از بین این همه فیلم، فقط کافیه بگی چه حال‌وهوایی داری. ما انتخاب بعدی رو برات پیدا می‌کنیم."}
            </p>
            <div className="spotlight-meta">
              {releaseYear ? <span>{releaseYear}</span> : null}
              {score ? (
                <span className="spotlight-rating">
                  <b>★</b>
                  {score}
                </span>
              ) : null}
              <span>
                {activeMovie
                  ? "پیشنهاد محبوب TMDB"
                  : "یک آزمون کوتاه تا پیشنهاد فیلم"}
              </span>
            </div>
            <button
              className="spotlight-cta"
              type="button"
              onClick={() => onStart()}
            >
              فیلم امشبم رو پیدا کن <span aria-hidden="true">↙</span>
            </button>
          </div>
          {loadError ? (
            <p className="spotlight-hint" role="status">
              برای نمایش فیلم‌های محبوب، کلید TMDB را در فایل محلی تنظیم کن.
            </p>
          ) : null}
        </div>
        <div className="spotlight-side-note" aria-hidden="true">
          <span>NO. {String(activeIndex + 1).padStart(2, "0")}</span>
          <i /> FILMJO SELECTION
        </div>
        <div className="spotlight-bottomline">
          <div
            className="spotlight-progress"
            role="group"
            aria-label="انتخاب اسلاید"
          >
            {Array.from({ length: slideCount }, (_, index) => (
              <button
                key={index}
                className={`spotlight-progress__item${index === activeIndex ? " is-active" : ""}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`رفتن به اسلاید ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="spotlight-controls">
            <span className="spotlight-count">
              {String(activeIndex + 1).padStart(2, "0")} <i>/</i>{" "}
              {String(slideCount).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="اسلاید بعدی"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="اسلاید قبلی"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="spotlight-rail" aria-label="انتخاب فیلم از ویترین">
        <div className="spotlight-rail__label">
          <span>ON THE REEL</span>
          <small>برای مرور، انتخاب کن</small>
        </div>
        <div className="spotlight-thumbnails">
          {previewIndices.map((index) => {
            const movie = movies[index];
            const fallback = fallbackSlides[index % fallbackSlides.length]!;
            const poster = movie ? getImageUrl(movie.posterPath, "w342") : null;
            return (
              <button
                key={movie?.id ?? `fallback-${index}`}
                type="button"
                className={`spotlight-thumb${index === activeIndex ? " is-active" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`نمایش ${movie?.title ?? fallback.title}`}
                aria-pressed={index === activeIndex}
              >
                <span
                  className={`spotlight-thumb__image spotlight-thumb__image--${fallback.hue}`}
                >
                  {poster ? (
                    <img src={poster} alt="" loading="lazy" />
                  ) : (
                    <i aria-hidden="true">✳</i>
                  )}
                </span>
                <span className="spotlight-thumb__title">
                  {movie?.title ?? fallback.title}
                </span>
                <span className="spotlight-thumb__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
        <button
          className={`spotlight-pause${isPaused ? " is-paused" : ""}`}
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          aria-label={isPaused ? "ادامهٔ اسلاید خودکار" : "توقف اسلاید خودکار"}
          aria-pressed={isPaused}
        >
          <span aria-hidden="true">{isPaused ? "▶" : "Ⅱ"}</span>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        اسلاید {activeIndex + 1} از {slideCount}: {activeLabel}
      </span>
    </section>
  );
}
