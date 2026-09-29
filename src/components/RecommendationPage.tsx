import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  formatScore,
  formatYear,
  getImageUrl,
  getMovieDetails,
} from "../services/tmdb";
import { isPersianText } from "../services/translation";
import type { MovieDetails, MovieSummary } from "../types/movie";

type RecommendationPageProps = {
  movie: MovieSummary;
  current: number;
  total: number;
  isSaved: boolean;
  filtersWereRelaxed: boolean;
  isLoadingNext: boolean;
  onNext: () => void;
  onRestart: () => void;
  onToggleSave: (movie: MovieSummary) => void;
};

const genreNames: Record<number, string> = {
  28: "اکشن",
  12: "ماجراجویی",
  16: "انیمیشن",
  35: "کمدی",
  80: "جنایی",
  99: "مستند",
  18: "درام",
  10751: "خانوادگی",
  14: "فانتزی",
  36: "تاریخی",
  27: "ترسناک",
  10402: "موسیقی",
  9648: "معمایی",
  10749: "عاشقانه",
  878: "علمی‌تخیلی",
  53: "هیجانی",
  10752: "جنگی",
};

function formatRuntime(runtime: number | null) {
  if (!runtime) return "نامشخص";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return [hours ? `${hours} ساعت` : "", minutes ? `${minutes} دقیقه` : ""]
    .filter(Boolean)
    .join(" و ");
}

export function RecommendationPage({
  movie,
  current,
  total,
  isSaved,
  filtersWereRelaxed,
  isLoadingNext,
  onNext,
  onRestart,
  onToggleSave,
}: RecommendationPageProps) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [detailsError, setDetailsError] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsAreOpen, setDetailsAreOpen] = useState(false);
  const [trailerIsOpen, setTrailerIsOpen] = useState(false);
  const [detailsRetry, setDetailsRetry] = useState(0);

  useEffect(() => {
    setDetails(null);
    setDetailsError("");
    setDetailsAreOpen(false);
    setTrailerIsOpen(false);
  }, [movie.id]);

  useEffect(() => {
    if (details) return;
    const controller = new AbortController();
    setDetailsLoading(true);
    setDetailsError("");
    getMovieDetails(movie.id, controller.signal)
      .then(setDetails)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setDetailsError(
            error instanceof Error ? error.message : "دریافت جزئیات ممکن نشد.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailsLoading(false);
      });
    return () => controller.abort();
  }, [details, movie.id, detailsRetry]);

  async function toggleDetails() {
    if (detailsAreOpen) {
      setDetailsAreOpen(false);
      setTrailerIsOpen(false);
      return;
    }
    setDetailsAreOpen(true);
    if (details) return;
  }

  const poster =
    getImageUrl(movie.posterPath ?? details?.posterPath ?? null, "w500") ??
    details?.fallbackPosterUrl ??
    movie.fallbackPosterUrl ??
    null;
  const backdrop = getImageUrl(movie.backdropPath, "original");
  const trailer = details?.videos.results.find(
    (video) =>
      video.site === "YouTube" && video.type === "Trailer" && video.key,
  );
  const trailerSearchQuery = [
    movie.originalTitle || movie.title,
    movie.releaseDate.slice(0, 4),
    "official trailer",
  ]
    .filter(Boolean)
    .join(" ");
  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(trailerSearchQuery)}`;
  const director = details?.credits.crew.find(
    (person) => person.job === "Director",
  );
  const cast = details?.credits.cast
    .slice(0, 6)
    .map((person) => person.name)
    .join("، ");
  const movieOverview = isPersianText(movie.overview)
    ? movie.overview
    : details?.overview ||
      (detailsLoading
        ? "داریم خلاصهٔ فارسی فیلم رو آماده می‌کنیم…"
        : "خلاصهٔ فارسی این فیلم فعلاً در دسترس نیست.");

  return (
    <section
      className="recommendation container"
      aria-labelledby="recommendation-title"
    >
      <div className="recommendation-topline">
        <button className="quiet-button" type="button" onClick={onRestart}>
          ↗ تغییر سلیقه
        </button>
        <span className="recommendation-counter">
          انتخاب <b>{String(current).padStart(2, "0")}</b>
          <i>/</i>
          {String(total).padStart(2, "0")}
        </span>
      </div>
      {filtersWereRelaxed ? (
        <div className="relaxed-note" role="status">
          <span>✳</span> برای اینکه دست خالی نمونی، چندتا از فیلترهای محدودکننده
          رو کمی بازتر کردیم.
        </div>
      ) : null}
      <div
        className="recommendation-card"
        style={
          backdrop
            ? ({ "--movie-backdrop": `url("${backdrop}")` } as CSSProperties)
            : undefined
        }
      >
        <div className="recommendation-card__wash" />
        <div className="recommendation-card__body">
          <div className="recommendation-poster">
            {poster ? (
              <img src={poster} alt={`پوستر فیلم ${movie.title}`} />
            ) : (
              <div className="poster-placeholder">
                <span>✳</span>
                <small>پوستر موجود نیست</small>
              </div>
            )}
            <span className="poster-label">پیشنهاد فیلم‌جو</span>
          </div>
          <div className="recommendation-info">
            <p className="eyebrow eyebrow--lime">
              <span className="eyebrow__dot" /> این فیلم رو برای تو پیدا کردیم
            </p>
            <h1 id="recommendation-title">{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title ? (
              <p className="original-title">{movie.originalTitle}</p>
            ) : null}
            <div className="movie-meta">
              <span>{formatYear(movie.releaseDate)}</span>
              <span className="meta-divider" />
              <span className="score-pill">
                <b>★</b> {formatScore(movie.voteAverage)}
              </span>
              {movie.voteCount ? (
                <span className="vote-count">
                  از {new Intl.NumberFormat("fa-IR").format(movie.voteCount)}{" "}
                  رأی
                </span>
              ) : null}
            </div>
            <div className="movie-genres">
              {movie.genreIds.slice(0, 4).map((genreId) => (
                <span key={genreId}>{genreNames[genreId] ?? "فیلم"}</span>
              ))}
            </div>
            <p className="movie-overview">{movieOverview}</p>
            <div className="why-box">
              <span aria-hidden="true">✦</span>
              <div>
                <small>چرا این فیلم؟</small>
                <p>{movie.recommendationReasons.join(" · ")}</p>
              </div>
            </div>
            <div className="recommendation-actions">
              <button
                className="button button--lime button--large"
                type="button"
                onClick={onNext}
                disabled={isLoadingNext}
              >
                {isLoadingNext ? "داریم می‌گردیم…" : "یه فیلم دیگه پیشنهاد بده"}
                <span aria-hidden="true">↻</span>
              </button>
              <button
                className={`save-button${isSaved ? " is-saved" : ""}`}
                type="button"
                onClick={() =>
                  onToggleSave({
                    ...movie,
                    fallbackPosterUrl:
                      details?.fallbackPosterUrl ??
                      movie.fallbackPosterUrl ??
                      null,
                  })
                }
                aria-pressed={isSaved}
              >
                <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span>
                {isSaved ? "ذخیره شد" : "ذخیره برای بعد"}
              </button>
            </div>
          </div>
        </div>
        <div className="recommendation-card__index" aria-hidden="true">
          FILM
          <br />
          NO. {String(current).padStart(2, "0")}
        </div>
      </div>

      <div className="details-toggle-row">
        <p>قبل از پخش، بیشتر دربارهٔ فیلم بدون.</p>
        <button
          className="text-link"
          type="button"
          onClick={toggleDetails}
          aria-expanded={detailsAreOpen}
        >
          {detailsAreOpen ? "بستن جزئیات" : "دیدن جزئیات فیلم"}
          <span aria-hidden="true">{detailsAreOpen ? "↑" : "↙"}</span>
        </button>
      </div>

      {detailsAreOpen ? (
        <div className="movie-details-panel">
          {detailsLoading ? (
            <p className="details-status" role="status">
              داریم جزئیات فیلم رو می‌گیریم…
            </p>
          ) : null}
          {detailsError ? (
            <div className="details-error" role="alert">
              <span>{detailsError}</span>
              <button
                className="text-link"
                type="button"
                onClick={() => setDetailsRetry((attempt) => attempt + 1)}
              >
                تلاش دوباره
              </button>
            </div>
          ) : null}
          {details ? (
            <>
              {details.tagline ? (
                <p className="movie-tagline">«{details.tagline}»</p>
              ) : null}
              <div className="details-grid">
                <Detail
                  label="مدت فیلم"
                  value={formatRuntime(details.runtime)}
                />
                <Detail
                  label="رده‌بندی سنی"
                  value={details.certification || "ثبت نشده"}
                />
                <Detail
                  label="زبان اصلی"
                  value={details.originalLanguage.toUpperCase() || "ثبت نشده"}
                />
                <Detail
                  label="کارگردان"
                  value={director?.name || details.omdb?.director || "ثبت نشده"}
                />
                <Detail
                  label="بازیگران"
                  value={cast || details.omdb?.actors.join("، ") || "ثبت نشده"}
                />
                <Detail
                  label="امتیاز مخاطبان"
                  value={`${formatScore(details.voteAverage)} از ۱۰ · ${new Intl.NumberFormat("fa-IR").format(details.voteCount)} رأی`}
                />
                <Detail
                  label="ژانرها"
                  value={
                    details.genres.map((genre) => genre.name).join("، ") ||
                    "ثبت نشده"
                  }
                />
                {details.imdbId ? (
                  <Detail label="شناسهٔ IMDb" value={details.imdbId} />
                ) : null}
                {details.omdb?.rating ? (
                  <Detail
                    label="امتیاز IMDb"
                    value={`${details.omdb.rating} / 10`}
                  />
                ) : null}
                {details.omdb?.metascore ? (
                  <Detail label="Metascore" value={details.omdb.metascore} />
                ) : null}
                {details.omdb?.awards ? (
                  <Detail label="جوایز" value={details.omdb.awards} />
                ) : null}
                {details.omdb?.boxOffice ? (
                  <Detail label="فروش گیشه" value={details.omdb.boxOffice} />
                ) : null}
              </div>
              {trailer ? (
                <div className="trailer-area">
                  <button
                    className="button button--outline"
                    type="button"
                    onClick={() => setTrailerIsOpen((open) => !open)}
                  >
                    <span aria-hidden="true">▶</span>
                    {trailerIsOpen ? "بستن تریلر" : "تماشای تریلر"}
                  </button>
                  {trailerIsOpen ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0`}
                      title={`تریلر ${movie.title}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : null}
                </div>
              ) : (
                <div className="trailer-area trailer-area--fallback">
                  <p className="no-trailer">
                    تریلر رسمی در TMDB ثبت نشده؛ می‌تونی در YouTube دنبالش
                    بگردی.
                  </p>
                  <a
                    className="button button--outline trailer-search-link"
                    href={trailerSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span aria-hidden="true">↗</span>
                    جست‌وجوی تریلر در YouTube
                  </a>
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="recommendation-footnote">
        <span>✳</span> TMDB منبع اصلی اطلاعاته و OMDb برای تکمیل موارد ناقص کمک
        می‌کنه؛ ممکنه بعضی داده‌ها موجود نباشن.
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
