// pages/api/poll.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Called by the browser every 3 seconds to check run status.
// Returns status, progress (0-100), and outputs when complete.
// Each call is short and stateless — no timeout issues on Vercel.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { runId, techniqueSlug: slugParam } = req.query

  if (!runId) {
    return res.status(400).json({ error: 'runId is required' })
  }

  const apiKey = process.env.FLORA_API_KEY
  // Use explicit slug if provided (e.g. character-sheet-generator), otherwise fall back to env var
  const techniqueSlug = slugParam || process.env.FLORA_TECHNIQUE_SLUG

  if (!apiKey || !techniqueSlug) {
    return res.status(500).json({ error: 'Flora API key not configured' })
  }

  try {
    const response = await fetch(
      `https://app.flora.ai/api/v1/techniques/${techniqueSlug}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Flora poll error:', error)
      return res.status(response.status).json({ error: 'Flora API error', details: error })
    }

    const data = await response.json()

    // Log full output structure when complete so we can inspect Flora URL format
    if (data.status === 'completed') {
      console.log('Flora completed outputs:', JSON.stringify(data.outputs, null, 2))
    }

    // Pass through status, progress and outputs
    return res.status(200).json({
      status: data.status,           // 'pending' | 'running' | 'completed' | 'failed'
      progress: data.progress ?? 0,  // 0–100
      outputs: data.outputs ?? [],   // array of { url, type } when completed
    })
  } catch (err) {
    console.error('Poll error:', err)
    return res.status(500).json({ error: 'Failed to poll run status' })
  }
}
