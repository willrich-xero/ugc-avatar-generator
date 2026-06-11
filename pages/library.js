import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function NavBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#13B5EA' }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#1A2B4A' }}>Avatar library</h1>
      </div>
      <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
        ← Home
      </Link>
    </div>
  )
}

function MetaBadge({ label, value }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 10, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#4A5568' }}>{value}</span>
    </div>
  )
}

export default function Library() {
  const [avatars, setAvatars] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [enlarged, setEnlarged] = useState(null)

  // Manual environment upload state: avatarId being uploaded, or null
  const [uploadingEnvFor, setUploadingEnvFor] = useState(null)
  const [envFile, setEnvFile] = useState(null)
  const [envPreview, setEnvPreview] = useState(null)
  const [envName, setEnvName] = useState('')
  const [envSaving, setEnvSaving] = useState(false)
  const envInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(d => { setAvatars(d.avatars ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function deleteAvatar(id) {
    if (!confirm('Remove this avatar from the library?')) return
    setDeleting(id)
    await fetch('/api/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'avatars', id }),
    })
    setAvatars(prev => prev.filter(a => a.id !== id))
    setDeleting(null)
  }

  function openEnvUpload(avatarId) {
    setUploadingEnvFor(avatarId)
    setEnvFile(null)
    setEnvPreview(null)
    setEnvName('')
  }

  function cancelEnvUpload() {
    setUploadingEnvFor(null)
    setEnvFile(null)
    setEnvPreview(null)
    setEnvName('')
  }

  function handleEnvFile(file) {
    setEnvFile(file)
    // Auto-fill name from filename (strip extension)
    if (!envName) setEnvName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const reader = new FileReader()
    reader.onload = e => setEnvPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function saveEnvUpload(avatarId) {
    if (!envFile || !envName.trim()) return
    setEnvSaving(true)
    try {
      // 1. Upload to ImageKit
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(envFile)
      })
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl, fileName: `env-${Date.now()}.jpg`, folder: '/environments' }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')

      // 2. Append to avatar's environments in library
      const avatar = avatars.find(a => a.id === avatarId)
      const updatedEnvironments = [
        ...(avatar.environments ?? []),
        { name: envName.trim(), url: uploadData.url, shots: [] },
      ]
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'avatars', entry: { ...avatar, environments: updatedEnvironments } }),
      })
      // Delete old entry (library uses unshift pattern)
      await fetch('/api/library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'avatars', id: avatarId }),
      })

      // 3. Update local state
      setAvatars(prev => prev.map(a => a.id === avatarId ? { ...a, environments: updatedEnvironments } : a))
      cancelEnvUpload()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setEnvSaving(false)
    }
  }

  return (
    <>
      <Head>
        <title>Avatar Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A2B4A' }}>
        <NavBar />

        {loading && <p style={{ color: '#4A5568', fontSize: 14 }}>Loading library...</p>}

        {!loading && avatars.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: '1.5px dashed #E2E8F0', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No avatars yet</div>
            <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 20 }}>Create your first avatar to get started.</div>
            <Link href="/create-avatar" style={{
              padding: '9px 20px', fontSize: 14, borderRadius: 6, fontWeight: 500,
              background: '#13B5EA', border: '1px solid #13B5EA', color: '#fff',
              textDecoration: 'none', display: 'inline-block',
            }}>
              Create avatar →
            </Link>
          </div>
        )}

        {!loading && avatars.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {avatars.map(avatar => (
              <div key={avatar.id} style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '20px', display: 'flex', gap: 20, alignItems: 'flex-start',
              }}>
                {/* Avatar image */}
                <div
                  onClick={() => avatar.avatarUrl && setEnlarged(avatar.avatarUrl)}
                  style={{
                    width: 72, height: 90, borderRadius: 8, overflow: 'hidden',
                    background: '#F7F9FC', border: '1px solid #E2E8F0',
                    flexShrink: 0, cursor: avatar.avatarUrl ? 'zoom-in' : 'default',
                  }}>
                  {avatar.avatarUrl && <img src={avatar.avatarUrl} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{avatar.name}</div>
                    <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#EAF7EF', color: '#27AE60', fontWeight: 500 }}>✓ Approved</div>
                  </div>

                  {/* Meta grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
                    {avatar.meta?.age && <MetaBadge label="Age" value={avatar.meta.age} />}
                    {avatar.meta?.gender && <MetaBadge label="Gender" value={avatar.meta.gender} />}
                    {avatar.meta?.ethnicity && <MetaBadge label="Ethnicity" value={avatar.meta.ethnicity} />}
                    {avatar.meta?.hair && <MetaBadge label="Hair" value={avatar.meta.hair} />}
                    {avatar.meta?.clothing && <MetaBadge label="Clothing" value={avatar.meta.clothing} />}
                    <MetaBadge label="Created" value={new Date(avatar.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
                  </div>

                  {/* Character sheet thumbnails — adaptive: v2 uses expressions+fullBodyGrid, v1 uses fullBodyFront+fullBodySide+expressions */}
                  {avatar.characterSheet && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Character sheet</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(avatar.characterSheet.fullBodyGrid != null
                          // v2 schema: expressions grid (output 1) + full body grid (output 2)
                          ? [
                              { key: 'expressions', label: 'Expressions' },
                              { key: 'fullBodyGrid', label: 'Full body' },
                            ]
                          // v1 schema: front + side + expressions
                          : [
                              { key: 'fullBodyFront', label: 'Front' },
                              { key: 'fullBodySide', label: 'Side' },
                              { key: 'expressions', label: 'Expressions' },
                            ]
                        ).map(({ key, label }) => (
                          avatar.characterSheet[key] ? (
                            <div key={key} onClick={() => setEnlarged(avatar.characterSheet[key])} style={{ cursor: 'zoom-in' }}>
                              <div style={{ width: 48, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F7F9FC', marginBottom: 3 }}>
                                <img src={avatar.characterSheet[key]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div style={{ fontSize: 10, color: '#9AA5B4', textAlign: 'center' }}>{label}</div>
                            </div>
                          ) : (
                            <div key={key}>
                              <div style={{ width: 48, height: 60, borderRadius: 6, border: '1.5px dashed #E2E8F0', background: '#F7F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: '#CBD5E0' }}>—</span>
                              </div>
                              <div style={{ fontSize: 10, color: '#9AA5B4', textAlign: 'center' }}>{label}</div>
                            </div>
                          )
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                          <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>
                            Regenerate →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {!avatar.characterSheet && (
                    <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>
                      Generate character sheet →
                    </Link>
                  )}

                  {/* No environments yet */}
                  {!avatar.environments?.length && uploadingEnvFor !== avatar.id && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Link href={`/environment?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>
                        + Generate environment
                      </Link>
                      <span style={{ fontSize: 12, color: '#CBD5E0' }}>·</span>
                      <button onClick={() => openEnvUpload(avatar.id)}
                        style={{ fontSize: 12, color: '#13B5EA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        + Upload environment manually
                      </button>
                    </div>
                  )}
                  {!avatar.environments?.length && uploadingEnvFor === avatar.id && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Environments</div>
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, background: '#F7F9FC', maxWidth: 280 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1A2B4A' }}>Upload environment image</div>
                        {envPreview ? (
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                            <img src={envPreview} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #E2E8F0', flexShrink: 0 }} />
                            <button onClick={() => { setEnvFile(null); setEnvPreview(null) }}
                              style={{ fontSize: 11, color: '#9AA5B4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Remove</button>
                          </div>
                        ) : (
                          <div onClick={() => envInputRef.current?.click()}
                            style={{ border: '1.5px dashed #E2E8F0', borderRadius: 6, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', marginBottom: 8, background: '#fff' }}>
                            <div style={{ fontSize: 20, color: '#CBD5E0', marginBottom: 4 }}>↑</div>
                            <div style={{ fontSize: 12, color: '#4A5568' }}>Click to choose image</div>
                          </div>
                        )}
                        <input type="text" placeholder="Environment name" value={envName} onChange={e => setEnvName(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 5, border: '1px solid #E2E8F0', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => saveEnvUpload(avatar.id)} disabled={!envFile || !envName.trim() || envSaving}
                            style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: 5, cursor: (!envFile || !envName.trim() || envSaving) ? 'not-allowed' : 'pointer', background: '#13B5EA', color: '#fff', border: '1px solid #13B5EA', fontFamily: 'inherit', opacity: (!envFile || !envName.trim()) ? 0.4 : 1 }}>
                            {envSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={cancelEnvUpload}
                            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 5, cursor: 'pointer', background: '#fff', color: '#4A5568', border: '1px solid #E2E8F0', fontFamily: 'inherit' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PTC Shots */}
                  {avatar.ptcShots?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>PTC shots</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {avatar.ptcShots.map((shot, j) => (
                          <div
                            key={j}
                            onClick={() => shot.url && setEnlarged(shot.url)}
                            style={{ width: 36, height: 48, borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F7F9FC', cursor: shot.url ? 'zoom-in' : 'default' }}
                          >
                            {shot.url && <img src={shot.url} alt={shot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                        ))}
                      </div>
                      <Link href={`/ptc-generator`} style={{ fontSize: 11, color: '#13B5EA', textDecoration: 'none' }}>+ Generate more</Link>
                    </div>
                  )}

                  {/* Environments */}
                  {(avatar.environments?.length > 0 || uploadingEnvFor === avatar.id) && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Environments</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {(avatar.environments ?? []).map((env, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div
                              onClick={() => env.url && setEnlarged(env.url)}
                              style={{ width: 80, height: 54, borderRadius: 6, overflow: 'hidden', border: '2px solid #E2E8F0', background: '#F7F9FC', cursor: env.url ? 'zoom-in' : 'default' }}
                            >
                              {env.url && <img src={env.url} alt={env.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ fontSize: 10, color: '#9AA5B4', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</div>
                            {env.shots?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {env.shots.map((shot, j) => (
                                  <div key={j} onClick={() => shot.url && setEnlarged(shot.url)}
                                    style={{ width: 36, height: 48, borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F7F9FC', cursor: shot.url ? 'zoom-in' : 'default' }}>
                                    {shot.url && <img src={shot.url} alt={shot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                  </div>
                                ))}
                                <div style={{ fontSize: 10, color: '#9AA5B4' }}>{env.shots.length} shot{env.shots.length !== 1 ? 's' : ''}</div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Inline upload panel */}
                        {uploadingEnvFor === avatar.id ? (
                          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, background: '#F7F9FC', minWidth: 220, maxWidth: 280 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1A2B4A' }}>Upload environment image</div>
                            {envPreview ? (
                              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                                <img src={envPreview} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #E2E8F0', flexShrink: 0 }} />
                                <button onClick={() => { setEnvFile(null); setEnvPreview(null) }}
                                  style={{ fontSize: 11, color: '#9AA5B4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Remove</button>
                              </div>
                            ) : (
                              <div onClick={() => envInputRef.current?.click()}
                                style={{ border: '1.5px dashed #E2E8F0', borderRadius: 6, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', marginBottom: 8, background: '#fff' }}>
                                <div style={{ fontSize: 20, color: '#CBD5E0', marginBottom: 4 }}>↑</div>
                                <div style={{ fontSize: 12, color: '#4A5568' }}>Click to choose image</div>
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="Environment name"
                              value={envName}
                              onChange={e => setEnvName(e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 5, border: '1px solid #E2E8F0', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => saveEnvUpload(avatar.id)}
                                disabled={!envFile || !envName.trim() || envSaving}
                                style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: 5, cursor: (!envFile || !envName.trim() || envSaving) ? 'not-allowed' : 'pointer', background: '#13B5EA', color: '#fff', border: '1px solid #13B5EA', fontFamily: 'inherit', opacity: (!envFile || !envName.trim()) ? 0.4 : 1 }}>
                                {envSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button onClick={cancelEnvUpload}
                                style={{ padding: '6px 10px', fontSize: 12, borderRadius: 5, cursor: 'pointer', background: '#fff', color: '#4A5568', border: '1px solid #E2E8F0', fontFamily: 'inherit' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
                            <Link href={`/environment?avatarId=${avatar.id}`} style={{ fontSize: 11, color: '#13B5EA', textDecoration: 'none' }}>+ Generate environment</Link>
                            <button onClick={() => openEnvUpload(avatar.id)}
                              style={{ fontSize: 11, color: '#13B5EA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}>
                              + Upload manually
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <Link href={`/environment?avatarId=${avatar.id}`} style={{
                    fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 6,
                    background: '#13B5EA', color: '#fff', textDecoration: 'none',
                    border: '1px solid #13B5EA', textAlign: 'center',
                  }}>
                    Use in environment
                  </Link>
                  <button
                    onClick={() => deleteAvatar(avatar.id)}
                    disabled={deleting === avatar.id}
                    style={{
                      fontSize: 12, padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                      background: '#fff', color: '#E74C3C', border: '1px solid #E2E8F0',
                      fontFamily: 'inherit', opacity: deleting === avatar.id ? 0.5 : 1,
                    }}>
                    {deleting === avatar.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/create-avatar" style={{
            padding: '9px 20px', fontSize: 14, borderRadius: 6, fontWeight: 500,
            background: '#13B5EA', border: '1px solid #13B5EA', color: '#fff',
            textDecoration: 'none', display: 'inline-block',
          }}>
            + Create new avatar
          </Link>
        </div>
      </div>

      {/* Global hidden file input for environment uploads */}
      <input ref={envInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleEnvFile(f); e.target.value = '' }} />

      {/* Lightbox */}
      {enlarged && (
        <div onClick={() => setEnlarged(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
          <img src={enlarged} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
        </div>
      )}

      <style>{`* { box-sizing: border-box }`}</style>
    </>
  )
}
