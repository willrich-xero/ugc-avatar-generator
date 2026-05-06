import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

                  {/* Character sheet thumbnails */}
                  {avatar.characterSheet && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Character sheet</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { key: 'fullBodyFront', label: 'Front' },
                          { key: 'fullBodySide', label: 'Side' },
                          { key: 'expressions', label: 'Expressions' },
                        ].map(({ key, label }) => (
                          avatar.characterSheet[key] ? (
                            <div
                              key={key}
                              onClick={() => setEnlarged(avatar.characterSheet[key])}
                              style={{ cursor: 'zoom-in' }}
                            >
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
                        {!avatar.characterSheet?.fullBodyFront && (
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                            <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>
                              Generate sheet →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!avatar.characterSheet && (
                    <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>
                      Generate character sheet →
                    </Link>
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
                  {avatar.environments?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Environments</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {avatar.environments.map((env, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Environment thumbnail */}
                            <div
                              onClick={() => env.url && setEnlarged(env.url)}
                              style={{ width: 80, height: 54, borderRadius: 6, overflow: 'hidden', border: '2px solid #E2E8F0', background: '#F7F9FC', cursor: env.url ? 'zoom-in' : 'default' }}
                            >
                              {env.url && <img src={env.url} alt={env.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ fontSize: 10, color: '#9AA5B4', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</div>
                            {/* Shots nested under this environment */}
                            {env.shots?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {env.shots.map((shot, j) => (
                                  <div
                                    key={j}
                                    onClick={() => shot.url && setEnlarged(shot.url)}
                                    style={{ width: 36, height: 48, borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F7F9FC', cursor: shot.url ? 'zoom-in' : 'default' }}
                                  >
                                    {shot.url && <img src={shot.url} alt={shot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                  </div>
                                ))}
                              </div>
                            )}
                            {env.shots?.length > 0 && (
                              <div style={{ fontSize: 10, color: '#9AA5B4' }}>{env.shots.length} shot{env.shots.length !== 1 ? 's' : ''}</div>
                            )}
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
                          <Link href={`/environment?avatarId=${avatar.id}`} style={{ fontSize: 11, color: '#13B5EA', textDecoration: 'none' }}>+ Add environment</Link>
                        </div>
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
