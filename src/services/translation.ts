const LATIN_LETTERS = /[A-Za-z]/;
const MYMEMORY_API = "https://api.mymemory.translated.net/get";
const TRANSLATION_CACHE_PREFIX = "film-jo-fa-overview-v1:";

export function isPersianText(value: string) {
  const persianCount = value.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latinCount = value.match(/[A-Za-z]/g)?.length ?? 0;
  return persianCount >= 5 && persianCount >= latinCount * 0.15;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function getCachedPersianTranslation(movieId: number) {
  try {
    const value = localStorage.getItem(`${TRANSLATION_CACHE_PREFIX}${movieId}`);
    return value && isPersianText(value) ? value : null;
  } catch {
    return null;
  }
}

export function cachePersianTranslation(movieId: number, value: string) {
  try {
    localStorage.setItem(`${TRANSLATION_CACHE_PREFIX}${movieId}`, value);
  } catch {
    // Translation still works when browser storage is unavailable.
  }
}

function splitIntoRequestSizedChunks(text: string) {
  const chunks: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (new TextEncoder().encode(next).length > 450 && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(text: string, signal?: AbortSignal) {
  const url = new URL(MYMEMORY_API);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "en|fa");
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("ترجمهٔ خلاصه در دسترس نیست.");
  const data = (await response.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  const translated = decodeEntities(
    data.responseData?.translatedText ?? "",
  ).trim();
  if (data.responseStatus !== 200 || !isPersianText(translated)) {
    throw new Error("ترجمهٔ فارسی برای این خلاصه پیدا نشد.");
  }
  return translated;
}

export async function translateOverviewToPersian(
  movieId: number,
  overview: string,
  signal?: AbortSignal,
) {
  const source = overview.trim();
  if (!source || isPersianText(source) || !LATIN_LETTERS.test(source))
    return source;
  const cached = getCachedPersianTranslation(movieId);
  if (cached) return cached;

  const chunks = splitIntoRequestSizedChunks(source);
  const translated: string[] = [];
  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk, signal));
  }
  const result = translated.join(" ");
  cachePersianTranslation(movieId, result);
  return result;
}
