import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MetaBadge({ label, value }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 10, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#4A5568' }}>{value}</span>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function Tag({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, fontSize: 11,
      background: '#EEF6FD', color: '#0C7ABF', border: '1px solid #BDE3F7',
      fontWeight: 500,
    }}>
      {label}
      {onRemove && (
        <span onClick={onRemove} style={{ cursor: 'pointer', color: '#9AA5B4', lineHeight: 1, fontSize: 13 }}>×</span>
      )}
    </span>
  )
}

const APPROVAL_STATES = ['approved', 'pending', 'rejected']
const APPROVAL_STYLE = {
  approved: { bg: '#EAF7EF', color: '#27AE60', label: '✓ Approved' },
  pending:  { bg: '#FEF6EC', color: '#E67E22', label: '◷ Pending' },
  rejected: { bg: '#FDEDEC', color: '#E74C3C', label: '✕ Rejected' },
}

function ApprovalDropdown({ status, onSelect, isOpen, onToggle }) {
  const s = APPROVAL_STYLE[status] ?? APPROVAL_STYLE.pending
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <span
        onClick={onToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, padding: '2px 7px', borderRadius: 4,
          background: s.bg, color: s.color, fontWeight: 500,
          cursor: 'pointer', userSelect: 'none',
          border: `1px solid ${s.color}22`,
        }}
      >
        {s.label}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ opacity: 0.6 }}>
          <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 7,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 130, overflow: 'hidden',
        }}>
          {APPROVAL_STATES.map(state => {
            const st = APPROVAL_STYLE[state]
            const active = state === status
            return (
              <div
                key={state}
                onClick={() => onSelect(state)}
                style={{
                  padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: active ? st.bg : '#fff',
                  color: active ? st.color : '#1A2B4A',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                {st.label.replace(/^[✓◷✕] /, '')}
                {active && <span style={{ marginLeft: 'auto', fontSize: 11, color: st.color }}>✓</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Library() {
  const [avatars, setAvatars] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [enlarged, setEnlarged] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [openDropdownId, setOpenDropdownId] = useState(null)

  // Filtering
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGender, setFilterGender] = useState(null)
  const [filterTags, setFilterTags] = useState([])
  const [filterStatus, setFilterStatus] = useState(null)

  // Tag editing
  const [editingTagsFor, setEditingTagsFor] = useState(null)
  const [newTagInput, setNewTagInput] = useState('')
  const [savingTagsFor, setSavingTagsFor] = useState(null)

  // Manual environment upload
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

  useEffect(() => {
    if (!openDropdownId) return
    function handleClick() { setOpenDropdownId(null) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openDropdownId])

  // ── Derived ────────────────────────────────────────────────────────────────

  const allTags = [...new Set(avatars.flatMap(a => a.tags ?? []))].sort()
  const allGenders = [...new Set(avatars.map(a => a.meta?.gender).filter(Boolean))].sort()

  const filteredAvatars = avatars.filter(a => {
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterGender && a.meta?.gender !== filterGender) return false
    if (filterTags.length > 0 && !filterTags.every(t => (a.tags ?? []).includes(t))) return false
    if (filterStatus && (a.approvalStatus ?? 'approved') !== filterStatus) return false
    return true
  })

  // ── Actions ────────────────────────────────────────────────────────────────

  function toggleExpanded(id) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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

  async function saveAvatarUpdate(updatedAvatar) {
    await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'avatars', entry: updatedAvatar }),
    })
    await fetch('/api/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'avatars', id: updatedAvatar.id }),
    })
  }

  async function addTag(avatarId, tag) {
    const trimmed = tag.trim()
    if (!trimmed) return
    const avatar = avatars.find(a => a.id === avatarId)
    const existing = avatar.tags ?? []
    if (existing.includes(trimmed)) return
    const updated = { ...avatar, tags: [...existing, trimmed] }
    setSavingTagsFor(avatarId)
    await saveAvatarUpdate(updated)
    setAvatars(prev => prev.map(a => a.id === avatarId ? updated : a))
    setNewTagInput('')
    setSavingTagsFor(null)
  }

  async function removeTag(avatarId, tag) {
    const avatar = avatars.find(a => a.id === avatarId)
    const updated = { ...avatar, tags: (avatar.tags ?? []).filter(t => t !== tag) }
    await saveAvatarUpdate(updated)
    setAvatars(prev => prev.map(a => a.id === avatarId ? updated : a))
  }

  function toggleFilterTag(tag) {
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function setApproval(avatarId, status) {
    setOpenDropdownId(null)
    const avatar = avatars.find(a => a.id === avatarId)
    const updated = { ...avatar, approvalStatus: status }
    await saveAvatarUpdate(updated)
    setAvatars(prev => prev.map(a => a.id === avatarId ? updated : a))
  }

  async function removePtcShot(avatarId, index) {
    const avatar = avatars.find(a => a.id === avatarId)
    const updated = { ...avatar, ptcShots: avatar.ptcShots.filter((_, i) => i !== index) }
    await saveAvatarUpdate(updated)
    setAvatars(prev => prev.map(a => a.id === avatarId ? updated : a))
  }

  async function removeEnvironment(avatarId, index) {
    const avatar = avatars.find(a => a.id === avatarId)
    const updated = { ...avatar, environments: avatar.environments.filter((_, i) => i !== index) }
    await saveAvatarUpdate(updated)
    setAvatars(prev => prev.map(a => a.id === avatarId ? updated : a))
  }

  // ── Environment upload ─────────────────────────────────────────────────────

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
    if (!envName) setEnvName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    const reader = new FileReader()
    reader.onload = e => setEnvPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function saveEnvUpload(avatarId) {
    if (!envFile || !envName.trim()) return
    setEnvSaving(true)
    try {
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

      const avatar = avatars.find(a => a.id === avatarId)
      const updatedEnvironments = [...(avatar.environments ?? []), { name: envName.trim(), url: uploadData.url, shots: [] }]
      const updated = { ...avatar, environments: updatedEnvironments }
      await saveAvatarUpdate(updated)
      setAvatars(prev => prev.map(a => a.id === avatarId ? updated : a))
      cancelEnvUpload()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setEnvSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>Avatar Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A2B4A' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#13B5EA' }} />
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#1A2B4A' }}>Avatar library</h1>
            {!loading && <span style={{ fontSize: 13, color: '#9AA5B4' }}>{filteredAvatars.length} of {avatars.length}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
              ← Home
            </Link>
            <Link href="/create-avatar" style={{ fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 6, background: '#13B5EA', border: '1px solid #13B5EA', color: '#fff', textDecoration: 'none' }}>
              + New avatar
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        {!loading && avatars.length > 0 && (
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Search + gender */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '7px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #E2E8F0', outline: 'none' }}
              />
              {allGenders.map(g => (
                <button key={g} onClick={() => setFilterGender(filterGender === g ? null : g)} style={{
                  padding: '7px 14px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  background: filterGender === g ? '#1A2B4A' : '#fff',
                  border: filterGender === g ? '1px solid #1A2B4A' : '1px solid #E2E8F0',
                  color: filterGender === g ? '#fff' : '#4A5568',
                }}>{g}</button>
              ))}
              {APPROVAL_STATES.map(s => {
                const st = APPROVAL_STYLE[s]
                const active = filterStatus === s
                return (
                  <button key={s} onClick={() => setFilterStatus(active ? null : s)} style={{
                    padding: '7px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                    background: active ? st.bg : '#fff',
                    border: active ? `1px solid ${st.color}` : '1px solid #E2E8F0',
                    color: active ? st.color : '#4A5568',
                  }}>{st.label}</button>
                )
              })}
              {(searchQuery || filterGender || filterTags.length > 0 || filterStatus) && (
                <button onClick={() => { setSearchQuery(''); setFilterGender(null); setFilterTags([]); setFilterStatus(null) }} style={{
                  padding: '7px 12px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  background: '#fff', border: '1px solid #E2E8F0', color: '#9AA5B4',
                }}>Clear</button>
              )}
            </div>

            {/* Tag filter chips */}
            {allTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9AA5B4', marginRight: 2 }}>Tags:</span>
                {allTags.map(tag => (
                  <button key={tag} onClick={() => toggleFilterTag(tag)} style={{
                    padding: '3px 10px', fontSize: 12, borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                    background: filterTags.includes(tag) ? '#0C7ABF' : '#EEF6FD',
                    border: filterTags.includes(tag) ? '1px solid #0C7ABF' : '1px solid #BDE3F7',
                    color: filterTags.includes(tag) ? '#fff' : '#0C7ABF',
                    fontWeight: 500,
                  }}>{tag}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && <p style={{ color: '#4A5568', fontSize: 14 }}>Loading library...</p>}

        {!loading && avatars.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: '1.5px dashed #E2E8F0', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No avatars yet</div>
            <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 20 }}>Create your first avatar to get started.</div>
            <Link href="/create-avatar" style={{ padding: '9px 20px', fontSize: 14, borderRadius: 6, fontWeight: 500, background: '#13B5EA', border: '1px solid #13B5EA', color: '#fff', textDecoration: 'none', display: 'inline-block' }}>
              Create avatar →
            </Link>
          </div>
        )}

        {!loading && filteredAvatars.length === 0 && avatars.length > 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px', border: '1.5px dashed #E2E8F0', borderRadius: 12, color: '#9AA5B4', fontSize: 14 }}>
            No avatars match your filters.
          </div>
        )}

        {/* Avatar list */}
        {!loading && filteredAvatars.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAvatars.map(avatar => {
              const isExpanded = expandedIds.has(avatar.id)
              return (
                <div key={avatar.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>

                  {/* ── Collapsed row (always visible) ── */}
                  <div
                    onClick={() => toggleExpanded(avatar.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: 40, height: 50, borderRadius: 6, overflow: 'hidden', background: '#F7F9FC', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                      {avatar.avatarUrl && <img src={avatar.avatarUrl} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>

                    {/* Name + approved badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{avatar.name}</span>
                        <ApprovalDropdown
                          status={avatar.approvalStatus ?? 'pending'}
                          isOpen={openDropdownId === avatar.id}
                          onToggle={() => setOpenDropdownId(openDropdownId === avatar.id ? null : avatar.id)}
                          onSelect={status => setApproval(avatar.id, status)}
                        />
                        {/* Tags inline */}
                        {(avatar.tags ?? []).map(t => <Tag key={t} label={t} />)}
                      </div>
                      <div style={{ fontSize: 12, color: '#9AA5B4', marginTop: 2 }}>
                        {[avatar.meta?.age, avatar.meta?.gender, avatar.meta?.ethnicity].filter(Boolean).join(' · ')}
                      </div>
                    </div>

                    {/* Summary counts */}
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0, fontSize: 11, color: '#9AA5B4' }}>
                      {avatar.characterSheet && <span>📋 Sheet</span>}
                      {avatar.environments?.length > 0 && <span>🏠 {avatar.environments.length} env</span>}
                      {avatar.ptcShots?.length > 0 && <span>🎬 {avatar.ptcShots.length} PTC</span>}
                    </div>

                    {/* Chevron */}
                    <div style={{ flexShrink: 0, color: '#CBD5E0', fontSize: 14, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
                  </div>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #F0F4F8', padding: '16px 20px 20px' }}>

                      {/* Meta grid */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                        {avatar.meta?.age && <MetaBadge label="Age" value={avatar.meta.age} />}
                        {avatar.meta?.gender && <MetaBadge label="Gender" value={avatar.meta.gender} />}
                        {avatar.meta?.ethnicity && <MetaBadge label="Ethnicity" value={avatar.meta.ethnicity} />}
                        {avatar.meta?.hair && <MetaBadge label="Hair" value={avatar.meta.hair} />}
                        {avatar.meta?.clothing && <MetaBadge label="Clothing" value={avatar.meta.clothing} />}
                        <MetaBadge label="Created" value={new Date(avatar.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
                      </div>

                      {/* Tags */}
                      <div style={{ marginBottom: 16 }}>
                        <SectionLabel>Tags</SectionLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {(avatar.tags ?? []).map(tag => (
                            <Tag key={tag} label={tag} onRemove={() => removeTag(avatar.id, tag)} />
                          ))}
                          {editingTagsFor === avatar.id ? (
                            <form onSubmit={e => { e.preventDefault(); addTag(avatar.id, newTagInput).then(() => setEditingTagsFor(null)) }} style={{ display: 'flex', gap: 4 }}>
                              <input
                                autoFocus
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                placeholder="Tag name"
                                style={{ padding: '2px 8px', fontSize: 12, borderRadius: 99, border: '1px solid #BDE3F7', outline: 'none', width: 100 }}
                              />
                              <button type="submit" disabled={savingTagsFor === avatar.id} style={{ padding: '2px 10px', fontSize: 12, borderRadius: 99, background: '#13B5EA', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                {savingTagsFor === avatar.id ? '…' : 'Add'}
                              </button>
                              <button type="button" onClick={() => { setEditingTagsFor(null); setNewTagInput('') }} style={{ padding: '2px 8px', fontSize: 12, borderRadius: 99, background: '#fff', color: '#9AA5B4', border: '1px solid #E2E8F0', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <button onClick={() => { setEditingTagsFor(avatar.id); setNewTagInput('') }} style={{ padding: '2px 8px', fontSize: 12, borderRadius: 99, background: '#fff', color: '#9AA5B4', border: '1px solid #E2E8F0', cursor: 'pointer', fontFamily: 'inherit' }}>
                              + Add tag
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Character sheet */}
                      {avatar.characterSheet && (
                        <div style={{ marginBottom: 16 }}>
                          <SectionLabel>Character sheet</SectionLabel>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(avatar.characterSheet.fullBodyGrid != null
                              ? [{ key: 'expressions', label: 'Expressions' }, { key: 'fullBodyGrid', label: 'Full body' }]
                              : [{ key: 'fullBodyFront', label: 'Front' }, { key: 'fullBodySide', label: 'Side' }, { key: 'expressions', label: 'Expressions' }]
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
                              <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>Regenerate →</Link>
                            </div>
                          </div>
                        </div>
                      )}
                      {!avatar.characterSheet && (
                        <div style={{ marginBottom: 16 }}>
                          <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>Generate character sheet →</Link>
                        </div>
                      )}

                      {/* PTC Shots */}
                      {avatar.ptcShots?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <SectionLabel>PTC shots</SectionLabel>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                            {avatar.ptcShots.map((shot, j) => (
                              <div key={j} className="deletable-thumb" style={{ position: 'relative', width: 36, height: 48, borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F7F9FC', flexShrink: 0 }}>
                                {shot.url && <img onClick={() => setEnlarged(shot.url)} src={shot.url} alt={shot.label} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} />}
                                <div className="thumb-delete" onClick={() => removePtcShot(avatar.id, j)} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, color: '#fff', lineHeight: 1 }}>×</div>
                              </div>
                            ))}
                          </div>
                          <Link href="/ptc-generator" style={{ fontSize: 11, color: '#13B5EA', textDecoration: 'none' }}>+ Generate more</Link>
                        </div>
                      )}

                      {/* Environments */}
                      {(avatar.environments?.length > 0 || uploadingEnvFor === avatar.id) ? (
                        <div style={{ marginBottom: 16 }}>
                          <SectionLabel>Environments</SectionLabel>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            {(avatar.environments ?? []).map((env, i) => (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div className="deletable-thumb" style={{ position: 'relative', width: 80, height: 54, borderRadius: 6, overflow: 'hidden', border: '2px solid #E2E8F0', background: '#F7F9FC' }}>
                                  {env.url && <img onClick={() => setEnlarged(env.url)} src={env.url} alt={env.name} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }} />}
                                  <div className="thumb-delete" onClick={() => removeEnvironment(avatar.id, i)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: '#fff', lineHeight: 1 }}>×</div>
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
                                  </div>
                                )}
                              </div>
                            ))}

                            {uploadingEnvFor === avatar.id ? (
                              <EnvUploadPanel
                                envPreview={envPreview}
                                envName={envName}
                                envSaving={envSaving}
                                onFileClick={() => envInputRef.current?.click()}
                                onRemoveFile={() => { setEnvFile(null); setEnvPreview(null) }}
                                onNameChange={e => setEnvName(e.target.value)}
                                onSave={() => saveEnvUpload(avatar.id)}
                                onCancel={cancelEnvUpload}
                                canSave={!!envFile && !!envName.trim()}
                              />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
                                <Link href={`/environment?avatarId=${avatar.id}`} style={{ fontSize: 11, color: '#13B5EA', textDecoration: 'none' }}>+ Generate environment</Link>
                                <button onClick={() => openEnvUpload(avatar.id)} style={{ fontSize: 11, color: '#13B5EA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}>
                                  + Upload manually
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: 16 }}>
                          {uploadingEnvFor === avatar.id ? (
                            <>
                              <SectionLabel>Environments</SectionLabel>
                              <EnvUploadPanel
                                envPreview={envPreview}
                                envName={envName}
                                envSaving={envSaving}
                                onFileClick={() => envInputRef.current?.click()}
                                onRemoveFile={() => { setEnvFile(null); setEnvPreview(null) }}
                                onNameChange={e => setEnvName(e.target.value)}
                                onSave={() => saveEnvUpload(avatar.id)}
                                onCancel={cancelEnvUpload}
                                canSave={!!envFile && !!envName.trim()}
                              />
                            </>
                          ) : (
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <Link href={`/environment?avatarId=${avatar.id}`} style={{ fontSize: 12, color: '#13B5EA', textDecoration: 'none' }}>+ Generate environment</Link>
                              <span style={{ fontSize: 12, color: '#CBD5E0' }}>·</span>
                              <button onClick={() => openEnvUpload(avatar.id)} style={{ fontSize: 12, color: '#13B5EA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                                + Upload environment manually
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions row */}
                      <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #F0F4F8', marginTop: 4 }}>
                        <Link href={`/environment?avatarId=${avatar.id}`} style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, background: '#13B5EA', color: '#fff', textDecoration: 'none', border: '1px solid #13B5EA' }}>
                          Use in environment
                        </Link>
                        <Link href={`/character-sheet?avatarId=${avatar.id}`} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 6, background: '#fff', color: '#1A2B4A', textDecoration: 'none', border: '1px solid #E2E8F0' }}>
                          Character sheet
                        </Link>
                        <div style={{ flex: 1 }} />
                        <button onClick={() => deleteAvatar(avatar.id)} disabled={deleting === avatar.id} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#E74C3C', border: '1px solid #E2E8F0', fontFamily: 'inherit', opacity: deleting === avatar.id ? 0.5 : 1 }}>
                          {deleting === avatar.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Global hidden file input */}
      <input ref={envInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleEnvFile(f); e.target.value = '' }} />

      {/* Lightbox */}
      {enlarged && (
        <div onClick={() => setEnlarged(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
          <img src={enlarged} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box }
        .deletable-thumb:hover .thumb-delete { display: flex !important }
      `}</style>
    </>
  )
}

// ─── Env upload panel (shared between with/without existing envs) ─────────────
function EnvUploadPanel({ envPreview, envName, envSaving, onFileClick, onRemoveFile, onNameChange, onSave, onCancel, canSave }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, background: '#F7F9FC', minWidth: 220, maxWidth: 260 }}>
      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#1A2B4A' }}>Upload environment image</div>
      {envPreview ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
          <img src={envPreview} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #E2E8F0', flexShrink: 0 }} />
          <button onClick={onRemoveFile} style={{ fontSize: 11, color: '#9AA5B4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Remove</button>
        </div>
      ) : (
        <div onClick={onFileClick} style={{ border: '1.5px dashed #E2E8F0', borderRadius: 6, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', marginBottom: 8, background: '#fff' }}>
          <div style={{ fontSize: 20, color: '#CBD5E0', marginBottom: 4 }}>↑</div>
          <div style={{ fontSize: 12, color: '#4A5568' }}>Click to choose image</div>
        </div>
      )}
      <input type="text" placeholder="Environment name" value={envName} onChange={onNameChange}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 5, border: '1px solid #E2E8F0', marginBottom: 8, outline: 'none' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSave} disabled={!canSave || envSaving}
          style={{ flex: 1, padding: '6px 0', fontSize: 12, borderRadius: 5, cursor: (!canSave || envSaving) ? 'not-allowed' : 'pointer', background: '#13B5EA', color: '#fff', border: '1px solid #13B5EA', fontFamily: 'inherit', opacity: !canSave ? 0.4 : 1 }}>
          {envSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 5, cursor: 'pointer', background: '#fff', color: '#4A5568', border: '1px solid #E2E8F0', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
