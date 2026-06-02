const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const translate = (text, lang) =>
  request('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, lang }),
  })

export const getHistory = () => request('/history')

export const saveHistory = (lang, original, translated) =>
  request('/history', {
    method: 'POST',
    body: JSON.stringify({ lang, original, translated }),
  })

export const getGlossary = (lang) => request(`/glossary/${lang}`)

export const addGlossary = (source_word, target_word, lang) =>
  request('/glossary', {
    method: 'POST',
    body: JSON.stringify({ source_word, target_word, lang }),
  })

export const deleteGlossary = (lang, source_word) =>
  request(`/glossary/${lang}/${encodeURIComponent(source_word)}`, {
    method: 'DELETE',
  })
