import { useState } from "react";
import type {
  Genre,
  MPAA,
  MovieAge,
  MovieCategory,
  Mood,
  Occasion,
  QuizAnswers,
} from "../types/movie";

type QuizStep = 0 | 1 | 2 | 3 | 4 | 5;

type QuizWizardProps = {
  initialGenre?: Genre;
  onCancel: () => void;
  onSubmit: (answers: QuizAnswers) => void;
};

const questions = [
  {
    eyebrow: "اول از همه",
    title: "امروز چه حالی داری؟",
    description: "حال‌وهوات رو انتخاب کن تا پیشنهادها به خودت نزدیک‌تر بشن.",
  },
  {
    eyebrow: "با کی می‌بینی؟",
    title: "این فیلم برای چه موقعیتیه؟",
    description: "یک تماشای دونفره با دورهمی دوستانه فرق داره.",
  },
  {
    eyebrow: "سلیقهٔ سینمایی",
    title: "چه ژانری دوست داری؟",
    description: "هر تعداد ژانر که دوست داری انتخاب کن؛ انتخابش اجباری نیست.",
  },
  {
    eyebrow: "زمان سفر",
    title: "دلت فیلم تازه می‌خواد یا کلاسیک؟",
    description: "اگر فرقی نداره، همهٔ سال‌ها رو در نظر می‌گیریم.",
  },
  {
    eyebrow: "برای خیال راحت",
    title: "رده‌بندی سنی مهمه؟",
    description:
      "می‌تونی چند رده انتخاب کنی؛ انتخاب‌نکردن یعنی محدودیتی نداری.",
  },
  {
    eyebrow: "یک چاشنی اضافه",
    title: "دنبال ویژگی خاصی هستی؟",
    description:
      "مثلاً داستان واقعی، پایان غافلگیرکننده یا یک فیلم کمترشناخته‌شده.",
  },
];

const moods: Array<{
  value: Mood;
  label: string;
  emoji: string;
  hint: string;
}> = [
  {
    value: "happy",
    label: "شاد و سرحال",
    emoji: "☀️",
    hint: "یک حال خوب حسابی",
  },
  {
    value: "relaxed",
    label: "آرام و ریلکس",
    emoji: "☁️",
    hint: "یک شب بی‌دغدغه",
  },
  {
    value: "sad",
    label: "کمی غمگین",
    emoji: "🌧️",
    hint: "آمادهٔ یک داستان عمیق",
  },
  {
    value: "anxious",
    label: "مضطرب یا نگران",
    emoji: "🫧",
    hint: "برای حواس‌پرتی خوبه",
  },
  { value: "angry", label: "عصبانی", emoji: "⚡", hint: "انرژی‌ات رو آزاد کن" },
  {
    value: "excited",
    label: "هیجان‌زده",
    emoji: "✨",
    hint: "بزن بریم ماجراجویی",
  },
  {
    value: "unsure",
    label: "خودمم نمی‌دونم",
    emoji: "🎲",
    hint: "سورپرایزم کن",
  },
];

const occasions: Array<{ value: Occasion; label: string; emoji: string }> = [
  { value: "alone", label: "برای خودم", emoji: "🛋️" },
  { value: "family", label: "با خانواده", emoji: "🏡" },
  { value: "date", label: "قرار دونفره", emoji: "🕯️" },
  { value: "party", label: "دورهمی و مهمونی", emoji: "🎉" },
  { value: "friends", label: "با دوستام", emoji: "🍿" },
  { value: "special", label: "یک مناسبت خاص", emoji: "🎁" },
  { value: "normal", label: "فقط یک شب معمولی", emoji: "🌙" },
];

const genres: Array<{ value: Genre; label: string }> = [
  { value: "action", label: "اکشن" },
  { value: "adventure", label: "ماجراجویی" },
  { value: "animation", label: "انیمیشن" },
  { value: "comedy", label: "کمدی" },
  { value: "crime", label: "جنایی" },
  { value: "documentary", label: "مستند" },
  { value: "drama", label: "درام" },
  { value: "family", label: "خانوادگی" },
  { value: "fantasy", label: "فانتزی" },
  { value: "history", label: "تاریخی" },
  { value: "horror", label: "ترسناک" },
  { value: "music", label: "موسیقی" },
  { value: "mystery", label: "معمایی" },
  { value: "romance", label: "عاشقانه" },
  { value: "sci-fi", label: "علمی‌تخیلی" },
  { value: "thriller", label: "هیجانی" },
  { value: "war", label: "جنگی" },
];

const ages: Array<{ value: MovieAge; label: string; detail: string }> = [
  { value: "any", label: "فرقی نمی‌کنه", detail: "از هر دوره‌ای" },
  { value: "5", label: "تازه‌ها", detail: "۵ سال اخیر" },
  { value: "10", label: "نسبتاً جدید", detail: "۱۰ سال اخیر" },
  { value: "20", label: "مدرن‌ها", detail: "۲۰ سال اخیر" },
  { value: "older", label: "کلاسیک‌ها", detail: "قدیمی‌تر از ۲۰ سال" },
];

const ratings: Array<{ value: MPAA; label: string; detail: string }> = [
  { value: "G", label: "G", detail: "مناسب همه" },
  { value: "PG", label: "PG", detail: "راهنمایی والدین" },
  { value: "PG-13", label: "PG-13", detail: "مناسب ۱۳ سال به بالا" },
  { value: "R", label: "R", detail: "محدودیت سنی" },
  { value: "NC-17", label: "NC-17", detail: "مخصوص بزرگسالان" },
];

const categories: Array<{
  value: MovieCategory;
  label: string;
  emoji: string;
}> = [
  { value: "award-winning", label: "برندهٔ جایزه", emoji: "🏆" },
  { value: "high-rated", label: "امتیاز بالا", emoji: "⭐" },
  { value: "popular", label: "محبوب و پرطرفدار", emoji: "🔥" },
  { value: "hidden-gem", label: "جواهر کمترشناخته‌شده", emoji: "💎" },
  { value: "book-adaptation", label: "اقتباس از کتاب", emoji: "📚" },
  { value: "true-story", label: "بر اساس داستان واقعی", emoji: "🎭" },
  { value: "happy-ending", label: "پایان خوش", emoji: "😊" },
  { value: "twist-ending", label: "پایان غافلگیرکننده", emoji: "😮" },
  { value: "famous-cast", label: "بازیگران سرشناس", emoji: "🎬" },
  { value: "famous-director", label: "کارگردان سرشناس", emoji: "🎥" },
];

const emptyAnswers = (initialGenre?: Genre): QuizAnswers => ({
  mood: "unsure",
  occasion: "normal",
  genres: initialGenre ? [initialGenre] : [],
  movieAge: "any",
  mpaaRatings: [],
  categories: [],
});

export function QuizWizard({
  initialGenre,
  onCancel,
  onSubmit,
}: QuizWizardProps) {
  const [step, setStep] = useState<QuizStep>(0);
  const [answers, setAnswers] = useState<QuizAnswers>(() =>
    emptyAnswers(initialGenre),
  );
  const question = questions[step]!;

  function toggleValue<T extends string>(values: T[], value: T) {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }

  function continueQuiz() {
    if (step < 5) {
      setStep((current) => (current + 1) as QuizStep);
      return;
    }
    onSubmit(answers);
  }

  function renderOptions() {
    if (step === 0) {
      return (
        <div className="choice-grid choice-grid--mood">
          {moods.map((option) => (
            <button
              className={`choice-card${answers.mood === option.value ? " is-selected" : ""}`}
              type="button"
              aria-pressed={answers.mood === option.value}
              key={option.value}
              onClick={() =>
                setAnswers((current) => ({ ...current, mood: option.value }))
              }
            >
              <span className="choice-card__emoji">{option.emoji}</span>
              <span className="choice-card__text">
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
              <span className="choice-card__check" aria-hidden="true">
                ✓
              </span>
            </button>
          ))}
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="choice-grid choice-grid--occasion">
          {occasions.map((option) => (
            <button
              className={`choice-card${answers.occasion === option.value ? " is-selected" : ""}`}
              type="button"
              aria-pressed={answers.occasion === option.value}
              key={option.value}
              onClick={() =>
                setAnswers((current) => ({
                  ...current,
                  occasion: option.value,
                }))
              }
            >
              <span className="choice-card__emoji">{option.emoji}</span>
              <strong>{option.label}</strong>
              <span className="choice-card__check" aria-hidden="true">
                ✓
              </span>
            </button>
          ))}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="chip-grid">
          {genres.map((option) => (
            <button
              className={`select-chip${answers.genres.includes(option.value) ? " is-selected" : ""}`}
              type="button"
              aria-pressed={answers.genres.includes(option.value)}
              key={option.value}
              onClick={() =>
                setAnswers((current) => ({
                  ...current,
                  genres: toggleValue(current.genres, option.value),
                }))
              }
            >
              {answers.genres.includes(option.value) ? (
                <span aria-hidden="true">✓</span>
              ) : null}
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="choice-grid choice-grid--age">
          {ages.map((option) => (
            <button
              className={`choice-card choice-card--age${answers.movieAge === option.value ? " is-selected" : ""}`}
              type="button"
              aria-pressed={answers.movieAge === option.value}
              key={option.value}
              onClick={() =>
                setAnswers((current) => ({
                  ...current,
                  movieAge: option.value,
                }))
              }
            >
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
              <span className="choice-card__check" aria-hidden="true">
                ✓
              </span>
            </button>
          ))}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="rating-grid">
          {ratings.map((option) => (
            <button
              className={`rating-card${answers.mpaaRatings.includes(option.value) ? " is-selected" : ""}`}
              type="button"
              aria-pressed={answers.mpaaRatings.includes(option.value)}
              key={option.value}
              onClick={() =>
                setAnswers((current) => ({
                  ...current,
                  mpaaRatings: toggleValue(current.mpaaRatings, option.value),
                }))
              }
            >
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
              <span className="rating-card__check" aria-hidden="true">
                ✓
              </span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="choice-grid choice-grid--categories">
        {categories.map((option) => (
          <button
            className={`choice-card${answers.categories.includes(option.value) ? " is-selected" : ""}`}
            type="button"
            aria-pressed={answers.categories.includes(option.value)}
            key={option.value}
            onClick={() =>
              setAnswers((current) => ({
                ...current,
                categories: toggleValue(current.categories, option.value),
              }))
            }
          >
            <span className="choice-card__emoji">{option.emoji}</span>
            <strong>{option.label}</strong>
            <span className="choice-card__check" aria-hidden="true">
              ✓
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="quiz-wrap" aria-labelledby="quiz-title">
      <div className="quiz-topline">
        <button className="quiet-button" type="button" onClick={onCancel}>
          بازگشت به خانه
        </button>
        <span>پیشنهادت رو با هم پیدا کنیم</span>
      </div>
      <div className="quiz-panel">
        <div className="quiz-progress" aria-label={`مرحله ${step + 1} از ۶`}>
          <div
            className="quiz-progress__fill"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="quiz-heading">
          <div className="quiz-heading__eyebrow">
            <span>۰{step + 1}</span>
            {question.eyebrow}
          </div>
          <h1 id="quiz-title">{question.title}</h1>
          <p>{question.description}</p>
        </div>
        {renderOptions()}
        <div className="quiz-footer">
          <span className="quiz-footer__hint">
            {step === 2 || step === 4 || step === 5
              ? "انتخاب چند گزینه امکان‌پذیره"
              : "یکی رو انتخاب کن"}
          </span>
          <div className="quiz-footer__actions">
            {step > 0 ? (
              <button
                className="back-button"
                type="button"
                onClick={() => setStep((current) => (current - 1) as QuizStep)}
              >
                قبلی
              </button>
            ) : null}
            <button
              className="button button--lime"
              type="button"
              onClick={continueQuiz}
            >
              {step === 5 ? "پیشنهاد فیلم من" : "ادامه"}
              <span aria-hidden="true">↙</span>
            </button>
          </div>
        </div>
      </div>
      <p className="privacy-note">
        <span aria-hidden="true">✳</span> بدون ثبت‌نام؛ سلیقه‌ات فقط برای همین
        پیشنهاد استفاده می‌شه.
      </p>
    </section>
  );
}
