// pages/api/character-sheet.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Starts a Flora character-sheet-generator run.
// Accepts a single avatar image as a base64 data URL.
// Fetches technique schema first to discover the correct image input ID.
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

  const { imageDataUrl } = req.body

  if (!imageDataUrl) {
    return res.status(400).json({ error: 'imageDataUrl is required' })
  }

  const apiKey = process.env.FLORA_API_KEY
  const techniqueSlug = process.env.FLORA_CHARACTER_SHEET_SLUG

  if (!techniqueSlug) {
    return res.status(500).json({ error: 'FLORA_CHARACTER_SHEET_SLUG not set in .env.local' })
  }

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
      console.error('Technique fetch error — status:', techniqueRes.status, 'body:', error)
      return res.status(techniqueRes.status).json({
        error: 'Could not fetch technique',
        status: techniqueRes.status,
        details: error,
        url: `https://app.flora.ai/api/v1/techniques/${techniqueSlug}`,
      })
    }

    const technique = await techniqueRes.json()
    console.log('Full technique schema:', JSON.stringify(technique, null, 2))

    // Find the image input
    const imageInput = technique.inputs?.find(i => i.type === 'imageUrl' || i.type === 'image')
    if (!imageInput) {
      return res.status(500).json({ error: 'No image input found in technique schema', inputs: technique.inputs })
    }

    // If already a public URL (e.g. from Flora library), use it directly.
    // Otherwise it's a base64 data URL — upload to ImageKit first.
    let publicImageUrl
    if (imageDataUrl.startsWith('http')) {
      console.log('Using existing public URL:', imageDataUrl)
      publicImageUrl = imageDataUrl
    } else {
      const imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
      if (!imagekitPrivateKey) {
        return res.status(500).json({ error: 'IMAGEKIT_PRIVATE_KEY not set in .env.local' })
      }
      const base64Data = imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, '')
      const fileName = `character-sheet-input-${Date.now()}.png`
      console.log('Uploading to ImageKit...')
      const ikAuth = Buffer.from(imagekitPrivateKey + ':').toString('base64')
      const ikForm = new FormData()
      ikForm.append('file', `data:image/png;base64,${base64Data}`)
      ikForm.append('fileName', fileName)
      ikForm.append('folder', '/character-sheet-inputs')
      const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: { Authorization: `Basic ${ikAuth}` },
        body: ikForm,
      })
      if (!ikRes.ok) {
        const ikError = await ikRes.text()
        console.error('ImageKit upload error:', ikError)
        return res.status(500).json({ error: 'Failed to upload image to ImageKit', details: ikError })
      }
      const ikData = await ikRes.json()
      publicImageUrl = ikData.url
      console.log('ImageKit URL:', publicImageUrl)
    }

    const inputs = [
      {
        id: imageInput.id,
        type: imageInput.type,
        value: publicImageUrl,
      },
    ]

    console.log('Submitting to technique:', techniqueSlug)
    console.log('Image input id:', imageInput.id, 'type:', imageInput.type)

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
    return res.status(200).json({ runId: run.run_id, techniqueSlug })
  } catch (err) {
    console.error('Character sheet error:', err)
    return res.status(500).json({ error: 'Failed to start character sheet run' })
  }
}
