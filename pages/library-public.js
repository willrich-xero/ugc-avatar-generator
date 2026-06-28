import Head from 'next/head'
import { useEffect, useState } from 'react'

const APPROVAL_STYLE = {
  approved: { bg: '#EAF7EF', color: '#27AE60', label: '✓ Approved' },
  pending:  { bg: '#FEF6EC', color: '#E67E22', label: '◷ Pending' },
  rejected: { bg: '#FDEDEC', color: '#E74C3C', label: '✕ Rejected' },
}

function Tag({ label, active, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 10px', borderRadius: 99, fontSize: 11,
        background: active ? '#0C7ABF' : '#EEF6FD',
        color: active ? '#fff' : '#0C7ABF',
        border: `1px solid ${active ? '#0C7ABF' : '#BDE3F7'}`,
        fontWeight: 500, cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {label}
    </span>
  )
}

function ApprovalBadge({ status }) {
  const s = APPROVAL_STYLE[status ?? 'pending']
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
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

function csImages(characterSheet) {
  if (!characterSheet) return []
  if (characterSheet.fullBodyGrid != null) {
    // v2 — expressions + fullBodyGrid
    return ['expressions', 'fullBodyGrid'].map(k => characterSheet[k]).filter(Boolean)
  }
  // v1 — fullBodyFront + fullBodySide + expressions
  return ['fullBodyFront', 'fullBodySide', 'expressions'].map(k => characterSheet[k]).filter(Boolean)
}

function AvatarCard({ avatar, onEnlarge }) {
  const [expanded, setExpanded] = useState(false)
  const images = csImages(avatar.characterSheet)

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {/* Collapsed row — always visible */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Avatar thumbnail */}
        <div
          onClick={e => { if (avatar.avatarUrl) { e.stopPropagation(); onEnlarge(avatar.avatarUrl) } }}
          style={{
            width: 44, height: 56, borderRadius: 6, overflow: 'hidden',
            background: '#F7F9FC', border: '1px solid #E2E8F0', flexShrink: 0,
            cursor: avatar.avatarUrl ? 'zoom-in' : 'default',
          }}
        >
          {avatar.avatarUrl && <img src={avatar.avatarUrl} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A202C' }}>{avatar.name}</span>
            <ApprovalBadge status={avatar.approvalStatus} />
          </div>
          <div style={{ fontSize: 12, color: '#718096' }}>
            {[avatar.meta?.age, avatar.meta?.gender, avatar.meta?.ethnicity].filter(Boolean).join(' · ')}
          </div>
          {(avatar.tags ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {(avatar.tags ?? []).map(t => <Tag key={t} label={t} />)}
            </div>
          )}
        </div>

        {/* Chevron */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M4 6l4 4 4-4" stroke="#9AA5B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px 18px', background: '#FAFBFC' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Character sheet
          </div>

          {images.length > 0 ? (
            <div style={{ display: 'flex', gap: 10 }}>
              {images.map((url, i) => (
                <div
                  key={i}
                  onClick={() => onEnlarge(url)}
                  style={{
                    flex: 1, aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                    background: '#F7F9FC', border: '1px solid #E2E8F0', cursor: 'zoom-in',
                  }}
                >
                  <img src={url} alt={`Sheet ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9AA5B4', fontStyle: 'italic' }}>No character sheet yet.</div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
            {avatar.meta?.age && <MetaBadge label="Age" value={avatar.meta.age} />}
            {avatar.meta?.gender && <MetaBadge label="Gender" value={avatar.meta.gender} />}
            {avatar.meta?.ethnicity && <MetaBadge label="Ethnicity" value={avatar.meta.ethnicity} />}
            {avatar.meta?.hair && <MetaBadge label="Hair" value={avatar.meta.hair} />}
          </div>
        </div>
      )}
    </div>
  )
}

function matchesSearch(avatar, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return [
    avatar.name,
    avatar.meta?.age,
    avatar.meta?.gender,
    avatar.meta?.ethnicity,
    avatar.meta?.hair,
    ...(avatar.tags ?? []),
  ].some(v => v?.toLowerCase().includes(q))
}

export default function PublicLibrary() {
  const [avatars, setAvatars] = useState([])
  const [loading, setLoading] = useState(true)
  const [enlarged, setEnlarged] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTags, setFilterTags] = useState([])
  const [filterGender, setFilterGender] = useState('')

  useEffect(() => {
    fetch('/api/library').then(r => r.json()).then(data => {
      setAvatars(data.avatars ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const allTags = [...new Set(avatars.flatMap(a => a.tags ?? []))].sort()
  const allGenders = [...new Set(avatars.map(a => a.meta?.gender).filter(Boolean))].sort()

  const filtered = avatars.filter(a => {
    if (!matchesSearch(a, searchQuery)) return false
    if (filterGender && a.meta?.gender !== filterGender) return false
    if (filterTags.length > 0 && !filterTags.every(t => (a.tags ?? []).includes(t))) return false
    if (filterStatus && (a.approvalStatus ?? 'pending') !== filterStatus) return false
    return true
  })

  function toggleTag(tag) {
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <>
      <Head>
        <title>Xero UGC Avatar Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Xero_software_logo.svg/2560px-Xero_software_logo.svg.png" alt="Xero" style={{ height: 28 }} />
          <span style={{ fontSize: 13, color: '#9AA5B4', borderLeft: '1px solid #E2E8F0', paddingLeft: 12 }}>UGC Avatar Library</span>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>
          {/* Filters */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, age, ethnicity, hair, tag…"
              style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 6, border: '1px solid #E2E8F0', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Status</span>
              {['approved', 'pending', 'rejected'].map(s => {
                const st = APPROVAL_STYLE[s]
                const active = filterStatus === s
                return (
                  <button key={s} onClick={() => setFilterStatus(active ? '' : s)} style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? st.color : st.bg, color: active ? '#fff' : st.color, border: `1px solid ${st.color}`,
                  }}>
                    {st.label}
                  </button>
                )
              })}
            </div>

            {allGenders.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Gender</span>
                {allGenders.map(g => (
                  <button key={g} onClick={() => setFilterGender(filterGender === g ? '' : g)} style={{
                    padding: '3px 10px', fontSize: 12, borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                    background: filterGender === g ? '#13B5EA' : '#EEF6FD',
                    color: filterGender === g ? '#fff' : '#0C7ABF',
                    border: `1px solid ${filterGender === g ? '#13B5EA' : '#BDE3F7'}`,
                  }}>{g}</button>
                ))}
              </div>
            )}

            {allTags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Tags</span>
                {allTags.map(tag => (
                  <Tag key={tag} label={tag} active={filterTags.includes(tag)} onClick={() => toggleTag(tag)} />
                ))}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#9AA5B4', marginBottom: 16 }}>
            {loading ? 'Loading…' : `${filtered.length} avatar${filtered.length !== 1 ? 's' : ''}`}
          </div>

          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(avatar => (
                <AvatarCard key={avatar.id} avatar={avatar} onEnlarge={setEnlarged} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9AA5B4', fontSize: 14 }}>No avatars match your filters.</div>
          )}
        </div>
      </div>

      {enlarged && (
        <div onClick={() => setEnlarged(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
          <img src={enlarged} alt="Enlarged" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', top: 20, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'white' }}>✕</div>
        </div>
      )}

      <style>{`* { box-sizing: border-box } input:focus { outline: 2px solid #13B5EA; outline-offset: 1px }`}</style>
    </>
  )
}
