# UGC Avatar Generator

Next.js prototype for generating AI avatars for Xero UGC video content.
Built on the same stack as the Charm Generator — Flora AI + client-side polling.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your values:

```
FLORA_API_KEY=your_flora_api_key_here
FLORA_TECHNIQUE_SLUG=your_technique_slug_here

IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

- **FLORA_API_KEY** — your Flora API key (rotate regularly, it expires)
- **FLORA_TECHNIQUE_SLUG** — the slug for your Nano Banana Pro technique in Flora
- **ImageKit keys** — needed if you want to upload lighting reference images via the tool (optional for now)

### 3. Add lighting reference images

In `pages/index.js`, find the `LIGHTING_REFERENCE_URLS` array near the top and add your approved lighting reference image URLs:

```js
const LIGHTING_REFERENCE_URLS = [
  'https://ik.imagekit.io/your_id/lighting-ref-1.jpg',
  'https://ik.imagekit.io/your_id/lighting-ref-2.jpg',
]
```

Upload the reference images to ImageKit first (Flora only accepts images from approved hosts).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How it works

### Generation flow (client-side polling)

Flora avatar generation takes 60–180+ seconds. Rather than a single long API call
(which would time out on Vercel), the app splits generation into two routes:

- **`/api/generate`** — starts the Flora run, returns a `runId` immediately (fast)
- **`/api/poll`** — called by the browser every 3 seconds until Flora returns `completed`

Each poll request is a short fresh call — no timeout issues.

### Prompt assembly

The character form fields are assembled into a `Character:` block and injected
into the locked master prompt template. The lighting section, shot description,
camera feel, and avoid list never change — only the character block varies per avatar.

### Lighting references

The approved lighting reference images are passed as hidden `imageUrl` inputs
to the Flora technique alongside the text prompt. Flora uses them to match
lighting quality without adopting the character appearance from the reference.

---

## Project structure

```
pages/
  index.js          — Main UI (4-step form: character → prompt → generate → library)
  api/
    generate.js     — POST: starts Flora run, returns runId
    poll.js         — GET: polls Flora run status, returns progress + outputs
public/             — Static assets
.env.local          — API keys (never commit this)
```

---

## Deploying to Vercel

When ready to deploy:

1. Push to a **public** GitHub repo (required on Vercel Hobby plan)
2. Import into Vercel
3. Add environment variables in Vercel dashboard → Settings → Environment Variables
4. **Note:** Vercel Hobby plan has a 60s function timeout. For production use, upgrade to Vercel Pro — video generation runs can take 2–3 minutes.
