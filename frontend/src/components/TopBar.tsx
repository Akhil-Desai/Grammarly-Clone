import React from 'react'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Grammarly-like logo (inline SVG) */}
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#15C39A" />
          <path d="M8 12.5c0-2.5 1.8-4.5 4.4-4.5 1.8 0 3 .8 3.6 2l-1.4.8c-.3-.7-1.1-1.3-2.2-1.3-1.6 0-2.8 1.1-2.8 3 0 2 1.2 3 2.8 3 .9 0 1.6-.4 2-.9v-1.1h-1.8v-1.4H17v3.2c-.7.9-2 1.8-3.8 1.8C9.8 17 8 15 8 12.5z" fill="#fff"/>
        </svg>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="pill">Goals</span>
        <span className="pill">83 Overall score</span>
      </div>
    </div>
  )
}


