import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [counts, setCounts] = useState({ avatars: 0, environments: 0 })

  useEffect(() => {
    fetch('/api/library')
      .then(r => r.json())
      .then(d => setCounts({ avatars: d.avatars?.length ?? 0, environments: d.environments?.length ?? 0 }))
      .catch(() => {})
  }, [])

  const cards = [
    {
      href: '/create-avatar',
      icon: '👤',
      title: 'Create avatar',
      desc: 'Generate a new AI character from a simple brief.',
      action: 'Create',
      color: '#13B5EA',
    },
    {
      href: '/library',
      icon: '📚',
      title: 'Avatar library',
      desc: `${counts.avatars} avatar${counts.avatars !== 1 ? 's' : ''} saved. Browse, manage and select characters.`,
      action: 'View library',
      color: '#1D5FA6',
    },
    {
      href: '/character-sheet',
      icon: '🗂️',
      title: 'Character sheet',
      desc: 'Generate full body and expression references from an avatar.',
      action: 'Generate',
      color: '#8E44AD',
    },
    {
      href: '/environment',
      icon: '🏠',
      title: 'Environment generator',
      desc: 'Place a character into a home office environment.',
      action: 'Generate',
      color: '#27AE60',
    },
    {
      href: '/shot-generator',
      icon: '🎬',
      title: 'Shot generator',
      desc: 'Generate multiple angles and shots from a character and environment.',
      action: 'Generate',
      color: '#E67E22',
    },
    {
      href: '/ptc-generator',
      icon: '🎤',
      title: 'PTC generator',
      desc: 'Generate piece-to-camera shots across office, car and park locations.',
      action: 'Generate',
      color: '#8E44AD',
    },
  ]

  return (
    <>
      <Head>
        <title>UGC Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#13B5EA' }} />
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#1A2B4A' }}>UGC Generator</h1>
            </div>
            <p style={{ fontSize: 15, color: '#4A5568', margin: 0, paddingLeft: 22 }}>
              Create AI avatars and place them in home-based environments for UGC video content.
            </p>
            <div style={{ fontSize: 11, color: '#CBD5E0', paddingLeft: 22, marginTop: 4 }}>v1.0.0</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            {cards.map(card => (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
                    padding: '24px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 28 }}>{card.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2B4A', marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5 }}>{card.desc}</div>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: card.color }}>
                      {card.action} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
