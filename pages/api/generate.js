// pages/api/generate.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Starts a Flora generation run.
// Accepts a text prompt and optionally an array of base64 reference images
// (used in "With character" mode on the environment generator).
// Returns runId immediately — browser polls /api/poll for results.
//
// The Flora API requires input IDs to match the technique's schema exactly.
// We fetch the technique first to discover the correct input IDs, then use
// them when submitting the run.

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

  const { prompt, referenceImages = [] } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' })
  }

  const apiKey = process.env.FLORA_API_KEY
  const techniqueSlug = process.env.FLORA_TECHNIQUE_SLUG

  if (!apiKey || !techniqueSlug) {
    return res.status(500).json({ error: 'FLORA_API_KEY or FLORA_TECHNIQUE_SLUG not set in .env.local' })
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  try {
    // Step 1: fetch technique to discover correct input IDs
    const techniqueRes = await fetch(
      `https://app.flora.ai/api/v1/techniques/${techniqueSlug}`,
      { headers }
    )

    if (!techniqueRes.ok) {
      const error = await techniqueRes.text()
      console.error('Flora technique fetch error:', error)
      return res.status(techniqueRes.status).json({ error: 'Could not fetch technique', details: error })
    }

    const technique = await techniqueRes.json()
    console.log('Technique inputs:', JSON.stringify(technique.inputs?.map(i => ({ id: i.id, type: i.type }))))

    // Find text input
    const textInput = technique.inputs?.find(i => i.type === 'text')
    if (!textInput) {
      return res.status(500).json({ error: 'No text input found in technique schema', inputs: technique.inputs })
    }

    // Find image inputs (in order) — used for reference images in character mode
    const imageInputs = technique.inputs?.filter(i => i.type === 'imageUrl' || i.type === 'image') ?? []

    // Build inputs array — text prompt first
    const inputs = [
      {
        id: textInput.id,
        type: 'text',
        value: prompt,
      },
    ]

    // Attach reference images if provided, mapped to the technique's image input IDs
    if (referenceImages.length > 0 && imageInputs.length > 0) {
      referenceImages.forEach((dataUrl, i) => {
        if (imageInputs[i]) {
          inputs.push({
            id: imageInputs[i].id,
            type: imageInputs[i].type,
            value: dataUrl,
          })
        }
      })
    }

    console.log(`Submitting run with ${inputs.length} inputs (text + ${inputs.length - 1} images)`)

    // Step 2: submit the run
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
    return res.status(200).json({ runId: run.run_id })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Failed to start generation run' })
  }
}
