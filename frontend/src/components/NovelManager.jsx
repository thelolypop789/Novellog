import { useState, useEffect } from 'react'
import { getNovels, createNovel, updateNovel, deleteNovel, getGlossary, addGlossary, deleteGlossary } from '../services/api'

const GENRES = [
  { value: '', label: '— ไม่ระบุ —' },
  { value: 'Xianxia', label: 'Xianxia / Wuxia (กำลังภายใน / เซียน)' },
  { value: 'Isekai', label: 'Isekai / Transmigration (โอ้โลก / ข้ามมิติ)' },
  { value: 'Romance', label: 'Romance (โรแมนติก)' },
  { value: 'BL', label: "BL (Boys' Love)" },
  { value: 'GL', label: "GL (Girls' Love)" },
  { value: 'Action', label: 'Action / Adventure (แอ็กชัน)' },
  { value: 'Horror', label: 'Horror / Thriller (สยองขวัญ)' },
  { value: 'Mystery', label: 'Mystery / Detective (สืบสวน)' },
  { value: 'Historical', label: 'Historical (ประวัติศาสตร์)' },
  { value: 'Slice of Life', label: 'Slice of Life (ชีวิตประจำวัน)' },
]

const STYLE_PLACEHOLDER =
  'เช่น: พระเอกเย็นชา แทนตัวเองว่า "ข้า" เรียกนางเอกว่า "เจ้า" · ห้ามแปล cultivation terms ตรงตัว · ใช้ภาษาดุดัน จริงจัง'

function NovelGlossary({ novel }) {
  const [items, setItems] = useState([])
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getGlossary(novel.lang, novel.id)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [novel.id, novel.lang])

  async function handleAdd() {
    if (!source.trim() || !target.trim()) return
    try {
      await addGlossary(source.trim(), target.trim(), novel.lang, novel.id)
      setItems((prev) => {
        const exists = prev.find((i) => i.source_word === source.trim())
        if (exists)
          return prev.map((i) =>
            i.source_word === source.trim() ? { ...i, target_word: target.trim() } : i
          )
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
      await deleteGlossary(novel.lang, sourceWord, novel.id)
      setItems((prev) => prev.filter((i) => i.source_word !== sourceWord))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">
        Glossary เฉพาะเรื่องนี้ ({novel.lang}) — ใช้ร่วมกับ Global Glossary ตอนแปล
      </p>
      <div className="flex gap-2 mb-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ต้นฉบับ"
          className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ภาษาไทย"
          className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
        <button
          onClick={handleAdd}
          disabled={!source.trim() || !target.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          เพิ่ม
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {loading ? (
        <p className="text-xs text-gray-400">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">ยังไม่มี Glossary เฉพาะเรื่องนี้</p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div
              key={item.source_word}
              className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded text-xs"
            >
              <span className="text-gray-700 w-28 truncate">{item.source_word}</span>
              <span className="text-gray-300">→</span>
              <span className="text-gray-700 flex-1">{item.target_word}</span>
              <button
                onClick={() => handleDelete(item.source_word)}
                className="text-red-400 hover:text-red-600 transition-colors"
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

function NovelStyleEditor({ novel, onSaved }) {
  const [genre, setGenre] = useState(novel.genre ?? '')
  const [styleNotes, setStyleNotes] = useState(novel.style_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dirty = genre !== (novel.genre ?? '') || styleNotes !== (novel.style_notes ?? '')

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateNovel(novel.id, { genre: genre || null, style_notes: styleNotes || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4">
      <p className="text-xs text-gray-400 mb-2">บริบทสำหรับ AI — ใช้ตอนแปลด้วยนิยายเรื่องนี้</p>
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">แนว (Genre)</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-600"
          >
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2">
        <label className="text-xs text-gray-500 mb-1 block">Style Notes (คำสั่งเสริมให้ AI)</label>
        <textarea
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          placeholder={STYLE_PLACEHOLDER}
          rows={3}
          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
        />
      </div>
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว ✓' : 'บันทึก Style'}
        </button>
      )}
    </div>
  )
}

export default function NovelManager({ onNovelsChange }) {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [lang, setLang] = useState('EN')
  const [genre, setGenre] = useState('')
  const [styleNotes, setStyleNotes] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setLoading(true)
    getNovels()
      .then(setNovels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!title.trim()) return
    setCreating(true)
    try {
      const novel = await createNovel(title.trim(), url.trim() || null, lang, genre || null, styleNotes.trim() || null)
      setNovels((prev) => [...prev, novel])
      setTitle('')
      setUrl('')
      setGenre('')
      setStyleNotes('')
      onNovelsChange?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(novelId) {
    if (!window.confirm('ลบนิยายนี้? Glossary เฉพาะเรื่องนี้จะหายด้วย')) return
    try {
      await deleteNovel(novelId)
      setNovels((prev) => prev.filter((n) => n.id !== novelId))
      if (expandedId === novelId) setExpandedId(null)
      onNovelsChange?.()
    } catch (e) {
      setError(e.message)
    }
  }

  function handleStyleSaved(updated) {
    setNovels((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)))
    onNovelsChange?.()
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Create form */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-xs font-medium text-gray-500 mb-1">เพิ่มนิยายใหม่</p>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="ชื่อนิยาย *"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="EN">EN</option>
            <option value="CN">CN</option>
          </select>
        </div>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-600"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ลิงก์ต้นฉบับ (optional)"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <textarea
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          placeholder={STYLE_PLACEHOLDER}
          rows={2}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-white"
        />
        <button
          onClick={handleCreate}
          disabled={!title.trim() || creating}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors self-end"
        >
          {creating ? 'กำลังเพิ่ม...' : 'เพิ่มนิยาย'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <div className="text-sm text-gray-400">กำลังโหลด...</div>
      ) : novels.length === 0 ? (
        <div className="text-sm text-gray-400">
          ยังไม่มีนิยาย เพิ่มนิยายเพื่อจัดการ Glossary เฉพาะเรื่อง
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {novels.map((novel) => (
            <div key={novel.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">{novel.title}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {novel.lang}
                    </span>
                    {novel.genre && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {novel.genre}
                      </span>
                    )}
                  </div>
                  {novel.url && (
                    <a
                      href={novel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline truncate block mt-0.5"
                    >
                      {novel.url}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === novel.id ? null : novel.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 border border-indigo-200 rounded transition-colors flex-shrink-0"
                >
                  {expandedId === novel.id ? 'ซ่อน' : 'จัดการ'}
                </button>
                <button
                  onClick={() => handleDelete(novel.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 border border-red-200 rounded transition-colors flex-shrink-0"
                >
                  ลบ
                </button>
              </div>
              {expandedId === novel.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-4">
                  <NovelStyleEditor novel={novel} onSaved={handleStyleSaved} />
                  <div className="border-t border-gray-100 pt-3">
                    <NovelGlossary novel={novel} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
