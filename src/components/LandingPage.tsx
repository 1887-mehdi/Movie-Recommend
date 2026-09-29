import type { Genre } from "../types/movie";
import { SpotlightSlider } from "./SpotlightSlider";

type LandingPageProps = {
  onStart: (genre?: Genre) => void;
};

const quickGenres: Array<{ value: Genre; label: string; tone: string }> = [
  { value: "comedy", label: "کمدی", tone: "peach" },
  { value: "thriller", label: "هیجانی", tone: "purple" },
  { value: "sci-fi", label: "علمی‌تخیلی", tone: "blue" },
  { value: "drama", label: "درام", tone: "rose" },
  { value: "animation", label: "انیمیشن", tone: "lime" },
  { value: "romance", label: "عاشقانه", tone: "pink" },
  { value: "action", label: "اکشن", tone: "orange" },
  { value: "horror", label: "ترسناک", tone: "dark" },
];

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <>
      <div id="home">
        <SpotlightSlider onStart={onStart} />
      </div>

      <section className="quick-start container" id="genres">
        <div className="section-heading">
          <div>
            <p className="eyebrow">از کجا شروع کنیم؟</p>
            <h2>الان چه حال‌وهوایی داری؟</h2>
          </div>
          <button className="text-link" type="button" onClick={() => onStart()}>
            بذار خودم انتخاب کنم <span aria-hidden="true">↙</span>
          </button>
        </div>
        <div className="genre-grid">
          {quickGenres.map((genre) => (
            <button
              key={genre.value}
              className={`genre-tile genre-tile--${genre.tone}`}
              type="button"
              onClick={() => onStart(genre.value)}
            >
              <span>{genre.label}</span>
              <small>
                انتخاب کن <b aria-hidden="true">↙</b>
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="container how-layout">
          <div className="how-intro">
            <p className="eyebrow">ساده‌تر از چیزی که فکر می‌کنی</p>
            <h2>
              تو انتخاب کن.
              <br />
              <span>ما فیلم رو پیدا می‌کنیم.</span>
            </h2>
            <p>
              قرار نیست بین هزاران عنوان گم بشی. چندتا ترجیح کوچیکت رو می‌پرسیم
              و بهترین گزینه‌ها رو جلوت می‌ذاریم.
            </p>
            <button
              className="text-link"
              type="button"
              onClick={() => onStart()}
            >
              بزن بریم <span aria-hidden="true">↙</span>
            </button>
          </div>
          <div className="how-steps">
            <article>
              <span className="how-step__number">۰۱</span>
              <div>
                <h3>بگو چه حسی داری</h3>
                <p>حال‌وهوا، همراه‌ها و ژانر موردعلاقه‌ات.</p>
              </div>
              <span className="how-step__icon">☻</span>
            </article>
            <article>
              <span className="how-step__number">۰۲</span>
              <div>
                <h3>سلیقه‌ات رو دقیق کن</h3>
                <p>از فیلم‌های تازه تا کلاسیک‌ها و ویژگی‌های خاص.</p>
              </div>
              <span className="how-step__icon">✳</span>
            </article>
            <article>
              <span className="how-step__number">۰۳</span>
              <div>
                <h3>فیلمت رو کشف کن</h3>
                <p>پیشنهاد رو ببین، تریلر رو تماشا کن یا یکی دیگه بخواه.</p>
              </div>
              <span className="how-step__icon">▷</span>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
