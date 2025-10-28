import React from 'react'

interface SuggestionCardProps {
  label: string
  text: string
  category?: 'correctness' | 'clarity' | 'engagement' | 'delivery'
  onUse?: () => void
  onDismiss?: () => void
}

export default function SuggestionCard({ label, text, category = 'clarity', onUse, onDismiss }: SuggestionCardProps) {
  const color = category === 'correctness' ? 'var(--acc-correct)'
    : category === 'engagement' ? 'var(--acc-engage)'
    : category === 'delivery' ? 'var(--acc-delivery)'
    : 'var(--acc-clarity)'

  return (
    <div className="card" role="listitem">
      <div className="card-header">
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: 'inline-block' }} />
        <span>{label}</span>
      </div>
      <div className="small" style={{ background: 'var(--hl-bg)', border: '1px solid var(--hl-border)', padding: 8, borderRadius: 8 }}>
        {text}
      </div>
      <div className="card-actions">
        <button className="btn btn-primary" onClick={onUse}>Use this version</button>
        <button className="btn btn-ghost" onClick={onDismiss}>Dismiss</button>
        <button className="btn btn-ghost" aria-label="More options">⋮</button>
      </div>
    </div>
  )
}


