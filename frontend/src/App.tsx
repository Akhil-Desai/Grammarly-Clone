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
  const [voiceOpen, setVoiceOpen] = useState(false)
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

  return (
    <div className="app-shell">
      <div>
        <TopBar title="My Document #1" />
        <div className="editor-wrap">
          <div className="editor-page">
            <div
              ref={editorRef}
              className="editor"
              contentEditable
              role="textbox"
              aria-multiline
              onInput={(e) => setText((e.currentTarget as HTMLDivElement).innerText || '')}
            />
          </div>
        </div>
      </div>

      <aside className="sidebar" role="complementary" aria-label={activePanel === 'review' ? 'Review suggestions' : 'Write with generative AI'}>
        <div className="sidebar-header">
          <div className="sidebar-top-tabs" role="tablist">
            <button className="top-tab" role="tab" aria-selected={activePanel==='review'} data-active={activePanel==='review'} onClick={() => setActivePanel('review')}>Review suggestions</button>
            <button className="top-tab" role="tab" aria-selected={activePanel==='write'} data-active={activePanel==='write'} onClick={() => setActivePanel('write')}>Write with generative AI</button>
          </div>
          {activePanel === 'review' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="sidebar-title">Review suggestions</h3>
                <span className="pill">{issues.length} items</span>
              </div>
              <div className="tabs" role="tablist">
                <button className="tab correct" role="tab" aria-selected="true" data-active="true">Correctness</button>
                <button className="tab clarity" role="tab">Clarity</button>
                <button className="tab engage" role="tab">Engagement</button>
                <button className="tab delivery" role="tab">Delivery</button>
              </div>
            </>
          )}
          {activePanel === 'write' && null}
        </div>
        <div className="sidebar-inner">
          {activePanel === 'review' ? (
            <div role="tabpanel" aria-labelledby="tab-review">
              {issues.length === 0 ? (
                <div className="group group-padding"><div className="small muted">No issues found.</div></div>
              ) : (
                <div role="list">
                  {issues.slice(0, 3).map((i, idx) => (
                    <SuggestionCard
                      key={idx}
                      label={i.type === 'spelling' ? 'Spelling' : 'Grammar'}
                      text={`Replace \"${i.word}\" with \"${i.suggestion}\"`}
                      category={i.type === 'spelling' ? 'correctness' : 'clarity'}
                      onUse={() => fixAll()}
                      onDismiss={() => setIssues(issues.filter((_, j) => j !== idx))}
                    />
                  ))}
                  {issues.length > 3 && (
                    <div className="muted small" style={{ marginTop: 8 }}>{issues.length - 3} more…</div>
                  )}
                </div>
              )}
              <div className="section">
                <button className="btn btn-primary" onClick={fixAll}>Fix All</button>
              </div>
            </div>
          ) : (
            <div role="tabpanel" aria-labelledby="tab-write">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>What do you want to do?</div>
                  <div className="muted">Here are some ideas</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost" aria-label="Magic ideas">✦</button>
                  <button className="btn btn-ghost" aria-label="Voice" onClick={() => setVoiceOpen(true)}>🔈</button>
                </div>
              </div>
              <div className="list">
                <div className="list-item" onClick={onImproveWriting}>Improve it<span>›</span></div>
                <div className="list-item" onClick={onShorten}>Identify any gaps<span>›</span></div>
                <div className="list-item">More ideas<span>›</span></div>
              </div>

              <div className="section" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn" onClick={onImproveWriting} disabled={loading}>Improve Writing</button>
                <button className="btn" onClick={onShorten} disabled={loading}>Make it Shorter</button>
              </div>

              <div className="prompt-sticky">
                <textarea
                  ref={promptRef}
                  className="prompt-box"
                  placeholder="Tell us to..."
                  rows={1}
                  onInput={autosizePrompt}
                />
              </div>
            </div>
          )}
        </div>
      </aside>
      <VoiceModal open={voiceOpen} initial={voice} onClose={() => setVoiceOpen(false)} onApply={(v) => setVoice(v)} />
    </div>
  )
}


