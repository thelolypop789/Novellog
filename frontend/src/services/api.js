import { supabase } from '../lib/supabase'

function getBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // Codespaces: swap frontend port to backend port 8000 automatically
  const host = window.location.hostname
  if (host.includes('.app.github.dev')) {
    return `https://${host.replace(/-\d+\.app\.github\.dev$/, '-8000.app.github.dev')}`
  }
  return 'http://localhost:8000'
}

const BASE_URL = getBaseUrl()

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('กรุณาเข้าสู่ระบบก่อน')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request(path, options = {}) {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader },
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

export const getMyCredits = () => request('/me/credits')
