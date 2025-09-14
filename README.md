# Hearing Decoded

A modern, fast site for audiobooks/podcasts. Lists episodes, plays beautiful MP3 with live captions, and includes an admin to upload and edit.

- Tech: Next.js (App Router) + Tailwind + Netlify Functions + Netlify Blobs + S3 + OpenAI Whisper
- Deploy: Netlify (with `@netlify/plugin-nextjs`)

## Features

- Episode index page with title, rating, views, and duration
- Episode page with modern audio player (play/pause, scrubber, jump ±, speed, volume) and live captions (WebVTT)
- Admin (`/admin`) with Netlify Identity login
  - Upload MP3 directly to S3 via presigned URL
  - Create/edit/delete episodes
  - Auto-transcribe using Whisper into VTT + JSON
- Data stored in Netlify Blobs (index + item JSON)

## Setup

1) Clone

```
git clone https://github.com/andrelavell/hearing-decoded
cd hearing-decoded
```

2) Install

```
npm install
```

3) Environment

Copy `.env.example` to Netlify site environment variables (recommended) or local `.env` if using `netlify dev`.

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET
- AWS_S3_REGION
- OPENAI_API_KEY
- SITE_BASE_URL (optional; Netlify sets `URL` in prod)

Enable Netlify Identity and Netlify Blobs in the site settings.

4) Run locally

```
npm run dev
```

Visit http://localhost:3000

## Deploy to Netlify

- Push to GitHub and connect the repo to Netlify
- Build command: `npm run build`
- Publish directory: `.next`
- Plugin: `@netlify/plugin-nextjs`
- Functions directory: `netlify/functions`

## S3 Notes

- Upload uses `PUT` to a presigned URL. Uploaded object is publicly readable via bucket policy or static hosting URL.
- Files are stored under `episodes/` and transcripts under `transcripts/{episodeId}/`.

## Whisper Notes

- `netlify/functions/transcribe.ts` downloads audio from S3, calls OpenAI Whisper (`whisper-1`) for verbose JSON, converts to WebVTT, saves both to S3, and updates the episode via `/api/episodes/:id`.

## Data Model

`lib/types.ts`

- Episode: id, title, body, audioUrl, captionsVttUrl, transcriptJsonUrl, rating, views, createdAt, updatedAt, duration

## Security

- Admin UI uses Netlify Identity on the client. For production, consider protecting API routes with JWT verification from Identity for stricter control.

## License

MIT
