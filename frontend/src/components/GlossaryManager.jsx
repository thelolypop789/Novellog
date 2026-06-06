import { useState, useEffect } from 'react'
import { getGlossary, addGlossary, deleteGlossary } from '../services/api'

export default function GlossaryManager({ novels = [] }) {
  const [lang, setLang] = useState('EN')
  const [novelId, setNovelId] = useState(null)   // null = global
  const [items, setItems] = useState([])
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState('')
  const [editingWord, setEditingWord] = useState(null)
  const [editingValue, setEditingValue] = useState('')

  const filteredNovels = novels.filter(n => n.lang === lang)

  useEffect(() => {
    // When lang changes, reset novel selection if current novel doesn't match lang
    setNovelId(prev => {
      const still = filteredNovels.find(n => n.id === prev)
      return still ? prev : null
    })
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true)
    setError('')
    const fetchFn = novelId
      ? getGlossary(lang, novelId)   // novel-specific only
      : getGlossary(lang)            // global
    fetchFn
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang, novelId])

  async function handleAdd() {
    if (!source.trim() || !target.trim()) return
    try {
      await addGlossary(source.trim(), target.trim(), lang, novelId)
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
      await deleteGlossary(lang, sourceWord, novelId)
      setItems((prev) => prev.filter((i) => i.source_word !== sourceWord))
    } catch (e) {
      setError(e.message)
    }
  }

  function startEdit(item) {
    setEditingWord(item.source_word)
    setEditingValue(item.target_word)
  }

  async function handleSaveEdit(sourceWord) {
    if (!editingValue.trim()) return
    try {
      await addGlossary(sourceWord, editingValue.trim(), lang, novelId)
      setItems(prev => prev.map(i => i.source_word === sourceWord ? { ...i, target_word: editingValue.trim() } : i))
      setEditingWord(null)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleBulkImport() {
    const pairs = bulkText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('='))
      .map(line => {
        const idx = line.indexOf('=')
        return { src: line.slice(0, idx).trim(), tgt: line.slice(idx + 1).trim() }
      })
      .filter(p => p.src && p.tgt)

    if (!pairs.length) {
      setBulkResult('ไม่พบรายการที่ถูกต้อง (format: ต้นฉบับ=ภาษาไทย)')
      return
    }

    setBulkLoading(true)
    setBulkResult('')
    let added = 0
    let failed = 0
    for (const { src, tgt } of pairs) {
      try {
        await addGlossary(src, tgt, lang, novelId)
        setItems(prev => {
          const exists = prev.find(i => i.source_word === src)
          if (exists) return prev.map(i => i.source_word === src ? { ...i, target_word: tgt } : i)
          return [...prev, { source_word: src, target_word: tgt }]
        })
        added++
      } catch {
        failed++
      }
    }
    setBulkLoading(false)
    setBulkResult(`เพิ่มแล้ว ${added} รายการ${failed ? ` (ล้มเหลว ${failed})` : ''}`)
    if (!failed) { setBulkText(''); setShowBulk(false) }
  }

  const selectedNovelTitle = novelId ? filteredNovels.find(n => n.id === novelId)?.title : null

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* Lang + Novel selector */}
      <div className="flex flex-col gap-2">
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

        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-400 flex-shrink-0">ขอบเขต:</span>
          <select
            value={novelId ?? ''}
            onChange={e => setNovelId(e.target.value || null)}
            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">🌐 Global (ทุกนิยาย)</option>
            {filteredNovels.map(n => (
              <option key={n.id} value={n.id}>📖 {n.title}</option>
            ))}
          </select>
        </div>

        {novelId && (
          <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
            แสดง Glossary เฉพาะ "{selectedNovelTitle}" — ไม่รวม Global
          </p>
        )}
      </div>

      {/* Add form */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ต้นฉบับ (เช่น Leon)"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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

      {/* Bulk import */}
      <div>
        <button
          onClick={() => { setShowBulk(v => !v); setBulkResult('') }}
          className="text-xs text-indigo-600 hover:text-indigo-800 underline"
        >
          {showBulk ? '▲ ซ่อนนำเข้าหลายรายการ' : '▼ นำเข้าหลายรายการพร้อมกัน'}
        </button>

        {showBulk && (
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              วางในรูปแบบ <code className="bg-gray-100 px-1 rounded">ต้นฉบับ=ภาษาไทย</code> หนึ่งรายการต่อบรรทัด
              {novelId && <span className="text-indigo-600"> · จะเพิ่มใน "{selectedNovelTitle}"</span>}
            </p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"Mo Hua=โม่ฮว่า\nFormation=ค่ายกล\nGolden Core=ขั้นแก่นทอง"}
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkImport}
                disabled={bulkLoading || !bulkText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {bulkLoading ? 'กำลังเพิ่ม...' : 'นำเข้าทั้งหมด'}
              </button>
              {bulkResult && <span className="text-xs text-green-600">{bulkResult}</span>}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-400">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-400">
          {novelId ? `ยังไม่มี Glossary เฉพาะเรื่อง "${selectedNovelTitle}"` : `ยังไม่มี Global Glossary สำหรับ ${lang}`}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const isEditing = editingWord === item.source_word
            return (
              <div
                key={item.source_word}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isEditing ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}
              >
                <span className="text-gray-700 w-24 sm:w-32 truncate flex-shrink-0 font-medium">{item.source_word}</span>
                <span className="text-gray-300 flex-shrink-0">→</span>
                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(item.source_word)
                        if (e.key === 'Escape') setEditingWord(null)
                      }}
                      className="flex-1 px-2 py-0.5 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => handleSaveEdit(item.source_word)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex-shrink-0 px-1"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setEditingWord(null)}
                      className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0 px-1"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-700 flex-1 truncate">{item.target_word}</span>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-indigo-400 hover:text-indigo-600 text-xs px-1 transition-colors flex-shrink-0"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item.source_word)}
                      className="text-red-400 hover:text-red-600 text-xs px-1 transition-colors flex-shrink-0"
                    >
                      ลบ
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
