// pages/api/upload.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Receives a single base64 image, uploads to ImageKit, returns public URL.
// Used by the environment generator to convert manual uploads to public URLs
// before passing to the Flora location technique.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageDataUrl, fileName = 'upload.png', folder = '/reference-inputs' } = req.body

  if (!imageDataUrl) {
    return res.status(400).json({ error: 'imageDataUrl is required' })
  }

  const imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
  if (!imagekitPrivateKey) {
    return res.status(500).json({ error: 'IMAGEKIT_PRIVATE_KEY not set in .env.local' })
  }

  try {
    const base64Data = imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, '')
    const ikAuth = Buffer.from(imagekitPrivateKey + ':').toString('base64')
    const ikForm = new FormData()
    ikForm.append('file', `data:image/png;base64,${base64Data}`)
    ikForm.append('fileName', fileName)
    ikForm.append('folder', folder)

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: `Basic ${ikAuth}` },
      body: ikForm,
    })

    if (!ikRes.ok) {
      const error = await ikRes.text()
      console.error('ImageKit upload error:', error)
      return res.status(500).json({ error: 'ImageKit upload failed', details: error })
    }

    const data = await ikRes.json()
    return res.status(200).json({ url: data.url })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Upload failed: ' + err.message })
  }
}
