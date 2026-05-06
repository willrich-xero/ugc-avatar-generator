// pages/api/library.js
// GET  — returns the full library (avatars + environments)
// POST — appends a new entry to avatars or environments
// DELETE — removes an entry by id
//
// Storage strategy:
//   Production (Vercel): uses @vercel/kv (Redis)
//   Local development:   falls back to library.json on disk

import fs from 'fs'
import path from 'path'

const LIBRARY_PATH = path.join(process.cwd(), 'library.json')
const KV_KEY = 'ugc-library'

// ── Determine storage backend ─────────────────────────────────────────────────
function isKVAvailable() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  console.log('KV_REST_API_URL:', url ? url.substring(0, 30) + '...' : 'NOT SET')
  console.log('KV_REST_API_TOKEN:', token ? 'SET' : 'NOT SET')
  return !!(url && token)
}

// ── KV helpers ────────────────────────────────────────────────────────────────
async function kvRead() {
  const { kv } = await import('@vercel/kv')
  const data = await kv.get(KV_KEY)
  return data ?? { avatars: [], environments: [] }
}

async function kvWrite(data) {
  const { kv } = await import('@vercel/kv')
  await kv.set(KV_KEY, data)
}

// ── File helpers (local dev) ──────────────────────────────────────────────────
function fileRead() {
  try {
    const raw = fs.readFileSync(LIBRARY_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { avatars: [], environments: [] }
  }
}

function fileWrite(data) {
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(data, null, 2), 'utf8')
}

// ── Unified read/write ────────────────────────────────────────────────────────
async function readLibrary() {
  if (isKVAvailable()) return kvRead()
  return fileRead()
}

async function writeLibrary(data) {
  if (isKVAvailable()) return kvWrite(data)
  return fileWrite(data)
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  console.log('Library API called:', req.method)
  console.log('KV available:', isKVAvailable())
  console.log('KV_REST_API_URL set:', !!process.env.KV_REST_API_URL)
  console.log('KV_REST_API_TOKEN set:', !!process.env.KV_REST_API_TOKEN)
  if (req.method === 'GET') {
    const library = await readLibrary()
    return res.status(200).json(library)
  }

  if (req.method === 'POST') {
    const { type, entry } = req.body
    if (!type || !entry) {
      return res.status(400).json({ error: 'type and entry are required' })
    }
    if (type !== 'avatars' && type !== 'environments') {
      return res.status(400).json({ error: 'type must be avatars or environments' })
    }

    try {
      const library = await readLibrary()
      console.log('Current library size:', library[type]?.length)
      library[type].unshift({ ...entry, id: Date.now(), createdAt: new Date().toISOString() })
      await writeLibrary(library)
      console.log('Write successful, new size:', library[type].length)
      return res.status(200).json({ success: true })
    } catch (err) {
      console.error('Library write error:', err)
      return res.status(500).json({ error: 'Failed to save to library', details: err.message })
    }
  }

  if (req.method === 'DELETE') {
    const { type, id } = req.body
    if (!type || !id) {
      return res.status(400).json({ error: 'type and id are required' })
    }

    const library = await readLibrary()
    library[type] = library[type].filter(e => e.id !== id)
    await writeLibrary(library)
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
