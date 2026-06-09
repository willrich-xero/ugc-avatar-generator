# UGC Avatar Generator — Claude Code Context

## Project overview
Next.js 14.2.3 web app for Xero that generates AI avatar characters and places them into realistic home-based environments for UGC video content. Deployed on Vercel.

## Before making any changes
Always create a feature branch first:
```bash
git checkout -b feature/your-feature-name
```
Test locally with `npm run dev`, check Vercel preview URL, then merge to main.

## Tech stack
- **Next.js 14.2.3** — pages router (not app router)
- **Flora AI** — image generation via REST API
- **ImageKit** — image hosting for reference inputs (Flora imageUrl inputs need public HTTPS URLs, not base64)
- **Vercel KV (Upstash Redis)** — persistent library storage via `@vercel/kv`
- **Vercel** — deployment, auto-deploys on push to main

## Project structure
```
pages/
  index.js              — Home menu
  create-avatar.js      — Avatar creation (Step 1)
  character-sheet.js    — Character sheet generator (Step 2)
  environment.js        — Environment generator (Step 3)
  shot-generator.js     — Shot generator (Step 4)
  ptc-generator.js      — PTC generator (Step 5)
  library.js            — Avatar library view
  api/
    generate.js         — Flora avatar generation
    poll.js             — Universal polling (accepts ?techniqueSlug param)
    character-sheet.js  — Character sheet generation
    location.js         — Environment + character placement
    upload.js           — ImageKit upload helper
    angles.js           — Shot generator
    ptc.js              — PTC generator
    library.js          — KV library CRUD (GET, POST, DELETE)
library.json            — Local dev fallback (KV used in production)
```

## Flora technique slugs
| Tool | Slug |
|------|------|
| Avatar creation | `ucg-avatar-generator-v2` (env: `FLORA_TECHNIQUE_SLUG`) |
| Character sheet | `ugc-character-sheet-generator` (env: `FLORA_CHARACTER_SHEET_SLUG`) |
| Environment | `character-location-generator` (env: `FLORA_LOCATION_SLUG`) |
| Shot generator | `angle-generator-final` |
| PTC generator | `piece-to-camera-generator` |

## Critical API route rules
1. **Every API route must have this at the top** — Flora uses a self-signed cert:
   ```js
   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
   ```
2. **Always fetch technique schema before submitting a run** — input IDs must match exactly
3. **Flora imageUrl inputs require public HTTPS URLs** — upload to ImageKit first, never send base64 directly
4. **character-location-generator input order** — images first, text last
5. **All API routes need** `export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }`

## Library storage
- Production: Vercel KV via `@vercel/kv`, key `ugc-library`
- Local dev: `library.json` on disk (fallback when KV env vars absent)
- Save pattern: always DELETE old entry then POST new one (no update endpoint)
- Structure: `{ avatars: [{ id, name, avatarUrl, meta, characterSheet, environments, ptcShots }] }`

## Environment variables
```
FLORA_API_KEY
FLORA_TECHNIQUE_SLUG=ucg-avatar-generator-v2
FLORA_CHARACTER_SHEET_SLUG=character-sheet-generator
FLORA_LOCATION_SLUG=character-location-generator
IMAGEKIT_PRIVATE_KEY
IMAGEKIT_URL_ENDPOINT
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
REDIS_URL
```

## Key prompt rules (do not break these)
- Avatar framing: face slightly **off-centre**, never symmetrically centred
- All device screens: **solid flat green #00FF00**, no glow or spill
- Desk **against the wall**, monitors **directly on desk** (not on books/risers)
- Character placement: **eyes directed at screen**, not looking away
- Avoid: rosy cheeks, overly warm colour temperature, excessive shadows
- All environment/character prompts use **gender neutral language** — they/their/them

## Version
Current: **v1.0.0** — bump in `pages/index.js` subtitle on each meaningful release
- Patch v1.0.x — bug fixes
- Minor v1.x.0 — new features  
- Major vx.0.0 — significant rebuild

## Current focus / next steps
- Business vertical support — Construction, Ecommerce/Fashion, Hairdressing, Café Owner, Freelancer
- Avatar creator has vertical clothing mode already built
- Need to build vertical-specific environment prompts and B-roll shot generation
- Seeddance 2.0 storyboard workflow running in parallel (separate from this app)
