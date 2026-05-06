// pages/api/library.js
// GET  — returns the full library (avatars + environments)
// POST — appends a new entry to avatars or environments

import fs from 'fs'
import path from 'path'

const LIBRARY_PATH = path.join(process.cwd(), 'library.json')

function readLibrary() {
  try {
    const raw = fs.readFileSync(LIBRARY_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { avatars: [], environments: [] }
  }
}

function writeLibrary(data) {
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const library = readLibrary()
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

    const library = readLibrary()
    library[type].unshift({ ...entry, id: Date.now(), createdAt: new Date().toISOString() })
    writeLibrary(library)
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { type, id } = req.body
    if (!type || !id) {
      return res.status(400).json({ error: 'type and id are required' })
    }
    const library = readLibrary()
    library[type] = library[type].filter(e => e.id !== id)
    writeLibrary(library)
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
