import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

// ─── Prompt builders ──────────────────────────────────────────────────────────
function buildEnvDesc(f) {
  const deskDesc = {
    'Timber / warm wood': 'a warm timber desk with natural grain visible',
    'White / IKEA style': 'a clean white desk with simple modern lines',
  }[f.deskStyle] || 'a desk'

  const sizeDesc = {
    'Compact corner': '',
    'Medium dedicated room': 'a medium-sized dedicated home office room with space around the desk',
    'Large dedicated room': 'a spacious dedicated home office with room to breathe on all sides',
  }[f.roomSize] || 'a home office'

  const wallDesc = {
    'Plain painted wall': 'plain painted walls in a neutral tone',
    'Coloured painted wall': 'a bold coloured painted wall — a rich, saturated tone like deep green, terracotta, navy, or burnt orange',
    'Bookshelves': 'bookshelves filled with books and personal objects on the wall behind',
    'Pinboard': 'a pinboard with notes, cards, and papers pinned up on the wall',
    'Shelving': 'open shelving on the wall filled with books, plants, and personal objects',
    'Artwork': 'framed artwork and prints on the wall',
  }[f.wallTreatment] || 'plain walls'

  const lightDesc = 'natural light from a nearby window only — no artificial lighting, soft and directional'

  const tidyDesc = {
    'Very tidy': 'everything neatly arranged, minimal items on the desk surface, ordered and calm',
    'Lived-in': 'everyday objects naturally scattered across the desk — used but not chaotic. Only include items explicitly listed in the personal touches. Do not add books or mugs unless specified.',
  }[f.tidiness] || 'lived-in'

  const techDesc = {
    'Laptop only': 'a laptop open on the desk. The laptop screen displays a solid, flat, pure green (#00FF00) with no gradients, reflections, glow, or light spill onto the keyboard, desk, or surroundings',
    'Laptop + external monitor': 'a laptop alongside an external monitor on the desk. Both screens display a solid, flat, pure green (#00FF00) with no gradients, reflections, glow, or light spill onto any surrounding surfaces or the character',
    'No tech visible': 'no screens or tech visible — just books and analogue objects',
  }[f.tech] || 'a laptop on the desk'

  const housingDesc = {
    'House': 'a house — the space has the feel of a standalone home, with a sense of spaciousness and permanence',
    'Apartment': 'an apartment — the space has the feel of a flat or apartment, compact and urban, with a sense of city living',
  }[f.housingType] || ''

  const touchesDesc = f.personalTouches.length
    ? `Personal touches include: ${f.personalTouches.join(', ').toLowerCase()}.`
    : ''

  const additionalDesc = f.additionalNotes?.trim()
    ? `\n\nAdditional details: ${f.additionalNotes.trim()}`
    : ''

  return { deskDesc, sizeDesc, wallDesc, lightDesc, tidyDesc, techDesc, touchesDesc, additionalDesc, housingDesc }
}

function buildEmptyRoomPrompt(f) {
  const { deskDesc, sizeDesc, wallDesc, lightDesc, tidyDesc, techDesc, touchesDesc, additionalDesc, housingDesc } = buildEnvDesc(f)
  const timeDesc = f.timeOfDay === 'Nighttime'
    ? 'nighttime — no natural light, room lit by warm desk lamp and ambient indoor lighting. Windows dark outside.'
    : 'daytime — natural light from a window, bright and airy'

  return `An empty home office photographed on a smartphone. Use the attached reference image to match the lighting quality, contrast, shadow depth, and overall phone camera feel — do not include any person from the reference image.

Time of day: ${timeDesc}.

The space is ${sizeDesc}${housingDesc ? ` in ${housingDesc}` : ''}. There is ${deskDesc} placed against the wall — not floating in the middle of the room. The desk has ${techDesc}. The walls have ${wallDesc}. The desk surface is ${tidyDesc}. The lighting is ${lightDesc}. ${touchesDesc}

The space feels functional and personal — a real working environment, not a corporate office or staged photo. No people in the frame.${additionalDesc}

Camera feel: Handheld smartphone snapshot. Wide-angle lens approximately 16–24mm equivalent, creating mild barrel distortion at the edges. Slight softness and digital noise typical of a phone camera indoors. Mild auto-exposure over-brightness. The image should feel slightly imperfect — not composed or considered, just quickly grabbed. No film grain, no format simulation.

Composition: Slightly off-axis and asymmetric — not straight-on or perfectly centred. Camera placed casually within the space as if someone just held up their phone to capture the room.

Avoid: Any people or figures, DSLR sharpness, perfectly composed shot, wide depth of field with everything in crisp focus, professional photography aesthetic, flat lighting, film grain, logos or text, symmetrical centred composition, desk floating in the middle of the room, monitors placed on books or risers, green glow or light spill from screens onto the desk or environment, any screen content other than solid flat green.`
}

function buildWithCharacterPrompt(f) {
  const { deskDesc, sizeDesc, wallDesc, lightDesc, tidyDesc, techDesc, touchesDesc, additionalDesc, housingDesc } = buildEnvDesc(f)
  const timeDesc = f.timeOfDay === 'Nighttime'
    ? 'nighttime — no natural light, room lit by warm desk lamp and ambient indoor lighting. Windows dark outside.'
    : 'daytime — natural light from a window, bright and airy'

  const lightingCharDesc = f.timeOfDay === 'Nighttime'
    ? 'Warm desk lamp as primary light source. Skin has warm directional glow from the lamp, soft shadows on the opposite side of the face.'
    : 'Natural window light from the side creating directional illumination and warm shadows on the face. Skin luminous and warm on the lit side. Clear tonal separation between light and shadow.'

  return `A candid smartphone photograph of a person working at their home office desk. Use the attached reference images to match their appearance exactly — face, skin tone, hair, clothing and body proportions. Place them naturally in the environment described below. Do not reproduce any background from the reference images.

Time of day: ${timeDesc}.

Environment: The space is ${sizeDesc}${housingDesc ? ` in ${housingDesc}` : ''}. There is ${deskDesc} placed against the wall — not floating in the middle of the room. The desk has ${techDesc}. The walls have ${wallDesc}. The desk surface is ${tidyDesc}. The lighting is ${lightDesc}. ${touchesDesc}

The space feels functional and personal — a real working environment, not a corporate office or staged photo.${additionalDesc}

Character placement: The character is seated at the desk, naturally engaged with their work — eyes directed at their screen, actively working. They should feel like they belong in the space, not posed in front of it. Their full upper body is visible — head, shoulders and torso — with the desk and environment clearly readable behind them.

Shot: Handheld smartphone feel — slightly off-axis, not straight-on or perfectly centred. Wide-angle lens approximately 16–24mm equivalent with subtle barrel distortion. The angle feels casual and observational, as if someone walked in and took a quick photo.

Camera feel: Smartphone camera simulation. Slight softness and digital noise typical of a phone camera indoors. Mild auto-exposure. Background readable and contextually rich but softly rendered. No film grain, no format simulation.

Lighting: ${lightingCharDesc}

Expression: Genuine, natural, mid-moment — not posed or looking directly at camera. The kind of expression caught while someone is actually working.

Avoid: Character standing rather than seated, character centred symmetrically in frame, perfectly composed shot, DSLR sharpness, flat even lighting, editorial styling, heavy makeup, film grain, logos or text, desk floating in the middle of the room, any background from the reference images, monitors placed on books or risers, green glow or light spill from screens onto the character, desk, or environment, any screen content other than solid flat green.`
}

// ─── Options ─────────────────────────────────────────────────────────────────
const TIME_OF_DAY = ['Daytime']
const DESK_STYLES = ['Timber / warm wood', 'White / IKEA style']
const ROOM_SIZES = ['Medium dedicated room', 'Large dedicated room']
const WALL_TREATMENTS = ['Plain painted wall', 'Coloured painted wall', 'Bookshelves', 'Shelving', 'Pinboard', 'Artwork']
const LIGHTING = ['Window light only']
const HOUSING_TYPES = ['House', 'Apartment']
const TIDINESS = ['Very tidy', 'Lived-in']
const TECH = ['Laptop only', 'Laptop + external monitor', 'No tech visible']
const PERSONAL_TOUCHES = ['Houseplants', 'Framed photos', 'Books stacked on desk', 'Coffee mug', 'Sticky notes', 'Polaroids pinned up', 'Small figurines or objects', 'Stationery pot with pens', 'Headphones on desk', 'Water bottle', 'Artwork']

// ─── Randomise ───────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickN(arr, n) { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n) }

const DEFAULT = {
  timeOfDay: 'Daytime',
  housingType: 'House',
  deskStyle: 'Timber / warm wood',
  roomSize: 'Medium dedicated room',
  wallTreatment: 'Shelving',
  lighting: 'Window + desk lamp',
  tidiness: 'Lived-in',
  tech: 'Laptop only',
  personalTouches: ['Houseplants', 'Coffee mug', 'Books stacked on desk'],
  additionalNotes: '',
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 24, display: 'block' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: 'inherit', background: '#fff', color: '#1A2B4A', boxSizing: 'border-box', minHeight: 72, resize: 'vertical', lineHeight: 1.6 },
}

// ─── Components ───────────────────────────────────────────────────────────────
function Btn({ children, primary, disabled, onClick, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '9px 20px', fontSize: 14, borderRadius: 6,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', fontWeight: primary ? 500 : 400,
      background: primary ? '#13B5EA' : '#fff',
      border: primary ? '1px solid #13B5EA' : '1px solid #E2E8F0',
      color: primary ? '#fff' : '#1A2B4A',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.15s', ...style,
    }}>{children}</button>
  )
}

function ToggleGroup({ options, selected, onToggle, multi = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : selected === opt
        return (
          <div key={opt} onClick={() => onToggle(opt)} style={{
            padding: '6px 12px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
            border: active ? '1px solid #13B5EA' : '1px solid #E2E8F0',
            background: active ? '#E8F6FD' : '#fff',
            color: active ? '#0C7ABF' : '#4A5568',
            fontWeight: active ? 500 : 400,
            userSelect: 'none', transition: 'all 0.1s',
          }}>{opt}</div>
        )
      })}
    </div>
  )
}

function Notice({ children, error, warning }) {
  const colour = error ? '#E74C3C' : warning ? '#E67E22' : '#13B5EA'
  const bg = error ? '#FDEDEC' : warning ? '#FEF6EC' : '#F7F9FC'
  return (
    <div style={{
      background: bg, border: `1px solid ${colour}`, borderRadius: 6,
      padding: '10px 14px', fontSize: 13,
      color: error ? '#C0392B' : warning ? '#A04000' : '#4A5568',
      display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: colour, marginTop: 4, flexShrink: 0 }} />
      {children}
    </div>
  )
}

function Steps({ current }) {
  const steps = ['Configure', 'Generate', 'Library']
  return (
    <div style={{ display: 'flex', marginBottom: 32, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
      {steps.map((label, i) => {
        const n = i + 1; const active = n === current; const done = n < current
        return (
          <div key={n} style={{
            flex: 1, padding: '10px 14px', fontSize: 13,
            color: active ? '#1A2B4A' : '#4A5568',
            background: active ? '#fff' : '#F7F9FC',
            borderRight: i < 2 ? '1px solid #E2E8F0' : 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: active ? 500 : 400,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: active ? '#13B5EA' : done ? '#EAF7EF' : '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500,
              color: active ? '#fff' : done ? '#27AE60' : '#4A5568',
            }}>{done ? '✓' : n}</div>
            {label}
          </div>
        )
      })}
    </div>
  )
}

// Image upload slot component
function ImageUploadSlot({ label, sublabel, preview, onFile, onRemove }) {
  const inputRef = useRef(null)
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#4A5568', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#4A5568', marginBottom: 6, opacity: 0.7 }}>{sublabel}</div>
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #13B5EA', aspectRatio: '3/4' }}>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div onClick={onRemove} style={{
            position: 'absolute', top: 6, right: 6, width: 24, height: 24,
            borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', fontSize: 13, lineHeight: 1,
          }}>✕</div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            aspectRatio: '3/4', border: '1.5px dashed #E2E8F0', borderRadius: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: '#F7F9FC', gap: 8, transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#13B5EA'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
        >
          <div style={{ fontSize: 22, color: '#CBD5E0' }}>+</div>
          <div style={{ fontSize: 12, color: '#4A5568', textAlign: 'center', padding: '0 8px' }}>Upload image</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </div>
  )
}

// Compress an image File to a base64 data URL, resizing to max 1500px on longest side
function compressImage(file, maxDimension = 1500, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = Math.min(maxDimension / img.width, maxDimension / img.height, 1)
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Environment() {
  const [step, setStep] = useState(1)
  const [substep, setSubstep] = useState('character') // 'character' | 'configure'
  const [fields, setFields] = useState(DEFAULT)
  const router = useRouter()
  const [promptOpen, setPromptOpen] = useState(false)

  // Library
  const [library, setLibrary] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [selectedAvatarId, setSelectedAvatarId] = useState(null)
  const [charPickerMode, setCharPickerMode] = useState('library') // 'library' | 'upload'
  const [savedEnvironments, setSavedEnvironments] = useState([])

  // Character reference images (With character mode)
  const [refImages, setRefImages] = useState([null, null, null])
  const [refPreviews, setRefPreviews] = useState([null, null, null])

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(d => { setLibrary(d.avatars ?? []); setLibraryLoading(false) })
      .catch(() => setLibraryLoading(false))
    if (router.query.avatarId) {
      setSelectedAvatarId(Number(router.query.avatarId))
    }
  }, [router.query.avatarId])

  const [genStatus, setGenStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [outputs, setOutputs] = useState([])
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [enlargedOutput, setEnlargedOutput] = useState(null)
  const [modifyNotes, setModifyNotes] = useState('')
  const [modifyStatus, setModifyStatus] = useState('idle') // idle | running | done | error
  const [modifyProgress, setModifyProgress] = useState(0)
  const [modifyProgressLabel, setModifyProgressLabel] = useState('')
  const [modifyOutputs, setModifyOutputs] = useState([])
  const [selectedModifyOutput, setSelectedModifyOutput] = useState(null)
  const [sourceImageUrl, setSourceImageUrl] = useState(null)
  const pollRef = useRef(null)
  const modifyPollRef = useRef(null)

  const setSingle = (key, val) => setFields(f => ({ ...f, [key]: val }))
  const toggleMulti = (key, val) => setFields(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
  }))

  function doRandomise() {
    setFields(prev => ({
      ...prev,
      timeOfDay: 'Daytime',
      housingType: pick(HOUSING_TYPES),
      deskStyle: pick(DESK_STYLES),
      roomSize: pick(ROOM_SIZES),
      wallTreatment: pick(WALL_TREATMENTS),
      lighting: pick(LIGHTING),
      tidiness: pick(TIDINESS),
      tech: pick(TECH),
      personalTouches: pickN(PERSONAL_TOUCHES, Math.floor(Math.random() * 3) + 1),
      additionalNotes: '',
    }))
  }

  function handleRefImage(index, file) {
    const reader = new FileReader()
    reader.onload = e => {
      const newPreviews = [...refPreviews]
      newPreviews[index] = e.target.result
      setRefPreviews(newPreviews)
      const newImages = [...refImages]
      newImages[index] = file
      setRefImages(newImages)
    }
    reader.readAsDataURL(file)
  }

  function removeRefImage(index) {
    const newPreviews = [...refPreviews]
    newPreviews[index] = null
    setRefPreviews(newPreviews)
    const newImages = [...refImages]
    newImages[index] = null
    setRefImages(newImages)
  }

  const withCharacter = true
  const selectedAvatar = library.find(a => a.id === selectedAvatarId)
  const cs = selectedAvatar?.characterSheet
  const isV2Sheet = !!(cs?.fullBodyGrid && cs?.expressions)
  const isV1Sheet = !!(cs?.fullBodyFront && cs?.fullBodySide && cs?.expressions) && !isV2Sheet
  const libraryAvatarReady = isV2Sheet
  const refImagesReady = withCharacter
    ? (charPickerMode === 'library' ? !!libraryAvatarReady : refPreviews.filter(Boolean).length === 3)
    : true
  const prompt = withCharacter ? buildWithCharacterPrompt(fields) : buildEmptyRoomPrompt(fields)

  // ── Generation ──────────────────────────────────────────────────────────────
  async function startGeneration() {
    setGenStatus('running')
    setProgress(0)
    setOutputs([])
    setSelectedOutput(null)
    setProgressLabel('Starting generation run...')
    try {
      if (withCharacter) {
        // Character mode — use character-location-generator technique.
        // Upload any File objects to ImageKit first to get public URLs.
        // Images that are already URLs (from character sheet) are passed through directly.
        setProgressLabel('Uploading reference images...')
        // Use library character sheet URLs if available, otherwise use manual uploads
        // v2 sheet: fullBodyGrid, expressions, base avatar image
        const imageSources = charPickerMode === 'library' && libraryAvatarReady
          ? [cs.fullBodyGrid, cs.expressions, selectedAvatar.avatarUrl]
          : refImages.filter(Boolean)

        const resolvedUrls = await Promise.all(imageSources.map(async (img, i) => {
          if (typeof img === 'string') return img // already a public URL

          // Compress and resize before uploading — 4K images encode to ~25MB base64
          const dataUrl = await compressImage(img)
          console.log(`Image ${i + 1} compressed, size: ${dataUrl.length} bytes`)

          const uploadBody = JSON.stringify({
            imageDataUrl: dataUrl,
            fileName: `ref-${i + 1}-${Date.now()}.png`,
            folder: '/reference-inputs',
          })
          console.log(`Uploading image ${i + 1}, body size: ${uploadBody.length} bytes`)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: uploadBody,
          })
          const rawText = await uploadRes.text()
          let uploadData
          try { uploadData = JSON.parse(rawText) }
          catch(e) { throw new Error(`Upload ${i + 1} failed — server returned: ${rawText.substring(0, 200)}`) }
          if (!uploadRes.ok) throw new Error(uploadData.error || `Upload failed for image ${i + 1}`)
          return uploadData.url
        }))

        setProgressLabel('Starting generation run...')
        const res = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, referenceImages: resolvedUrls }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Generation failed')
        pollRef.current = setInterval(() => pollStatus(data.runId, data.techniqueSlug), 3000)
      }
    } catch (err) {
      setGenStatus('error')
      setProgressLabel('Error: ' + err.message)
    }
  }

  async function pollStatus(id, slugOverride) {
    try {
      const slugParam = slugOverride ? `&techniqueSlug=${slugOverride}` : ''
      const res = await fetch(`/api/poll?runId=${id}${slugParam}`)
      const data = await res.json()
      setProgress(data.progress ?? 0)
      if (data.status === 'running' || data.status === 'pending') {
        setProgressLabel(`Generating... ${data.progress ?? 0}%`)
      }
      if (data.status === 'completed') {
        clearInterval(pollRef.current)
        setGenStatus('done')
        setProgress(100)
        setProgressLabel('Generation complete — select your preferred output')
        setOutputs(data.outputs ?? [])
      }
      if (data.status === 'failed') {
        clearInterval(pollRef.current)
        setGenStatus('error')
        setProgressLabel(`Generation failed: ${data.errorMessage || 'unknown error'}`)
      }
    } catch (err) { console.error('Poll error:', err) }
  }

  async function approveAndSave() {
    if (selectedOutput === null) return
    const output = outputs[selectedOutput]
    const newEnv = {
      url: output?.url,
      name: `WFH Office — ${fields.roomSize}`,
      meta: `${fields.deskStyle} · ${fields.lighting} · ${fields.tidiness}`,
      createdAt: new Date().toISOString(),
    }
    setSavedEnvironments(prev => [...prev, { id: Date.now(), ...newEnv }])

    // Save to avatar's library entry if a character was selected
    if (selectedAvatarId) {
      const existing = library.find(a => a.id === selectedAvatarId)
      if (existing) {
        const updatedEnvironments = [...(existing.environments ?? []), newEnv]
        await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'avatars',
            entry: {
              ...existing,
              characterSheet: existing.characterSheet ?? null,
              environments: updatedEnvironments,
            },
          }),
        })
      }
    }
    setStep(3)
  }

  async function startModify() {
    if (selectedOutput === null || !modifyNotes.trim()) return
    const imageUrl = outputs[selectedOutput]?.url
    if (!imageUrl) return

    setSourceImageUrl(imageUrl)
    setModifyOutputs([])
    setSelectedModifyOutput(null)
    setModifyStatus('running')
    setModifyProgress(5)
    setModifyProgressLabel('Sending to Flora…')
    setStep(4)

    try {
      const res = await fetch('/api/modify-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, notes: modifyNotes.trim() }),
      })
      if (!res.ok) { setModifyStatus('error'); setModifyProgressLabel('Failed to start modification.'); return }
      const { runId } = await res.json()

      setModifyProgress(15)
      setModifyProgressLabel('Modification running…')

      let elapsed = 0
      modifyPollRef.current = setInterval(async () => {
        elapsed += 3
        setModifyProgress(Math.min(15 + (elapsed / 120) * 75, 88))
        const p = await fetch(`/api/poll?runId=${runId}&techniqueSlug=ugc-image-modifier`)
        const pd = await p.json()
        if (pd.status === 'completed') {
          clearInterval(modifyPollRef.current)
          setModifyOutputs(pd.outputs ?? [])
          setModifyProgress(100)
          setModifyProgressLabel('Done — select your preferred result')
          setModifyStatus('done')
        } else if (pd.status === 'failed') {
          clearInterval(modifyPollRef.current)
          setModifyStatus('error')
          setModifyProgressLabel('Modification failed.')
        }
      }, 3000)
    } catch (err) {
      setModifyStatus('error')
      setModifyProgressLabel('Modification failed.')
    }
  }

  async function approveModifiedAndSave() {
    if (selectedModifyOutput === null) return
    const output = modifyOutputs[selectedModifyOutput]
    const newEnv = {
      url: output?.url,
      name: `WFH Office — ${fields.roomSize} (modified)`,
      meta: `${fields.deskStyle} · ${fields.lighting} · ${fields.tidiness}`,
      createdAt: new Date().toISOString(),
    }
    setSavedEnvironments(prev => [...prev, { id: Date.now(), ...newEnv }])

    if (selectedAvatarId) {
      const existing = library.find(a => a.id === selectedAvatarId)
      if (existing) {
        await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'avatars',
            entry: { ...existing, characterSheet: existing.characterSheet ?? null, environments: [...(existing.environments ?? []), newEnv] },
          }),
        })
      }
    }
    setStep(3)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Environment Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A2B4A' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#13B5EA' }} />
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Environment generator</h1>
            </div>
            <p style={{ fontSize: 14, color: '#4A5568', paddingLeft: 20, margin: 0 }}>Place a character into a home office environment</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
              ← Avatars
            </Link>
            <Link href="/character-sheet" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
              Character sheet →
            </Link>
          </div>
        </div>

        <Steps current={step} />

        {/* ── Step 1a: Select character ──────────────────────────────────── */}
        {step === 1 && substep === 'character' && (
          <div>
            <span style={S.sectionLabel}>Character</span>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['library', 'upload'].map(m => (
                <button key={m} onClick={() => setCharPickerMode(m)} style={{
                  padding: '7px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: charPickerMode === m ? 500 : 400,
                  background: charPickerMode === m ? '#1A2B4A' : '#fff',
                  border: charPickerMode === m ? '1px solid #1A2B4A' : '1px solid #E2E8F0',
                  color: charPickerMode === m ? '#fff' : '#4A5568',
                }}>
                  {m === 'library' ? '📚 Choose from library' : '↑ Upload manually'}
                </button>
              ))}
            </div>

            {charPickerMode === 'library' && (
              <div>
                {libraryLoading && <p style={{ fontSize: 13, color: '#4A5568' }}>Loading...</p>}
                {!libraryLoading && library.length === 0 && (
                  <Notice warning>No avatars in library yet. <Link href="/create-avatar" style={{ color: '#13B5EA' }}>Create one first →</Link></Notice>
                )}
                {!libraryLoading && library.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    {library.map(avatar => (
                      <div
                        key={avatar.id}
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        style={{
                          display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px',
                          borderRadius: 8, cursor: 'pointer',
                          border: selectedAvatarId === avatar.id ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                          background: selectedAvatarId === avatar.id ? '#E8F6FD' : '#fff',
                          transition: 'all 0.1s',
                        }}
                      >
                        <div style={{ width: 40, height: 50, borderRadius: 5, overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0, background: '#F7F9FC' }}>
                          {avatar.avatarUrl && <img src={avatar.avatarUrl} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{avatar.name}</div>
                          <div style={{ fontSize: 11, color: '#4A5568' }}>{avatar.meta?.age} · {avatar.meta?.gender} · {avatar.meta?.ethnicity}</div>
                          {!avatar.characterSheet && (
                            <div style={{ fontSize: 11, color: '#E67E22', marginTop: 2 }}>⚠ No character sheet — <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ color: '#13B5EA' }}>generate one first</Link></div>
                          )}
                          {isV1Sheet && avatar.id === selectedAvatarId && (
                            <div style={{ fontSize: 11, color: '#E67E22', marginTop: 2 }}>⚠ Old character sheet — <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ color: '#13B5EA' }}>regenerate to use here</Link></div>
                          )}
                          {avatar.characterSheet?.fullBodyGrid && avatar.characterSheet?.expressions && (
                            <div style={{ fontSize: 11, color: '#27AE60', marginTop: 2 }}>✓ Character sheet ready</div>
                          )}
                        </div>
                        {selectedAvatarId === avatar.id && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {selectedAvatarId && isV1Sheet && (
                  <Notice warning>This avatar has an old character sheet that's no longer compatible. <Link href={`/character-sheet?avatarId=${selectedAvatarId}`} style={{ color: '#13B5EA' }}>Regenerate it →</Link></Notice>
                )}
                {selectedAvatarId && !cs && (
                  <Notice warning>This avatar doesn't have a character sheet yet. <Link href={`/character-sheet?avatarId=${selectedAvatarId}`} style={{ color: '#13B5EA' }}>Generate one →</Link></Notice>
                )}
              </div>
            )}

            {charPickerMode === 'upload' && (
              <div>
                <Notice warning>Upload the three reference images for your character manually.</Notice>
                <div style={{ display: 'flex', gap: 12 }}>
                  <ImageUploadSlot label="Full body — front" sublabel="Standing, facing camera" preview={refPreviews[0]} onFile={f => handleRefImage(0, f)} onRemove={() => removeRefImage(0)} />
                  <ImageUploadSlot label="Full body — side" sublabel="Standing, side-on" preview={refPreviews[1]} onFile={f => handleRefImage(1, f)} onRemove={() => removeRefImage(1)} />
                  <ImageUploadSlot label="Expressions grid" sublabel="Multiple angles / expressions" preview={refPreviews[2]} onFile={f => handleRefImage(2, f)} onRemove={() => removeRefImage(2)} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              {charPickerMode === 'library'
                ? <Btn primary disabled={!selectedAvatarId || !cs || isV1Sheet} onClick={() => setSubstep('configure')}>Next →</Btn>
                : <Btn primary disabled={!refImagesReady} onClick={() => setSubstep('configure')}>Next →</Btn>
              }
            </div>
          </div>
        )}

        {/* ── Step 1b: Configure environment ────────────────────────────── */}
        {step === 1 && substep === 'configure' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#4A5568' }}>WFH Office</div>
              <Btn onClick={doRandomise} style={{ fontSize: 13 }}>⚄ Randomise</Btn>
            </div>

            <span style={S.sectionLabel}>House type</span>
            <ToggleGroup options={HOUSING_TYPES} selected={fields.housingType} onToggle={v => setSingle('housingType', v)} />

            <span style={S.sectionLabel}>Desk style</span>
            <ToggleGroup options={DESK_STYLES} selected={fields.deskStyle} onToggle={v => setSingle('deskStyle', v)} />

            <span style={S.sectionLabel}>Room size</span>
            <ToggleGroup options={ROOM_SIZES} selected={fields.roomSize} onToggle={v => setSingle('roomSize', v)} />

            <span style={S.sectionLabel}>Wall treatment</span>
            <ToggleGroup options={WALL_TREATMENTS} selected={fields.wallTreatment} onToggle={v => setSingle('wallTreatment', v)} />

            <span style={S.sectionLabel}>Desk tidiness</span>
            <ToggleGroup options={TIDINESS} selected={fields.tidiness} onToggle={v => setSingle('tidiness', v)} />

            <span style={S.sectionLabel}>Tech on desk</span>
            <ToggleGroup options={TECH} selected={fields.tech} onToggle={v => setSingle('tech', v)} />

            <span style={S.sectionLabel}>Personal touches <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— select all that apply</span></span>
            <ToggleGroup options={PERSONAL_TOUCHES} selected={fields.personalTouches} multi={true} onToggle={v => toggleMulti('personalTouches', v)} />

            <span style={S.sectionLabel}>Additional notes <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span></span>
            <textarea
              value={fields.additionalNotes}
              onChange={e => setSingle('additionalNotes', e.target.value)}
              placeholder="e.g. there's a guitar in the corner, a large monstera plant, exposed brick wall..."
              style={S.textarea}
            />

            {/* Prompt preview */}
            <div style={{ marginTop: 20, marginBottom: 4 }}>
              <button onClick={() => setPromptOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4A5568', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10 }}>{promptOpen ? '▼' : '▶'}</span>
                View assembled prompt
              </button>
            </div>
            {promptOpen && (
              <pre style={{ background: '#F7F9FC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px 16px', fontSize: 12, lineHeight: 1.7, color: '#4A5568', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 280, overflowY: 'auto', margin: '8px 0 0' }}>{prompt}</pre>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <Btn onClick={() => setSubstep('character')}>← Back</Btn>
              <Btn primary onClick={() => { setStep(2); setGenStatus('idle') }}>Generate →</Btn>
            </div>
          </div>
        )}

        {/* ── Step 2: Generate ──────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            {genStatus === 'idle' && (
              <Notice>
                Ready to generate. Flora will use your 3 reference images to place the character in the environment. This usually takes 60–120 seconds.
              </Notice>
            )}
            {genStatus === 'error' && <Notice error>{progressLabel}</Notice>}

            {genStatus !== 'idle' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#13B5EA', borderRadius: 2, width: `${progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4A5568' }}>
                  <span>{progressLabel}</span><span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[0, 1, 2, 3].map(i => {
                const output = outputs[i]; const isSelected = selectedOutput === i
                return (
                  <div key={i} onClick={() => output && setSelectedOutput(i)} style={{
                    aspectRatio: withCharacter ? '9/16' : '4/3',
                    borderRadius: 8, overflow: 'hidden',
                    border: isSelected ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                    background: '#F7F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: output ? 'pointer' : 'default', position: 'relative',
                    animation: genStatus === 'running' && !output ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}>
                    {output?.url
                      ? <img src={output.url} alt={`Output ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 12, color: '#4A5568' }}>{genStatus === 'running' ? 'Generating...' : `Output ${i + 1}`}</span>
                    }
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    {output?.url && (
                      <div onClick={e => { e.stopPropagation(); setEnlargedOutput(output.url) }} style={{
                        position: 'absolute', bottom: 8, right: 8, width: 28, height: 28,
                        borderRadius: 6, background: 'rgba(0,0,0,0.45)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M8 1h4v4M5 8L12 1M1 5V1h4M5 5L1 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>


            {/* Modify selected image */}
            {genStatus === 'done' && selectedOutput !== null && (
              <div style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F7F9FC', padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 8 }}>Describe your changes</div>
                <textarea
                  value={modifyNotes}
                  onChange={e => setModifyNotes(e.target.value)}
                  placeholder="e.g. Remove the plant from the desk"
                  rows={2}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', background: '#fff' }}
                />
                <button
                  onClick={startModify}
                  disabled={!modifyNotes.trim()}
                  style={{ marginTop: 8, padding: '7px 16px', fontSize: 13, borderRadius: 6, border: '1px solid #13B5EA', background: '#13B5EA', color: '#fff', cursor: !modifyNotes.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !modifyNotes.trim() ? 0.5 : 1 }}
                >
                  ✏️ Modify selected image →
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Btn onClick={() => { setStep(1); setSubstep('configure') }}>← Edit configuration</Btn>
              {genStatus === 'idle' || genStatus === 'error'
                ? <Btn primary onClick={startGeneration}>Start generation</Btn>
                : genStatus === 'done'
                  ? <Btn primary disabled={selectedOutput === null} onClick={approveAndSave}>{selectedOutput === null ? 'Select an output first' : 'Approve & save →'}</Btn>
                  : <Btn primary disabled>Generating...</Btn>
              }
            </div>
          </div>
        )}

        {/* ── Step 4: Modify ───────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {sourceImageUrl && (
                <img src={sourceImageUrl} style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #E2E8F0', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Modifying image</div>
                <div style={{ fontSize: 13, color: '#4A5568', fontStyle: 'italic' }}>"{modifyNotes}"</div>
              </div>
            </div>

            {modifyStatus === 'error' && <Notice error>{modifyProgressLabel}</Notice>}

            {modifyStatus !== 'idle' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#13B5EA', borderRadius: 2, width: `${modifyProgress}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4A5568' }}>
                  <span>{modifyProgressLabel}</span><span>{Math.round(modifyProgress)}%</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[0, 1, 2, 3].map(i => {
                const output = modifyOutputs[i]; const isSelected = selectedModifyOutput === i
                return (
                  <div key={i} onClick={() => output && setSelectedModifyOutput(i)} style={{
                    aspectRatio: '9/16',
                    borderRadius: 8, overflow: 'hidden',
                    border: isSelected ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                    background: '#F7F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: output ? 'pointer' : 'default', position: 'relative',
                    animation: modifyStatus === 'running' && !output ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }}>
                    {output?.url
                      ? <img src={output.url} alt={`Option ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 12, color: '#4A5568' }}>{modifyStatus === 'running' ? 'Generating...' : `Option ${i + 1}`}</span>
                    }
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    {output?.url && (
                      <div onClick={e => { e.stopPropagation(); setEnlargedOutput(output.url) }} style={{
                        position: 'absolute', bottom: 8, right: 8, width: 28, height: 28,
                        borderRadius: 6, background: 'rgba(0,0,0,0.45)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M8 1h4v4M5 8L12 1M1 5V1h4M5 5L1 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Btn onClick={() => { clearInterval(modifyPollRef.current); setStep(2) }}>← Back to results</Btn>
              {modifyStatus === 'done'
                ? <Btn primary disabled={selectedModifyOutput === null} onClick={approveModifiedAndSave}>{selectedModifyOutput === null ? 'Select an output first' : 'Approve & save →'}</Btn>
                : modifyStatus === 'error'
                  ? <Btn primary onClick={startModify}>Retry</Btn>
                  : <Btn primary disabled>Modifying...</Btn>
              }
            </div>
          </div>
        )}

        {/* ── Step 3: Library ───────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <Notice>Environment approved and saved to library.</Notice>
            <span style={S.sectionLabel}>Environment library</span>
            {savedEnvironments.map(env => (
              <div key={env.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', background: '#fff', display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 90, height: 60, borderRadius: 6, background: '#F7F9FC', border: '1px solid #E2E8F0', flexShrink: 0, overflow: 'hidden' }}>
                  {env.url && <img src={env.url} alt={env.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{env.name}</div>
                  <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 8 }}>{env.meta}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#EAF7EF', color: '#27AE60', fontSize: 11, fontWeight: 500 }}>✓ Approved</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn primary onClick={() => { setStep(1); setSubstep('character'); setGenStatus('idle'); setOutputs([]); setSelectedOutput(null) }}>Generate another</Btn>
            </div>
          </div>
        )}
      </div>
      {/* Lightbox — shared across all steps */}
      {enlargedOutput && (
        <div onClick={() => setEnlargedOutput(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
          <img src={enlargedOutput} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box}textarea:focus{outline:2px solid #13B5EA;outline-offset:1px}`}</style>
    </>
  )
}
