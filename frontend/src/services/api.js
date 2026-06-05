import { supabase } from '../lib/supabase'

function getBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const host = window.location.hostname
  if (host.includes('.app.github.dev')) {
    return `https://${host.replace(/-\d+\.app\.github\.dev$/, '-8000.app.github.dev')}`
  }
  return 'http://localhost:8000'
}

const BASE_URL = getBaseUrl()

let _cachedToken = null

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null
})

async function getAuthHeader() {
  if (_cachedToken) return { Authorization: `Bearer ${_cachedToken}` }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('กรุณาเข้าสู่ระบบก่อน')
  _cachedToken = session.access_token
  return { Authorization: `Bearer ${_cachedToken}` }
}

async function request(path, options = {}) {
  let authHeader = await getAuthHeader()
  let res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader },
    ...options,
  })
  // Token expired — clear cache and retry once
  if (res.status === 401) {
    _cachedToken = null
    authHeader = await getAuthHeader()
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader },
      ...options,
    })
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const translate = (text, lang, novelId = null, genre = null) =>
  request('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, lang, novel_id: novelId, genre }),
  })

export const getHistory = () => request('/history')

export const saveHistory = (lang, original, translated) =>
  request('/history', {
    method: 'POST',
    body: JSON.stringify({ lang, original, translated }),
  })

export const getGlossary = (lang, novelId = null) => {
  const url = novelId ? `/glossary/${lang}?novel_id=${novelId}` : `/glossary/${lang}`
  return request(url)
}

export const addGlossary = (source_word, target_word, lang, novelId = null) =>
  request('/glossary', {
    method: 'POST',
    body: JSON.stringify({ source_word, target_word, lang, novel_id: novelId }),
  })

export const deleteGlossary = (lang, source_word, novelId = null) => {
  const url = novelId
    ? `/glossary/${lang}/${encodeURIComponent(source_word)}?novel_id=${novelId}`
    : `/glossary/${lang}/${encodeURIComponent(source_word)}`
  return request(url, { method: 'DELETE' })
}

export const getMyCredits = () => request('/me/credits')

export const getNovels = () => request('/novels')

export const createNovel = (title, url, lang, genre = null, styleNotes = null) =>
  request('/novels', {
    method: 'POST',
    body: JSON.stringify({ title, url, lang, genre, style_notes: styleNotes }),
  })

export const updateNovel = (novelId, data) =>
  request(`/novels/${novelId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteNovel = (novelId) =>
  request(`/novels/${novelId}`, { method: 'DELETE' })

export const extractNames = (text, lang) =>
  request('/extract-names', {
    method: 'POST',
    body: JSON.stringify({ text, lang }),
  })
