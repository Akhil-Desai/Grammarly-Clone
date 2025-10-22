import React, { useEffect, useState } from 'react'
import { apiCheck, apiRewrite, apiSuggestions } from './api'
import type { VoiceSettings } from './types'

export default function App() {
  const [text, setText] = useState('Hello Grammarly Clone')
  const [issues, setIssues] = useState<{ index: number; word: string; suggestion: string; type: string }[]>([])
  const [rewriteOptions, setRewriteOptions] = useState<{ label: string; text: string }[]>([])
  const [prompts, setPrompts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [voice, setVoice] = useState<VoiceSettings>({
    formality: 'Neutral',
    tone: 'Neutral',
    profession: 'General',
    language: 'English'
  })

  // naive debounce for realtime check
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const result = await apiCheck(text, voice)
        setIssues(result.issues || [])
      } catch {
        setIssues([])
      }
    }, 350)
    return () => clearTimeout(id)
  }, [text, voice])

  useEffect(() => {
    // refresh suggestions when text changes
    apiSuggestions(text, voice).then((r) => setPrompts(r.prompts || [])).catch(() => setPrompts([]))
  }, [text, voice])

  const fixAll = () => {
    setText((t) => {
      let s = t
      s = s.replace(/\bteh\b/gi, 'the')
      s = s.replace(/ {2,}/g, ' ')
      s = s.replace(/(^|[.!?]\s+)([a-z])/g, (_: string, p1: string, p2: string) => `${p1}${p2.toUpperCase()}`)
      s = s.replace(/(\s+)([,;:.!?])/g, '$2')
      s = s.replace(/[ \t]+$/gm, '')
      return s
    })
  }

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui', padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Grammarly Clone (MVP)</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button title="Spell & Grammar Check (stub)" onClick={async () => {
            setLoading(true)
            try { setIssues((await apiCheck(text, voice)).issues || []) } finally { setLoading(false) }
          }}>Check</button>
          <button title="Rewrite (stub)" onClick={async () => {
            setLoading(true)
            try { setRewriteOptions((await apiRewrite(text, voice)).rewrites || []) } finally { setLoading(false) }
          }}>Rewrite</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 12 }}>
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing..."
            style={{ width: '95%', height: 360, fontSize: 16, padding: 12, marginTop: 8, overflow: 'auto' }}
          />
        </div>

        <aside
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 12,
            height: 420,
            overflow: 'auto'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#374151' }}>
              Formality
              <select value={voice.formality} onChange={(e) => setVoice(v => ({ ...v, formality: e.target.value as VoiceSettings['formality'] }))} style={{ display: 'block', width: '100%' }}>
                <option>Casual</option>
                <option>Neutral</option>
                <option>Formal</option>
              </select>
            </label>
            <label style={{ fontSize: 12, color: '#374151' }}>
              Tone
              <select value={voice.tone} onChange={(e) => setVoice(v => ({ ...v, tone: e.target.value as VoiceSettings['tone'] }))} style={{ display: 'block', width: '100%' }}>
                <option>Friendly</option>
                <option>Neutral</option>
                <option>Assertive</option>
              </select>
            </label>
            <label style={{ fontSize: 12, color: '#374151' }}>
              Profession
              <select value={voice.profession} onChange={(e) => setVoice(v => ({ ...v, profession: e.target.value as VoiceSettings['profession'] }))} style={{ display: 'block', width: '100%' }}>
                <option>General</option>
                <option>Student</option>
                <option>Engineer</option>
                <option>Marketing</option>
              </select>
            </label>
            <label style={{ fontSize: 12, color: '#374151' }}>
              Language
              <select value={voice.language} onChange={(e) => setVoice(v => ({ ...v, language: e.target.value as VoiceSettings['language'] }))} style={{ display: 'block', width: '100%' }}>
                <option>English</option>
                <option>Spanish</option>
              </select>
            </label>
          </div>
          <h3 style={{ marginTop: 0, fontSize: 14, color: '#374151' }}>Suggestions</h3>
          {loading && <div style={{ color: '#6b7280', fontSize: 12 }}>Loading…</div>}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Issues</div>
            {issues.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13 }}>No issues found.</div>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0, color: '#6b7280', fontSize: 14 }}>
                {issues.map((i, idx) => (
                  <li key={idx}>{i.type}: "{i.word}" → {i.suggestion}</li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 8 }}>
              <button onClick={fixAll}>Fix All</button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Rewrites</div>
            {rewriteOptions.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 13 }}>Click Rewrite to see options.</div>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0, color: '#6b7280', fontSize: 14 }}>
                {rewriteOptions.map((r, idx) => (
                  <li key={idx}>
                    <button onClick={() => setText(r.text)} style={{ marginRight: 6 }}>Apply</button>
                    <strong>{r.label}:</strong> {r.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Prompt Recommendations</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {prompts.map((p, idx) => (
                <button key={idx} onClick={async () => {
                  // For MVP, map prompts to rewrite calls/hardcoded behaviors
                  if (p.toLowerCase().includes('shorten')) {
                    const res = await apiRewrite(text, voice)
                    const opt = res.rewrites.find(r => r.label === 'Shorten')
                    if (opt) setText(opt.text)
                  } else if (p.toLowerCase().includes('persuasive')) {
                    const res = await apiRewrite(text, voice)
                    const opt = res.rewrites.find(r => r.label === 'More persuasive')
                    if (opt) setText(opt.text)
                  } else if (p.toLowerCase().includes('formal')) {
                    const res = await apiRewrite(text, voice)
                    const opt = res.rewrites.find(r => r.label === 'More formal')
                    if (opt) setText(opt.text)
                  } else {
                    const res = await apiCheck(text, voice)
                    setIssues(res.issues || [])
                  }
                }}>{p}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}


