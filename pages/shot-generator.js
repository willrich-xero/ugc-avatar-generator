import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const S = {
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 24, display: 'block' },
}

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
    <div style={{ background: bg, border: `1px solid ${colour}`, borderRadius: 6, padding: '10px 14px', fontSize: 13, color: error ? '#C0392B' : warning ? '#A04000' : '#4A5568', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: colour, marginTop: 4, flexShrink: 0 }} />
      {children}
    </div>
  )
}

function Steps({ current }) {
  const steps = ['Select character', 'Select environment', 'Generate']
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
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: active ? 500 : 400,
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

export default function ShotGenerator() {
  const [step, setStep] = useState(1)
  const [library, setLibrary] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [selectedAvatarId, setSelectedAvatarId] = useState(null)
  const [selectedEnvUrl, setSelectedEnvUrl] = useState(null)
  const [enlarged, setEnlarged] = useState(null)

  const [selectedShots, setSelectedShots] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [genStatus, setGenStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [outputs, setOutputs] = useState([])
  const pollRef = useRef(null)

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(d => { setLibrary(d.avatars ?? []); setLibraryLoading(false) })
      .catch(() => setLibraryLoading(false))
  }, [])

  const selectedAvatar = library.find(a => a.id === selectedAvatarId)
  const hasSheet = selectedAvatar?.characterSheet?.fullBodyFront && selectedAvatar?.characterSheet?.fullBodySide && selectedAvatar?.characterSheet?.expressions
  const hasEnvironments = selectedAvatar?.environments?.length > 0

  function toggleShot(i) {
    setSelectedShots(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  async function saveShots() {
    if (!selectedShots.length || !selectedAvatarId || !selectedEnvUrl) return
    setSaving(true)

    // Fetch fresh data from API to avoid stale state
    const freshLib = await fetch('/api/library').then(r => r.json())
    const existing = (freshLib.avatars ?? []).find(a => a.id === selectedAvatarId)
    if (!existing) { setSaving(false); return }

    const newShots = selectedShots.map(i => ({
      url: outputs[i]?.url,
      label: `Shot ${i + 1}`,
      createdAt: new Date().toISOString(),
    }))

    const updatedEnvironments = (existing.environments ?? []).map(env => {
      if (env.url !== selectedEnvUrl) return env
      return { ...env, shots: [...(env.shots ?? []), ...newShots] }
    })

    await fetch('/api/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'avatars', id: selectedAvatarId }),
    })
    await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'avatars',
        entry: {
          name: existing.name,
          avatarUrl: existing.avatarUrl,
          meta: existing.meta,
          characterSheet: existing.characterSheet ?? null,
          environments: updatedEnvironments,
        },
      }),
    })
    setSaving(false)
    setSaved(true)
  }

  // ── Generation ──────────────────────────────────────────────────────────────
  async function startGeneration() {
    if (!hasSheet || !selectedEnvUrl) return
    setGenStatus('running')
    setProgress(0)
    setOutputs([])
    setSelectedShots([])
    setSaved(false)
    setProgressLabel('Starting angle generation...')

    const images = [
      selectedAvatar.characterSheet.fullBodyFront,
      selectedAvatar.characterSheet.fullBodySide,
      selectedAvatar.characterSheet.expressions,
      selectedEnvUrl,
    ]

    try {
      const res = await fetch('/api/angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
      const rawText = await res.text()
      let data
      try { data = JSON.parse(rawText) }
      catch(e) { throw new Error(`Server returned non-JSON: ${rawText.substring(0, 200)}`) }
      if (!res.ok) throw new Error(data.error || data.details || 'Generation failed')
      pollRef.current = setInterval(() => pollStatus(data.runId, data.techniqueSlug), 3000)
    } catch (err) {
      setGenStatus('error')
      setProgressLabel('Error: ' + err.message)
    }
  }

  async function pollStatus(id, slug) {
    try {
      const slugParam = slug ? `&techniqueSlug=${slug}` : ''
      const res = await fetch(`/api/poll?runId=${id}${slugParam}`)
      const data = await res.json()
      setProgress(data.progress ?? 0)
      if (data.status === 'running' || data.status === 'pending') {
        setProgressLabel(`Generating shots... ${data.progress ?? 0}%`)
      }
      if (data.status === 'completed') {
        clearInterval(pollRef.current)
        setGenStatus('done')
        setProgress(100)
        setProgressLabel('All shots generated')
        setOutputs(data.outputs ?? [])
      }
      if (data.status === 'failed') {
        clearInterval(pollRef.current)
        setGenStatus('error')
        setProgressLabel(`Generation failed: ${data.errorMessage || 'unknown error'}`)
      }
    } catch (err) { console.error('Poll error:', err) }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Shot Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A2B4A' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#13B5EA' }} />
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Shot generator</h1>
            </div>
            <p style={{ fontSize: 14, color: '#4A5568', paddingLeft: 20, margin: 0 }}>Generate multiple angles and shots from a character and environment</p>
          </div>
          <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6, flexShrink: 0 }}>
            ← Home
          </Link>
        </div>

        <Steps current={step} />

        {/* ── Step 1: Select character ───────────────────────────────────── */}
        {step === 1 && (
          <div>
            <span style={S.sectionLabel}>Choose a character</span>
            {libraryLoading && <p style={{ fontSize: 13, color: '#4A5568' }}>Loading library...</p>}
            {!libraryLoading && library.length === 0 && (
              <Notice warning>No avatars in library. <Link href="/create-avatar" style={{ color: '#13B5EA' }}>Create one first →</Link></Notice>
            )}
            {!libraryLoading && library.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {library.map(avatar => {
                  const sheet = avatar.characterSheet
                  const ready = sheet?.fullBodyFront && sheet?.fullBodySide && sheet?.expressions
                  const envCount = avatar.environments?.length ?? 0
                  return (
                    <div
                      key={avatar.id}
                      onClick={() => ready && envCount > 0 && setSelectedAvatarId(avatar.id)}
                      style={{
                        display: 'flex', gap: 14, alignItems: 'center',
                        padding: '12px 16px', borderRadius: 8,
                        cursor: ready && envCount > 0 ? 'pointer' : 'default',
                        border: selectedAvatarId === avatar.id ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                        background: selectedAvatarId === avatar.id ? '#E8F6FD' : ready && envCount > 0 ? '#fff' : '#F7F9FC',
                        opacity: ready && envCount > 0 ? 1 : 0.6,
                        transition: 'all 0.1s',
                      }}
                    >
                      <div style={{ width: 48, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0, background: '#F7F9FC' }}>
                        {avatar.avatarUrl && <img src={avatar.avatarUrl} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{avatar.name}</div>
                        <div style={{ fontSize: 12, color: '#4A5568', marginBottom: 4 }}>{avatar.meta?.age} · {avatar.meta?.gender} · {avatar.meta?.ethnicity}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {ready
                            ? <span style={{ fontSize: 11, color: '#27AE60' }}>✓ Character sheet ready</span>
                            : <span style={{ fontSize: 11, color: '#E67E22' }}>⚠ No character sheet — <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ color: '#13B5EA' }}>generate one</Link></span>
                          }
                          {envCount > 0
                            ? <span style={{ fontSize: 11, color: '#27AE60' }}>✓ {envCount} environment{envCount > 1 ? 's' : ''}</span>
                            : <span style={{ fontSize: 11, color: '#E67E22' }}>⚠ No environments — <Link href={`/environment?avatarId=${avatar.id}`} style={{ color: '#13B5EA' }}>generate one</Link></span>
                          }
                        </div>
                      </div>
                      {selectedAvatarId === avatar.id && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn primary disabled={!selectedAvatarId || !hasSheet || !hasEnvironments} onClick={() => setStep(2)}>
                Next →
              </Btn>
            </div>
          </div>
        )}

        {/* ── Step 2: Select environment ─────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24, padding: '14px 16px', background: '#F7F9FC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ width: 48, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                {selectedAvatar?.avatarUrl && <img src={selectedAvatar.avatarUrl} alt={selectedAvatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedAvatar?.name}</div>
                <div style={{ fontSize: 12, color: '#4A5568' }}>{selectedAvatar?.meta?.age} · {selectedAvatar?.meta?.gender}</div>
              </div>
            </div>

            <span style={S.sectionLabel}>Choose an environment shot</span>
            <p style={{ fontSize: 13, color: '#4A5568', marginBottom: 14 }}>Select the office shot to use as the base for angle generation.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {selectedAvatar?.environments?.map((env, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedEnvUrl(env.url)}
                  style={{
                    cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                    border: selectedEnvUrl === env.url ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                    background: '#F7F9FC', position: 'relative',
                  }}
                >
                  <div style={{ aspectRatio: '16/9' }}>
                    {env.url && <img src={env.url} alt={env.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ padding: '6px 8px', fontSize: 11, color: '#4A5568' }}>{env.name}</div>
                  {selectedEnvUrl === env.url && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <div onClick={e => { e.stopPropagation(); setEnlarged(env.url) }} style={{ position: 'absolute', bottom: 30, right: 6, width: 24, height: 24, borderRadius: 5, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M8 1h4v4M5 8L12 1M1 5V1h4M5 5L1 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Btn onClick={() => setStep(1)}>← Back</Btn>
              <Btn primary disabled={!selectedEnvUrl} onClick={() => { setStep(3); setGenStatus('idle') }}>Generate shots →</Btn>
            </div>
          </div>
        )}

        {/* ── Step 3: Generate ──────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            {genStatus === 'idle' && (
              <Notice>Ready to generate shots from 4 reference images. This may take a few minutes.</Notice>
            )}
            {genStatus === 'error' && <Notice error>{progressLabel}</Notice>}

            {/* Input summary */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Front', url: selectedAvatar?.characterSheet?.fullBodyFront },
                { label: 'Side', url: selectedAvatar?.characterSheet?.fullBodySide },
                { label: 'Expressions', url: selectedAvatar?.characterSheet?.expressions },
                { label: 'Environment', url: selectedEnvUrl },
              ].map(({ label, url }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ width: 60, height: 75, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F7F9FC', marginBottom: 3 }}>
                    {url && <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ fontSize: 10, color: '#9AA5B4' }}>{label}</div>
                </div>
              ))}
            </div>

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

            {/* Output grid */}
            {outputs.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, marginTop: 24 }}>
                  <span style={S.sectionLabel} css={{ margin: 0 }}>Generated shots</span>
                  <span style={{ fontSize: 12, color: '#4A5568' }}>Click shots to select, then save to library</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {outputs.map((output, i) => {
                    const isSelected = selectedShots.includes(i)
                    return (
                      <div
                        key={i}
                        onClick={() => output?.url && toggleShot(i)}
                        style={{
                          borderRadius: 8, overflow: 'hidden', position: 'relative',
                          border: isSelected ? '2px solid #13B5EA' : '1px solid #E2E8F0',
                          background: '#F7F9FC', cursor: output?.url ? 'pointer' : 'default',
                        }}
                      >
                        {output?.url && (
                          <img src={output.url} alt={`Shot ${i + 1}`} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#13B5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                        <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#1A2B4A' }}>Shot {i + 1}</div>
                          {output?.url && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={e => { e.stopPropagation(); setEnlarged(output.url) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#4A5568', padding: 0 }}>⤢</button>
                              <a href={output.url} download={`shot-${i + 1}.jpg`} onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>↓</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {saved ? (
                  <div style={{ padding: '12px 16px', background: '#EAF7EF', borderRadius: 8, border: '1px solid #27AE60', fontSize: 13, color: '#27AE60', fontWeight: 500, marginBottom: 12 }}>
                    ✓ {selectedShots.length} shot{selectedShots.length !== 1 ? 's' : ''} saved to library under {selectedAvatar?.name}'s environment
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <Btn primary disabled={!selectedShots.length || saving} onClick={saveShots}>
                      {saving ? 'Saving...' : `Save ${selectedShots.length || ''} selected shot${selectedShots.length !== 1 ? 's' : ''} to library`}
                    </Btn>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Btn onClick={() => setStep(2)}>← Back</Btn>
              {genStatus === 'idle' || genStatus === 'error'
                ? <Btn primary onClick={startGeneration}>Start generation</Btn>
                : genStatus === 'done'
                  ? <Btn onClick={() => { setStep(1); setGenStatus('idle'); setOutputs([]); setSelectedEnvUrl(null); setSelectedAvatarId(null) }}>Generate another</Btn>
                  : <Btn primary disabled>Generating...</Btn>
              }
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {enlarged && (
        <div onClick={() => setEnlarged(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
          <img src={enlarged} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box}`}</style>
    </>
  )
}
