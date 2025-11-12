import React, { useEffect, useRef, useState } from 'react'
import { apiCheck, apiRewrite } from './api'
import type { VoiceSettings } from './types'
import TopBar from './components/TopBar'
import SuggestionCard from './components/SuggestionCard'
import VoiceModal from './components/VoiceModal'

export default function App() {
  const [text, setText] = useState('Hello Grammarly Clone')
  const [issues, setIssues] = useState<{ index: number; word: string; suggestion: string; type: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [activePanel, setActivePanel] = useState<'review' | 'write'>('review')
  const [openSuggestionIdx, setOpenSuggestionIdx] = useState<number | null>(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const promptRef = useRef<HTMLTextAreaElement | null>(null)

  function autosizePrompt() {
    const el = promptRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 240 // cap growth
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }
  const [voice, setVoice] = useState<VoiceSettings>({
    formality: 'Neutral',
    tone: 'Neutral',
    profession: 'General',
    language: 'English'
  })
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

  function applyFixesToString(t: string) {
    let s = t
    s = s.replace(/\bteh\b/gi, 'the')
    s = s.replace(/ {2,}/g, ' ')
    s = s.replace(/(^|[.!?]\s+)([a-z])/g, (_: string, p1: string, p2: string) => `${p1}${p2.toUpperCase()}`)
    s = s.replace(/(\s+)([,;:.!?])/g, '$2')
    s = s.replace(/[ \t]+$/gm, '')
    return s
  }

  function improveTone(s: string, formality: VoiceSettings['formality']) {
    let out = s
    // Remove filler
    out = out.replace(/\b(really|very|actually|basically|just)\b\s*/gi, '')
    if (formality === 'Formal') {
      // De-contract and elevate tone
      out = out.replace(/\b(can't|won't|don't|isn't|aren't|I'm|it's|there's|we're|they're|you're)\b/gi, (m) => ({
        "can't": 'cannot', "won't": 'will not', "don't": 'do not', "isn't": 'is not', "aren't": 'are not',
        "i'm": 'I am', "it's": 'it is', "there's": 'there is', "we're": 'we are', "they're": 'they are', "you're": 'you are'
      }[m.toLowerCase()] as string))
      out = out.replace(/\byou\b/gi, 'one')
    } else if (formality === 'Casual') {
      // Add contractions
      out = out.replace(/\b(cannot|will not|do not|is not|are not)\b/gi, (m) => ({
        'cannot': "can't", 'will not': "won't", 'do not': "don't", 'is not': "isn't", 'are not': "aren't"
      }[m.toLowerCase()] as string))
    }
    return out
  }

  function shortenAggressive(s: string) {
    let out = s
    out = out.replace(/\b(in order to)\b/gi, 'to')
    out = out.replace(/\b(that)\b/gi, '')
    out = out.replace(/\b(really|very|actually|basically|just)\b\s*/gi, '')
    out = out.replace(/\s+/g, ' ')
    out = out.trim()
    if (out.length > 200) out = out.slice(0, 200) + '…'
    return out
  }

  async function onImproveWriting() {
    setLoading(true)
    try {
      const res = await apiRewrite(text, voice)
      const target = voice.formality === 'Formal'
        ? res.rewrites.find(r => r.label === 'More formal')
        : res.rewrites.find(r => r.label === 'More persuasive')
      let t = target ? target.text : text
      t = applyFixesToString(t)
      t = improveTone(t, voice.formality)
      const additions = [
        'In summary, this revision improves clarity and flow.',
        'Furthermore, transitions are tightened and redundant wording reduced.',
        `The tone is aligned to a ${voice.formality.toLowerCase()} register for readability.`,
      ]
      t = `${t}\n\n${additions.join(' ')}`
      setText(t)
    } finally {
      setLoading(false)
    }
  }

  async function onShorten() {
    setLoading(true)
    try {
      const res = await apiRewrite(text, voice)
      const target = res.rewrites.find(r => r.label === 'Shorten')
      let t = target ? target.text : text
      t = shortenAggressive(t)
      if (voice.formality === 'Formal') t = improveTone(t, 'Formal')
      setText(t)
    } finally {
      setLoading(false)
    }
  }

  // Removed separate Fix Grammar AI button; use "Fix All" under Suggestions instead

  function wordCount(input: string) {
    const words = input.trim().split(/\s+/).filter(Boolean)
    return words.length
  }

  return (
    <div className="app-shell" style={{ ['--sidebar-width' as any]: sidebarOpen ? '420px' : '0px' }}>
      <div>
        <TopBar title="Untitled document" />
        <div className="editor-wrap">
          <div className="editor-page">
            <div
              ref={editorRef}
              className="editor"
              contentEditable
              role="textbox"
              aria-multiline
              onInput={(e) => setText((e.currentTarget as HTMLDivElement).textContent || '')}
            />

            {/* Floating formatting toolbar + word count (UI only) */}
            <div className="editor-footer-fixed" aria-hidden>
              <div className="formatting-toolbar" role="toolbar" aria-label="Formatting">
                <button className="tool-btn" aria-label="Bold"><strong>B</strong></button>
                <button className="tool-btn" aria-label="Italic"><em>I</em></button>
                <button className="tool-btn" aria-label="Underline"><u>U</u></button>
                <div className="tool-divider" />
                <button className="tool-btn" aria-label="Heading 1">H1</button>
                <button className="tool-btn" aria-label="Heading 2">H2</button>
                <div className="tool-divider" />
                <button className="tool-btn" aria-label="Bulleted list">•</button>
                <button className="tool-btn" aria-label="Numbered list">1.</button>
                <button className="tool-btn" aria-label="Quote">“”</button>
              </div>
              <div className="wordcount-chip" aria-label="Word count">{wordCount(text).toLocaleString()} words</div>
            </div>
          </div>
        </div>
      </div>

      <aside className="sidebar" role="complementary" aria-label={activePanel === 'review' ? 'Review suggestions' : 'Write with generative AI'} aria-hidden={!sidebarOpen}>
        <div className="sidebar-header">
          <div className="sidebar-top-tabs" role="tablist">
            <button className="top-tab" role="tab" aria-selected={activePanel==='review'} data-active={activePanel==='review'} onClick={() => setActivePanel('review')}>Review suggestions</button>
            <button className="top-tab" role="tab" aria-selected={activePanel==='write'} data-active={activePanel==='write'} onClick={() => setActivePanel('write')}>Write with generative AI</button>
          </div>
          {/* collapse control moved to floating handle outside header */}
          {activePanel === 'write' && null}
        </div>
        <div className="sidebar-inner">
          {activePanel === 'review' && (
            <>
              <div className="section-band">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="sidebar-title">Review suggestions</h3>
                  <span className="count-chip" aria-label={`${issues.length} suggestions`}>{issues.length}</span>
                </div>
              </div>
              <div className="tabs" role="tablist" style={{ marginTop: 12 }}>
                <button className="tab correct" role="tab" aria-selected="true" data-active="true">Correctness</button>
                <button className="tab clarity" role="tab">Clarity</button>
                <button className="tab engage" role="tab">Engagement</button>
                <button className="tab delivery" role="tab">Delivery</button>
              </div>
            </>
          )}
          {activePanel === 'review' ? (
            <div role="tabpanel" aria-labelledby="tab-review">
              {issues.length === 0 ? (
                <div className="empty-state" role="status" aria-live="polite">
                  <div className="empty-illustration" aria-hidden>
                    <svg width="80" height="80" viewBox="0 0 64 64">
                      <path d="M6 34l22-8 22 8-22 8-22-8z" fill="#C7F2E9"/>
                      <path d="M28 26l12-10 6 18-18-8z" fill="#15C39A"/>
                    </svg>
                  </div>
                  <div className="empty-title">You got this.</div>
                  <div className="empty-subtitle">Suggestions will appear here.</div>
                </div>
              ) : (
                <div role="list" className="suggestion-list">
                  {issues.slice(0, 3).map((i, idx) => (
                    openSuggestionIdx === idx ? (
                      <SuggestionCard
                        key={idx}
                        label={i.type === 'spelling' ? 'Spelling' : 'Grammar'}
                        text={`Replace \"${i.word}\" with \"${i.suggestion}\"`}
                        category={i.type === 'spelling' ? 'correctness' : 'clarity'}
                        onUse={() => { fixAll(); setOpenSuggestionIdx(null) }}
                        onDismiss={() => setIssues(issues.filter((_, j) => j !== idx))}
                      />
                    ) : (
                      <div key={idx} className="suggestion-row" role="listitem" onClick={() => setOpenSuggestionIdx(idx)}>
                        <div className="sugg-inner">
                          <span className="sugg-icon" aria-hidden>
                            <span className="sugg-dot" style={{ background: i.type === 'spelling' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: i.type === 'spelling' ? '#EF4444' : '#3B82F6' }}>●</span>
                          </span>
                          <div className="sugg-text">
                            <div className="sugg-title">{i.type === 'spelling' ? 'Fix spelling' : 'Grammar suggestion'}</div>
                            <div className="sugg-main">{i.suggestion}</div>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {issues.length > 3 && (
                    <div className="muted small" style={{ marginTop: 8 }}>{issues.length - 3} more…</div>
                  )}
                </div>
              )}
              {issues.length > 0 && (
                <div className="section">
                  <button className="btn btn-primary" onClick={fixAll}>Fix All</button>
                </div>
              )}
            </div>
          ) : (
            <div role="tabpanel" aria-labelledby="tab-write">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}>What do you want to do?</div>
                  <div className="muted" style={{ fontSize: 16 }}>Here are some ideas</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-icon" aria-label="Magic ideas">
                    <svg className="idea-icon" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2l1.8 3.8L18 8l-4.2 2.2L12 14l-1.8-3.8L6 8l4.2-2.2L12 2z" fill="#0FAD8F"/>
                    </svg>
                  </button>
                  <button className="btn-icon" aria-label="Voice" onClick={() => setVoiceOpen(true)}>
                    <svg className="idea-icon" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3zm-5 8a5 5 0 1 0 10 0h2a7 7 0 0 1-6 6.93V21h-2v-3.07A7 7 0 0 1 5 11h2z" fill="#111827"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="ideas-grid">
                <div className="idea-card" onClick={onImproveWriting}>
                  <div className="idea-left">
                    <svg className="idea-icon" viewBox="0 0 24 24" aria-hidden>
                      <path d="M4 17l6-6 3 3 7-7" stroke="#0FAD8F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Improve it</span>
                  </div>
                  <span className="idea-chevron">›</span>
                </div>
                <div className="idea-card" onClick={onShorten}>
                  <div className="idea-left">
                    <svg className="idea-icon" viewBox="0 0 24 24" aria-hidden>
                      <path d="M10 3l2 4 4 .6-3 3 .7 4.4L10 13l-3.7 2 1-4.4-3-3L8 7.1 10 3z" fill="#111827"/>
                    </svg>
                    <span>Identify any gaps</span>
                  </div>
                  <span className="idea-chevron">›</span>
                </div>
                <div className="idea-card">
                  <div className="idea-left">
                    <svg className="idea-icon" viewBox="0 0 24 24" aria-hidden>
                      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" fill="#111827"/>
                    </svg>
                    <span>More ideas</span>
                  </div>
                  <span className="idea-chevron">›</span>
                </div>
              </div>

              {/* Buttons removed per spec to match Grammarly */}
            </div>
          )}
        </div>
        {activePanel === 'write' && (
          <div className="sidebar-footer">
            <textarea
              ref={promptRef}
              className="prompt-box"
              placeholder="Tell us to..."
              rows={1}
              onInput={autosizePrompt}
            />
          </div>
        )}
      </aside>
      {sidebarOpen && (
        <button className="sidebar-collapse" aria-label="Hide sidebar" onClick={() => setSidebarOpen(false)}>›</button>
      )}
      {!sidebarOpen && (
        <button className="sidebar-expand" aria-label="Show sidebar" onClick={() => setSidebarOpen(true)}>‹</button>
      )}
      <VoiceModal open={voiceOpen} initial={voice} onClose={() => setVoiceOpen(false)} onApply={(v) => setVoice(v)} />
    </div>
  )
}


