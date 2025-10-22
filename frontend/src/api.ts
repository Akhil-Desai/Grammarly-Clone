const BASE_URL = 'http://localhost:3001'

export async function apiCheck(text: string, voice?: any) {
  const res = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  })
  return res.json() as Promise<{ issues: { index: number; word: string; suggestion: string; type: string }[] }>
}

export async function apiRewrite(text: string, voice?: any) {
  const res = await fetch(`${BASE_URL}/api/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  })
  return res.json() as Promise<{ rewrites: { label: string; text: string }[] }>
}

export async function apiSuggestions(text: string, voice?: any) {
  const res = await fetch(`${BASE_URL}/api/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  })
  return res.json() as Promise<{ textLength: number; prompts: string[] }>
}


