// pages/api/location.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Starts a Flora character-location-generator run.
// Takes 3 character sheet image URLs + a text prompt.
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

  const { prompt, referenceImages } = req.body
  // referenceImages: array of 3 items, each either:
  //   - a public URL (from character sheet outputs)
  //   - a base64 data URL (from manual upload in environment tool)

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' })
  }
  if (!referenceImages || referenceImages.length !== 3) {
    return res.status(400).json({ error: '3 reference images are required' })
  }

  const apiKey = process.env.FLORA_API_KEY
  const techniqueSlug = process.env.FLORA_LOCATION_SLUG || 'character-location-generator'

  if (!apiKey) {
    return res.status(500).json({ error: 'FLORA_API_KEY not set in .env.local' })
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
      console.error('Technique fetch error:', techniqueRes.status, error)
      return res.status(techniqueRes.status).json({ error: 'Could not fetch technique', details: error })
    }

    const technique = await techniqueRes.json()
    console.log('Location technique inputs:', JSON.stringify(technique.inputs?.map(i => ({ id: i.id, type: i.type })), null, 2))

    // Separate text and image inputs
    const textInput = technique.inputs?.find(i => i.type === 'text')
    const imageInputs = technique.inputs?.filter(i => i.type === 'imageUrl' || i.type === 'image') ?? []

    if (!textInput) {
      return res.status(500).json({ error: 'No text input found in technique schema', inputs: technique.inputs })
    }
    if (imageInputs.length < 3) {
      return res.status(500).json({ error: `Expected 3 image inputs, found ${imageInputs.length}`, inputs: technique.inputs })
    }

    // Images arrive as public URLs (uploaded by environment.js via /api/upload)
    const resolvedUrls = referenceImages
    console.log('Reference URLs:', resolvedUrls)

    // Step 3: build inputs array — images first, then text (order matches technique schema)
    const inputs = [
      ...resolvedUrls.map((url, i) => ({
        id: imageInputs[i].id,
        type: imageInputs[i].type,
        value: url,
      })),
      {
        id: textInput.id,
        type: 'text',
        value: prompt,
      },
    ]

    console.log('Submitting to:', techniqueSlug)
    console.log('Inputs:', JSON.stringify(inputs.map(i => ({ id: i.id, type: i.type, value: i.type === 'text' ? i.value.substring(0, 60) + '...' : i.value })), null, 2))

    // Step 4: submit the run
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
    return res.status(200).json({ runId: run.run_id, techniqueSlug })
  } catch (err) {
    console.error('Location generator error:', err)
    return res.status(500).json({ error: err.message || 'Failed to start location run' })
  }
}
