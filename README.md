# Film-Jo | Movie Recommender

A Persian, right-to-left movie discovery app that recommends films based on your mood, occasion, favorite genres, release period, age rating, and preferred movie themes.

## Features

- Cinematic spotlight slider with popular TMDB movies, poster selection, playback controls, auto-pause, and reduced-motion support
- Six-step quiz with multi-select genres and optional filters
- Personalized recommendations ranked from TMDB results, with duplicate filtering
- Multi-page discovery, relaxed filters when results run low, and a fresh recommendation cycle after a list is exhausted
- TMDB movie data enriched with OMDb details when available, without adding duplicate search results
- Persian movie summaries from TMDB translations, with a translation fallback and browser-side caching
- Movie details, cast and crew, ratings, and YouTube trailers when available
- Email sign-up and login with Supabase Auth
- Favorites saved in the browser
- Responsive Persian and RTL interface

## Tech Stack

- React 19 and TypeScript
- Vite
- TMDB API
- OMDb API
- Supabase Auth

## Requirements

- Node.js 22 or newer
- API credentials for TMDB and OMDb
- A Supabase project if you want to use sign-up and login

## Getting Started

1. Fork or clone this repository, then open the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and add your own API credentials:

   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key
   VITE_OMDB_API_KEY=your_omdb_api_key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   Get a TMDB API key from [TMDB](https://www.themoviedb.org/settings/api) and an OMDb API key from [OMDb](https://www.omdbapi.com/apikey.aspx). To enable login, create a project in [Supabase](https://supabase.com/dashboard), enable email/password authentication, and add your local and deployed URLs to the allowed redirect URLs.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Create a production build or preview it locally:

   ```bash
   npm run build
   npm run preview
   ```

## Forks and API Credentials

`.env.local` is ignored by Git and is not included in this repository. The `.env.example` file contains placeholders only. Anyone running a fork must create their own `.env.local` and provide their own TMDB and OMDb API keys and, if needed, their own Supabase project settings. Do not commit `.env.local` or put real credentials in source code.

Vite exposes variables prefixed with `VITE_` to browser code. TMDB and OMDb keys used by this frontend can therefore be inspected by visitors of a deployed site. If you need to keep those provider keys confidential in production, route API requests through a backend or serverless function. A Supabase publishable key is intended for client-side use; protect data with Row Level Security (RLS) and never put a Supabase secret or service-role key in this frontend.

## Movie Summary Translation

The app first checks for a Persian translation on TMDB. If an overview is only available in another language, it requests a Persian translation from the public MyMemory service and caches the result in the browser. The public translation service may have temporary limits; if translation is unavailable, the app displays a Persian status message instead of an English synopsis.

## Authentication and Favorites

Email sign-up and login use Supabase Auth and require the Supabase values in `.env.local`. Favorites are currently stored in the browser and are not synchronized between devices or accounts.

## Data Attribution

This product uses the TMDB API and images, and OMDb movie information. This product is not endorsed or certified by TMDB.
