// pages/api/angles.js
// Disable TLS verification for Flora API (self-signed cert in chain)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
// Starts a Flora angle-generator-final run.
// Takes 4 image inputs: 3 character sheet images + 1 environment shot.
// All inputs must be public URLs — uploads to ImageKit if base64.
// Returns runId immediately — browser polls /api/poll for results.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { images } = req.body
  // images: array of 4 public URLs in order:
  // [fullBodyFront, fullBodySide, expressions, environmentShot]

  if (!images || images.length !== 4) {
    return res.status(400).json({ error: '4 images are required' })
  }

  const apiKey = process.env.FLORA_API_KEY
  const techniqueSlug = 'angle-generator-final'

  if (!apiKey) {
    return res.status(500).json({ error: 'FLORA_API_KEY not set in .env.local' })
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  try {
    // Step 1: fetch technique to discover input IDs
    const techniqueRes = await fetch(
      `https://app.flora.ai/api/v1/techniques/${techniqueSlug}`,
      { headers }
    )

    if (!techniqueRes.ok) {
      const error = await techniqueRes.text()
      console.error('Technique fetch error:', techniqueRes.status, error)
      return res.status(techniqueRes.status).json({ error: 'Could not fetch technique', details: error })
    }

    const technique = await techniqueRes.json()
    console.log('Angle generator inputs:', JSON.stringify(technique.inputs?.map(i => ({ id: i.id, type: i.type })), null, 2))

    const imageInputs = technique.inputs?.filter(i => i.type === 'imageUrl' || i.type === 'image') ?? []

    if (imageInputs.length < 4) {
      return res.status(500).json({ error: `Expected at least 4 image inputs, found ${imageInputs.length}` })
    }

    // Step 2: build inputs — all images should already be public URLs
    const inputs = images.map((url, i) => ({
      id: imageInputs[i].id,
      type: imageInputs[i].type,
      value: url,
    }))

    console.log('Submitting to:', techniqueSlug)
    console.log('Inputs:', JSON.stringify(inputs.map(i => ({ id: i.id, type: i.type, value: i.value.substring(0, 60) })), null, 2))

    // Step 3: submit the run
    const runRes = await fetch(
      `https://app.flora.ai/api/v1/techniques/${techniqueSlug}/runs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs, mode: 'async' }),
      }
    )

    if (!runRes.ok) {
      const error = await runRes.text()
      console.error('Flora run error:', error)
      return res.status(runRes.status).json({ error: 'Flora API error', details: error })
    }

    const run = await runRes.json()
    return res.status(200).json({ runId: run.runId, techniqueSlug })
  } catch (err) {
    console.error('Angle generator error:', err)
    console.error('Error name:', err.name)
    console.error('Error cause:', err.cause)
    return res.status(500).json({ 
      error: err.message || 'Failed to start angle generator run',
      name: err.name,
      cause: String(err.cause ?? ''),
    })
  }
}
