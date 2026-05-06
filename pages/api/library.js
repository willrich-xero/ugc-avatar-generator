// pages/api/library.js
// GET    — returns full library
// POST   — appends entry
// DELETE — removes entry by id
//
// Uses Upstash Redis via @vercel/kv in all environments.
// Requires KV_REST_API_URL and KV_REST_API_TOKEN env vars.

import { kv } from '@vercel/kv'

const KV_KEY = 'ugc-library'

async function readLibrary() {
  const data = await kv.get(KV_KEY)
  return data ?? { avatars: [], environments: [] }
}

async function writeLibrary(data) {
  await kv.set(KV_KEY, data)
}

export default async function handler(req, res) {
  console.log('Library API:', req.method)

  try {
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
      const library = await readLibrary()
      library[type].unshift({ ...entry, id: Date.now(), createdAt: new Date().toISOString() })
      await writeLibrary(library)
      console.log('Saved to KV, type:', type, 'total:', library[type].length)
      return res.status(200).json({ success: true })
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
  } catch (err) {
    console.error('Library error:', err.message)
    return res.status(500).json({ error: 'Library operation failed', details: err.message })
  }
}
