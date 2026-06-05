import { useState, useEffect } from 'react'
import { getGlossary, addGlossary, deleteGlossary } from '../services/api'

export default function GlossaryManager() {
  const [lang, setLang] = useState('EN')
  const [items, setItems] = useState([])
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getGlossary(lang)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang])

  async function handleAdd() {
    if (!source.trim() || !target.trim()) return
    try {
      await addGlossary(source.trim(), target.trim(), lang)
      setItems((prev) => {
        const exists = prev.find((i) => i.source_word === source.trim())
        if (exists) {
          return prev.map((i) =>
            i.source_word === source.trim() ? { ...i, target_word: target.trim() } : i
          )
        }
        return [...prev, { source_word: source.trim(), target_word: target.trim() }]
      })
      setSource('')
      setTarget('')
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(sourceWord) {
    try {
      await deleteGlossary(lang, sourceWord)
      setItems((prev) => prev.filter((i) => i.source_word !== sourceWord))
    } catch (e) {
      setError(e.message)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* Lang tabs */}
      <div className="flex gap-2">
        {['EN', 'CN'].map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${lang === l ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ต้นฉบับ (เช่น Leon)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ภาษาไทย (เช่น ลีออน)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={handleAdd}
          disabled={!source.trim() || !target.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors sm:flex-shrink-0"
        >
          เพิ่ม
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-400">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-400">ยังไม่มี Glossary สำหรับ {lang}</div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div
              key={item.source_word}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm"
            >
              <span className="text-gray-700 w-24 sm:w-32 truncate flex-shrink-0">{item.source_word}</span>
              <span className="text-gray-300">→</span>
              <span className="text-gray-700 flex-1">{item.target_word}</span>
              <button
                onClick={() => handleDelete(item.source_word)}
                className="text-red-400 hover:text-red-600 text-xs px-1 transition-colors"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
