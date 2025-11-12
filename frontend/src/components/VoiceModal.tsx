import React, { useMemo, useState } from 'react'
import type { VoiceSettings } from '../types'

interface VoiceModalProps {
  open: boolean
  initial: VoiceSettings
  onClose: () => void
  onApply: (v: VoiceSettings) => void
}

export default function VoiceModal({ open, initial, onClose, onApply }: VoiceModalProps) {
  const [local, setLocal] = useState<VoiceSettings>(initial)
  const [profession, setProfession] = useState('')
  const formalityOptions: VoiceSettings['formality'][] = ['Casual', 'Neutral', 'Formal']

  React.useEffect(() => { setLocal(initial) }, [initial])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="My voice">
      <div className="modal-panel">
        <div className="modal-header">
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">←</button>
          <div className="sidebar-title">My voice</div>
        </div>

        <div className="modal-body">
          <div className="field">
            <div className="field-label">Formality</div>
            <div className="segmented">
              {formalityOptions.map(o => (
                <button
                  key={o}
                  className="segment"
                  data-active={local.formality === o}
                  onClick={() => setLocal(v => ({ ...v, formality: o }))}
                >{o}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="field-label">Your profession</div>
            <input className="input" placeholder="Product designer" value={profession} onChange={e => setProfession(e.target.value)} />
          </div>

          <div className="field">
            <div className="field-label">I write in</div>
            <select className="input" value={local.language} onChange={(e) => setLocal(v => ({ ...v, language: e.target.value as VoiceSettings['language'] }))}>
              <option>English</option>
              <option>Spanish</option>
            </select>
          </div>

          <div className="muted small" style={{ marginTop: 8 }}>These voice settings will apply to any text you generate.</div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onApply(local); onClose() }}>Use this voice</button>
        </div>
      </div>
    </div>
  )
}


