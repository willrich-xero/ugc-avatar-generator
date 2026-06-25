process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

const SUFFIX = 'Preserve the candid documentary look, ultra high resolution, sharp facial detail, natural skin texture, bright natural light.'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageUrl, notes } = req.body
  if (!imageUrl || !notes) return res.status(400).json({ error: 'imageUrl and notes are required' })

  const apiKey = process.env.FLORA_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'FLORA_API_KEY not set' })

  const techniqueSlug = 'ugc-image-modifier'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }

  try {
    const techniqueRes = await fetch(`https://app.flora.ai/api/v1/techniques/${techniqueSlug}`, { headers })
    if (!techniqueRes.ok) {
      const error = await techniqueRes.text()
      return res.status(techniqueRes.status).json({ error: 'Could not fetch technique', details: error })
    }
    const technique = await techniqueRes.json()

    const textInput = technique.inputs?.find(i => i.type === 'text')
    const imageInput = technique.inputs?.find(i => i.type === 'imageUrl' || i.type === 'image')

    if (!textInput || !imageInput) {
      return res.status(500).json({ error: 'Unexpected technique schema', inputs: technique.inputs })
    }

    const prompt = `${notes}. ${SUFFIX}`

    const inputs = [
      { id: imageInput.id, type: imageInput.type, value: imageUrl },
      { id: textInput.id, type: 'text', value: prompt },
    ]

    const runRes = await fetch(`https://app.flora.ai/api/v1/techniques/${techniqueSlug}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs, mode: 'async' }),
    })

    if (!runRes.ok) {
      const error = await runRes.text()
      return res.status(runRes.status).json({ error: 'Flora API error', details: error })
    }

    const run = await runRes.json()
    return res.status(200).json({ runId: run.run_id, techniqueSlug })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to start modification run' })
  }
}
