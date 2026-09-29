import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../services/supabase";

type LoginPageProps = {
  onBack: () => void;
  onAuthenticated: () => void;
};

type AuthMode = "login" | "signup";

function friendlyAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials"))
    return "ایمیل یا گذرواژه درست نیست.";
  if (value.includes("email not confirmed"))
    return "اول ایمیلت رو تأیید کن، بعد وارد شو.";
  if (value.includes("user already registered"))
    return "این ایمیل قبلاً حساب ساخته؛ وارد شو.";
  if (value.includes("password should be at least"))
    return "گذرواژه باید حداقل ۶ نویسه داشته باشه.";
  if (value.includes("rate limit"))
    return "درخواست‌های زیادی فرستادی؛ کمی بعد دوباره امتحان کن.";
  return "ورود انجام نشد. تنظیمات حساب و اتصال اینترنت رو بررسی کن.";
}

export function LoginPage({ onBack, onAuthenticated }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        onAuthenticated();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;
        if (data.session) onAuthenticated();
        else setSuccess("لینک تأیید ساخت حساب رو از ایمیلت باز کن.");
      }
    } catch (authError) {
      setError(
        friendlyAuthError(authError instanceof Error ? authError.message : ""),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-screen container" aria-labelledby="auth-title">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-art__halo" />
        <div className="auth-ticket">
          <span>FILM-JO</span>
          <b>✳</b>
          <small>YOUR NEXT STORY</small>
          <i />
        </div>
        <div className="auth-art__caption">
          <span>۰۱ / فیلمِ بعدی</span>
          <p>
            برای پیدا کردنش
            <br />
            فقط کافیه <em>وارد بشی.</em>
          </p>
        </div>
      </div>
      <div className="auth-panel">
        <button className="auth-back" type="button" onClick={onBack}>
          <span aria-hidden="true">→</span> برگشت به فیلم‌جو
        </button>
        <div className="auth-panel__heading">
          <p className="eyebrow">
            <span className="eyebrow__dot" /> حساب فیلم‌جو
          </p>
          <h1 id="auth-title">
            {mode === "login" ? "خوش برگشتی." : "به فیلم‌جو خوش اومدی."}
          </h1>
          <p>
            {mode === "login"
              ? "وارد شو تا دوباره انتخاب رو از همین‌جا ادامه بدی."
              : "یک حساب بساز و فیلم‌های دوست‌داشتنی‌ات رو نگه دار."}
          </p>
        </div>

        {supabase ? (
          <form className="auth-form" onSubmit={(event) => void submit(event)}>
            <label htmlFor="auth-email">ایمیل</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <div className="auth-password-label">
              <label htmlFor="auth-password">گذرواژه</label>
              {mode === "login" ? <span>حداقل ۶ نویسه</span> : null}
            </div>
            <input
              id="auth-password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? (
              <p className="auth-message auth-message--error" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="auth-message auth-message--success" role="status">
                {success}
              </p>
            ) : null}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy
                ? "یک لحظه…"
                : mode === "login"
                  ? "ورود به حساب"
                  : "ساخت حساب"}
              <span aria-hidden="true">↙</span>
            </button>
            <p className="auth-switch">
              {mode === "login" ? "حساب نداری؟" : "قبلاً حساب ساختی؟"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                  setSuccess("");
                }}
              >
                {mode === "login" ? "ثبت‌نام کن" : "وارد شو"}
              </button>
            </p>
          </form>
        ) : (
          <div className="auth-not-configured" role="status">
            <span aria-hidden="true">✳</span>
            <h2>ورود هنوز راه‌اندازی نشده</h2>
            <p>
              یک پروژهٔ Supabase بساز و `VITE_SUPABASE_URL` و
              `VITE_SUPABASE_PUBLISHABLE_KEY` را در فایل `.env.local` قرار بده.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              رفتن به Supabase ↗
            </a>
          </div>
        )}
        <p className="auth-footnote">
          با ادامه، شرایط استفاده و حریم خصوصی فیلم‌جو رو می‌پذیری.
        </p>
      </div>
    </section>
  );
}
