import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 24, display: 'block' },
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
  const steps = ['Upload avatar', 'Generate', 'Review']
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

// ─── Output label map ─────────────────────────────────────────────────────────
const OUTPUT_LABELS = ['Expressions grid', 'Full body grid']
const OUTPUT_SUBLABELS = ['Multiple angles & expressions', 'Full body poses']

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CharacterSheet() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState(null)
  const [library, setLibrary] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [mode, setMode] = useState('library') // 'library' | 'upload'
  const [savingSheet, setSavingSheet] = useState(false)
  const [sheetSaved, setSheetSaved] = useState(false)

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(d => { setLibrary(d.avatars ?? []); setLibraryLoading(false) })
      .catch(() => setLibraryLoading(false))
    // Pre-select avatar if passed via query param
    if (router.query.avatarId) {
      setSelectedAvatarId(Number(router.query.avatarId))
    }
  }, [router.query.avatarId])

  const [genStatus, setGenStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [outputs, setOutputs] = useState([])
  const [enlargedOutput, setEnlargedOutput] = useState(null)

  const inputRef = useRef(null)
  const pollRef = useRef(null)

  function handleAvatarFile(file) {
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = e => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  // ── Generation ──────────────────────────────────────────────────────────────
  async function startGeneration() {
    const selectedAvatar = library.find(a => a.id === selectedAvatarId)
    if (!avatarFile && !selectedAvatar?.avatarUrl) return
    setGenStatus('running')
    setProgress(0)
    setOutputs([])
    setProgressLabel('Starting character sheet generation...')
    setStep(2)

    try {
      let imageDataUrl
      if (selectedAvatar?.avatarUrl) {
        // Use the Flora URL directly — pass as imageUrl value
        imageDataUrl = selectedAvatar.avatarUrl
      } else {
        // Convert uploaded file to base64
        imageDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsDataURL(avatarFile)
        })
      }

      const res = await fetch('/api/character-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      pollRef.current = setInterval(() => pollStatus(data.runId, data.techniqueSlug), 3000)
    } catch (err) {
      setGenStatus('error')
      setProgressLabel('Error: ' + err.message)
    }
  }

  async function pollStatus(id, slug) {
    try {
      const res = await fetch(`/api/poll?runId=${id}&techniqueSlug=${slug}`)
      const data = await res.json()
      setProgress(data.progress ?? 0)
      if (data.status === 'running' || data.status === 'pending') {
        setProgressLabel(`Generating character sheet... ${data.progress ?? 0}%`)
      }
      if (data.status === 'completed') {
        clearInterval(pollRef.current)
        setGenStatus('done')
        setProgress(100)
        setProgressLabel('Character sheet ready')
        setOutputs(data.outputs ?? [])
        setStep(3)
      }
      if (data.status === 'failed') {
        clearInterval(pollRef.current)
        setGenStatus('error')
        setProgressLabel(`Generation failed: ${data.errorMessage || 'unknown error'}`)
      }
    } catch (err) { console.error('Poll error:', err) }
  }

  async function saveSheetToLibrary() {
    if (!selectedAvatarId || outputs.length < 2) return
    setSavingSheet(true)
    await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'avatars',
        entry: {
          ...library.find(a => a.id === selectedAvatarId),
          characterSheet: {
            expressions: outputs[0]?.url ?? null,
            fullBodyGrid: outputs[1]?.url ?? null,
          },
        },
      }),
    })
    setSavingSheet(false)
    setSheetSaved(true)
  }

  function reset() {
    setStep(1)
    setAvatarFile(null)
    setAvatarPreview(null)
    setGenStatus('idle')
    setProgress(0)
    setOutputs([])
    setProgressLabel('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Character Sheet Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A2B4A' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#13B5EA' }} />
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Character sheet generator</h1>
            </div>
            <p style={{ fontSize: 14, color: '#4A5568', paddingLeft: 20, margin: 0 }}>Generate full body and expression references from a single avatar image</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
              ← Avatars
            </Link>
            <Link href="/environment" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
              Environments →
            </Link>
          </div>
        </div>

        <Steps current={step} />

        {/* ── Step 1: Select avatar ─────────────────────────────────────── */}
        {step === 1 && (
          <div>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['library', 'upload'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '7px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: mode === m ? 500 : 400,
                  background: mode === m ? '#1A2B4A' : '#fff',
                  border: mode === m ? '1px solid #1A2B4A' : '1px solid #E2E8F0',
                  color: mode === m ? '#fff' : '#4A5568',
                }}>
                  {m === 'library' ? '📚 Choose from library' : '↑ Upload image'}
                </button>
              ))}
            </div>

            {/* Library picker */}
            {mode === 'library' && (
              <div>
                {libraryLoading && <p style={{ fontSize: 14, color: '#4A5568' }}>Loading library...</p>}
                {!libraryLoading && library.length === 0 && (
                  <div style={{ padding: '24px', background: '#F7F9FC', borderRadius: 8, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 12 }}>No avatars in library yet.</div>
                    <Link href="/create-avatar" style={{ fontSize: 13, color: '#13B5EA', textDecoration: 'none' }}>Create an avatar first →</Link>
                  </div>
                )}
                {!libraryLoading && library.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {library.map(avatar => (
                      <div
                        key={avatar.id}
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        style={{
                          display: 'flex', gap: 14, alignItems: 'center',
                          padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                          border: selectedAvatarId === avatar.id ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                          background: selectedAvatarId === avatar.id ? '#E8F6FD' : '#fff',
                          transition: 'all 0.1s',
                        }}
                      >
                        <div style={{ width: 48, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0, background: '#F7F9FC' }}>
                          {avatar.avatarUrl && <img src={avatar.avatarUrl} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{avatar.name}</div>
                          <div style={{ fontSize: 12, color: '#4A5568' }}>{avatar.meta?.age} · {avatar.meta?.gender} · {avatar.meta?.ethnicity}</div>
                          <div style={{ fontSize: 12, color: '#4A5568' }}>{avatar.meta?.hair} hair</div>
                        </div>
                        {selectedAvatarId === avatar.id && (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload fallback */}
            {mode === 'upload' && (
              <div>
                {avatarPreview ? (
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 120, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #13B5EA', flexShrink: 0 }}>
                      <img src={avatarPreview} alt="Avatar" style={{ width: '100%', display: 'block' }} />
                    </div>
                    <div style={{ paddingTop: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{avatarFile?.name}</div>
                      <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 16 }}>Ready to generate</div>
                      <Btn onClick={() => { setAvatarFile(null); setAvatarPreview(null) }} style={{ fontSize: 13 }}>Remove</Btn>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => inputRef.current?.click()}
                    style={{
                      border: '1.5px dashed #E2E8F0', borderRadius: 10,
                      padding: '48px 24px', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: '#F7F9FC', gap: 10,
                      marginBottom: 20, transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#13B5EA'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <div style={{ fontSize: 32, color: '#CBD5E0' }}>↑</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1A2B4A' }}>Click to upload avatar</div>
                    <div style={{ fontSize: 13, color: '#4A5568' }}>PNG, JPG or WEBP</div>
                  </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f) }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn
                primary
                disabled={mode === 'library' ? !selectedAvatarId : !avatarFile}
                onClick={startGeneration}
              >
                Generate character sheet →
              </Btn>
            </div>
          </div>
        )}

        {/* ── Step 2: Generating ─────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            {genStatus === 'error'
              ? <Notice error>{progressLabel}</Notice>
              : <Notice>Generating your character sheet. This usually takes 60–120 seconds.</Notice>
            }

            <div style={{ marginBottom: 24 }}>
              <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#13B5EA', borderRadius: 2, width: `${progress}%`, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4A5568' }}>
                <span>{progressLabel}</span><span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Show avatar while waiting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: '#F7F9FC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ width: 56, height: 70, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                {avatarPreview && <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Generating from avatar</div>
                <div style={{ fontSize: 12, color: '#4A5568' }}>Expressions grid · Full body grid</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div style={{ width: 20, height: 20, border: '2px solid #13B5EA', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            </div>

            {genStatus === 'error' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Btn onClick={reset}>← Start again</Btn>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Review outputs ─────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <Notice>Character sheet generated. These 2 images are ready to use as reference inputs in the environment generator.</Notice>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {[0, 1].map(i => {
                const output = outputs[i]
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                      border: '1px solid #E2E8F0', background: '#F7F9FC',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {output?.url
                        ? <img src={output.url} alt={OUTPUT_LABELS[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 12, color: '#4A5568' }}>No output {i + 1}</span>
                      }
                      {output?.url && (
                        <div onClick={() => setEnlargedOutput(output.url)} style={{
                          position: 'absolute', bottom: 8, right: 8, width: 28, height: 28,
                          borderRadius: 6, background: 'rgba(0,0,0,0.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}>
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M8 1h4v4M5 8L12 1M1 5V1h4M5 5L1 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1A2B4A' }}>{OUTPUT_LABELS[i]}</div>
                    <div style={{ fontSize: 11, color: '#4A5568' }}>{OUTPUT_SUBLABELS[i]}</div>
                    {output?.url && (
                      <a href={output.url} download={`character-sheet-${i + 1}.jpg`} style={{
                        fontSize: 12, color: '#13B5EA', textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        ↓ Download
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Save to library */}
            {selectedAvatarId && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#F7F9FC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                {sheetSaved ? (
                  <div style={{ fontSize: 13, color: '#27AE60', fontWeight: 500 }}>✓ Character sheet saved to library</div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#4A5568' }}>Save these images to this character's library entry?</div>
                    <Btn primary onClick={saveSheetToLibrary} disabled={savingSheet} style={{ fontSize: 13 }}>
                      {savingSheet ? 'Saving...' : 'Save to library'}
                    </Btn>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Btn onClick={reset}>Generate another</Btn>
              <Link href="/environment" style={{
                padding: '9px 20px', fontSize: 14, borderRadius: 6, fontWeight: 500,
                background: '#13B5EA', border: '1px solid #13B5EA', color: '#fff',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Use in environment generator →
              </Link>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {enlargedOutput && (
          <div onClick={() => setEnlargedOutput(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
            <img src={enlargedOutput} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
            <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box }
      `}</style>
    </>
  )
}
