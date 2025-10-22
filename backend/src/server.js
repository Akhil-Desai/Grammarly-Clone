import http from 'node:http'

const PORT = process.env.PORT || 3001

const server = http.createServer(async (req, res) => {
  // Basic CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // Helper to read JSON body
  async function readJsonBody() {
    return await new Promise((resolve) => {
      let data = ''
      req.on('data', (chunk) => (data += chunk))
      req.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'))
        } catch {
          resolve({})
        }
      })
    })
  }

  if (req.method === 'POST' && req.url === '/api/check') {
    const body = (await readJsonBody()) || {}
    // Naive stub: mark any word 'teh' as misspelled
    const text = String(body.text || '')
    const issues = []
    const words = text.split(/\b/)
    words.forEach((w, i) => {
      if (/^teh$/i.test(w)) {
        issues.push({ index: i, word: w, suggestion: 'the', type: 'spelling' })
      }
    })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ issues }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/rewrite') {
    const body = (await readJsonBody()) || {}
    const text = String(body.text || '')
    // Naive stub rewrites
    const rewrites = [
      { label: 'Shorten', text: text.slice(0, 120) + (text.length > 120 ? '…' : '') },
      { label: 'More formal', text: text.replace(/\byou\b/gi, 'one') },
      { label: 'More persuasive', text: 'Clearly, ' + text }
    ]
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ rewrites }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/suggestions') {
    const body = (await readJsonBody()) || {}
    const text = String(body.text || '')
    // Prompt recommendations (static for MVP)
    const prompts = [
      'Shorten it',
      'Make it persuasive',
      'Make it formal',
      'Fix grammar and spelling'
    ]
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ textLength: text.length, prompts }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'Backend up' }))
})

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})


