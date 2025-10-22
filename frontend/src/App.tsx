import React, { useEffect, useRef, useState } from 'react'
import { apiCheck, apiRewrite } from './api'
import type { VoiceSettings } from './types'

export default function App() {
  const [text, setText] = useState('Hello Grammarly Clone')
  const [issues, setIssues] = useState<{ index: number; word: string; suggestion: string; type: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [voice, setVoice] = useState<VoiceSettings>({
    formality: 'Neutral',
    tone: 'Neutral',
    profession: 'General',
    language: 'English'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement | null>(null)

  const exampleDoc = `This is a sample document.

it includes teh common typo, and  two  spaces in places , plus lowercase after a sentence. Don't worry — you can try the Improve Writing option to make it formal or shorter.

Also, check how the grammar rules handle spacing and Capitalization.`

  // Utilities for caret save/restore
  function getCaretOffset(root: HTMLElement): number | null {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    if (!root.contains(range.endContainer)) return null
    const preRange = range.cloneRange()
    preRange.selectNodeContents(root)
    preRange.setEnd(range.endContainer, range.endOffset)
    return preRange.toString().length
  }

  function setCaretOffset(root: HTMLElement, offset: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let currentOffset = 0
    let node: Node | null = null
    while ((node = walker.nextNode())) {
      const text = (node as Text).data
      const nextOffset = currentOffset + text.length
      if (offset <= nextOffset) {
        const sel = window.getSelection()
        if (!sel) return
        const range = document.createRange()
        const pos = Math.max(0, offset - currentOffset)
        range.setStart(node, pos)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return
      }
      currentOffset = nextOffset
    }
    // If beyond end, place at end
    const sel = window.getSelection()
    if (!sel) return
    const range = document.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function computeHighlightedHtml(input: string): string {
    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    let html = escapeHtml(input)
    const red = 'text-decoration: underline wavy red; text-underline-offset: 3px'
    const blue = 'text-decoration: underline wavy #3b82f6; text-underline-offset: 3px'

    // Spelling: 'teh' (red)
    html = html.replace(/\bteh\b/gi, (m) => `<span style="${red}" title="Spelling: did you mean 'the'?">${m}</span>`)

    // Grammar: double spaces (blue)
    html = html.replace(/ {2,}/g, (m) => `<span style="${blue}" title="Extra spaces">${m}</span>`)

    // Grammar: lowercase after sentence boundary -> capitalize (blue)
    html = html.replace(/(^|[.!?]\s+)([a-z])/g, (_: string, p1: string, p2: string) => `${p1}<span style="${blue}" title="Capitalize">${p2}</span>`)

    // Grammar: space before punctuation (blue)
    html = html.replace(/(\s+)([,;:.!?])/g, (_: string, s: string, p: string) => `<span style="${blue}" title="Remove space before punctuation">${s}${p}</span>`)

    return html
  }

  function detectIssues(input: string) {
    const list: { index: number; word: string; suggestion: string; type: string }[] = []

    // Spelling: 'teh' -> 'the'
    const reTeh = /\bteh\b/gi
    let m: RegExpExecArray | null
    while ((m = reTeh.exec(input))) {
      list.push({ index: m.index, word: m[0], suggestion: 'the', type: 'spelling' })
    }

    // Double spaces
    const reSpaces = / {2,}/g
    while ((m = reSpaces.exec(input))) {
      list.push({ index: m.index, word: 'extra spaces', suggestion: 'remove extra space', type: 'grammar' })
    }

    // Lowercase after sentence boundary
    const reCap = /(^|[.!?]\s+)([a-z])/g
    while ((m = reCap.exec(input))) {
      list.push({ index: m.index + (m[1]?.length || 0), word: m[2], suggestion: m[2].toUpperCase(), type: 'grammar' })
    }

    // Space before punctuation
    const rePunc = /(\s+)([,;:.!?])/g
    while ((m = rePunc.exec(input))) {
      list.push({ index: m.index, word: 'space before punctuation', suggestion: 'remove space', type: 'grammar' })
    }

    return list
  }

  // Synchronize editor display with highlighted content while preserving caret
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const savedOffset = getCaretOffset(el)
    const newHtml = computeHighlightedHtml(text)
    if (el.innerHTML !== newHtml) {
      el.innerHTML = newHtml
    }
    if (savedOffset != null) setCaretOffset(el, savedOffset)
  }, [text, issues])

  // naive debounce for realtime check
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        // derive issues from local rules so they match underlines
        setIssues(detectIssues(text))
      } catch {
        setIssues([])
      }
    }, 250)
    return () => clearTimeout(id)
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

  async function onImproveWriting() {
    setLoading(true)
    try {
      const res = await apiRewrite(text, voice)
      const target = voice.formality === 'Formal'
        ? res.rewrites.find(r => r.label === 'More formal')
        : res.rewrites.find(r => r.label === 'More persuasive')
      if (target) setText(target.text)
    } finally {
      setLoading(false)
    }
  }

  async function onShorten() {
    setLoading(true)
    try {
      const res = await apiRewrite(text, voice)
      const target = res.rewrites.find(r => r.label === 'Shorten')
      if (target) setText(target.text)
    } finally {
      setLoading(false)
    }
  }

  function onFixGrammar() {
    fixAll()
  }

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui', padding: 16, paddingRight: 336 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button aria-label="Open menu" onClick={() => setMenuOpen(v => !v)}>☰</button>
          <h1 style={{ margin: 0, fontSize: 20 }}>My Document #1</h1>
          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 220, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 50 }}>
              <div style={{ padding: 8, borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>Menu</div>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent' }} onClick={() => { setText(''); setMenuOpen(false) }}>Home</button>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent' }} onClick={() => { setText(exampleDoc); setMenuOpen(false) }}>New Document</button>
              <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent' }} onClick={() => { window.alert('Grammarly Clone MVP: basic editor, inline checks, simple AI actions.'); setMenuOpen(false) }}>About this MVP</button>
            </div>
          )}
        </div>
      </header>

      <div style={{ marginTop: 12 }}>
        <div>
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-multiline
            onInput={(e) => setText((e.currentTarget as HTMLDivElement).innerText || '')}
            style={{ width: '95%', height: 360, fontSize: 16, padding: 12, marginTop: 8, overflow: 'auto', border: '1px solid transparent', borderRadius: 8, whiteSpace: 'pre-wrap', outline: '2px solid transparent', boxShadow: 'none' }}
          />
        </div>

        <aside
          style={{
            position: 'fixed',
            top: 0,
            right: 16,
            width: 320,
            height: '100vh',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 12,
            overflow: 'auto',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: 14, color: '#374151' }}>Voice</h3>
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

          <h3 style={{ fontSize: 14, color: '#374151' }}>Improve with AI</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={onImproveWriting} disabled={loading}>Improve Writing</button>
            <button onClick={onShorten} disabled={loading}>Make it Shorter</button>
            <button onClick={onFixGrammar} disabled={loading}>Fix Grammar</button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Custom instruction</div>
            <textarea
              placeholder="e.g., make it more confident, friendlier, shorter..."
              onChange={(e) => (e.currentTarget as HTMLTextAreaElement).value}
              style={{ width: '100%', maxWidth: '100%', height: 64, fontSize: 13, padding: 8, boxSizing: 'border-box', resize: 'none', display: 'block' }}
              id="ai-instruction"
            />
            <div style={{ marginTop: 6 }}>
              <button onClick={() => {
                const el = document.getElementById('ai-instruction') as HTMLTextAreaElement | null
                const instruction = (el?.value || '').toLowerCase()
                let t = text
                if (instruction.includes('short')) {
                  t = t.length > 160 ? t.slice(0, 160) + '…' : t
                }
                if (instruction.includes('formal')) {
                  t = t.replace(/\b(can't|won't|don't|isn't|aren't)\b/gi, (m) => ({
                    "can't": 'cannot', "won't": 'will not', "don't": 'do not', "isn't": 'is not', "aren't": 'are not'
                  }[m.toLowerCase()] as string))
                }
                if (instruction.includes('confident')) {
                  t = 'Clearly, ' + t
                }
                if (instruction.includes('friendly')) {
                  t = t.replace(/\b(one|the user|the customer)\b/gi, 'you')
                }
                setText(t)
              }}>Apply</button>
            </div>
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
        </aside>
      </div>
    </div>
  )
}


