import { useState } from 'react'
import { extractNames, addGlossary } from '../services/api'

export default function NameExtractor({ novel, onAdded, onCreditUsed }) {
  const [text, setText] = useState('')
  const [names, setNames] = useState(null)   // null = ยังไม่ได้ extract
  const [checked, setChecked] = useState({}) // source_word → bool
  const [edited, setEdited] = useState({})   // source_word → thai (editable)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [creditsUsed, setCreditsUsed] = useState(0)

  async function handleExtract() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setNames(null)
    try {
      const result = await extractNames(text.trim(), novel.lang)
      setNames(result.names)
      setCreditsUsed(result.credits_used)
      onCreditUsed?.()
      // Pre-check ทั้งหมด + ใส่ค่า default ที่แก้ได้
      const initChecked = {}
      const initEdited = {}
      result.names.forEach((n) => {
        initChecked[n.source_word] = true
        initEdited[n.source_word] = n.suggested_thai
      })
      setChecked(initChecked)
      setEdited(initEdited)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    const toAdd = (names ?? []).filter((n) => checked[n.source_word])
    if (!toAdd.length) return
    setAdding(true)
    setError('')
    try {
      for (const n of toAdd) {
        await addGlossary(n.source_word, edited[n.source_word], novel.lang, novel.id)
      }
      onAdded?.()
      // Reset
      setNames(null)
      setText('')
      setChecked({})
      setEdited({})
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  const selectedCount = Object.values(checked).filter(Boolean).length

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">
        วาง source text แล้วให้ AI ดึงชื่อมาให้ — ตรวจแล้ว approve ก่อน add glossary
      </p>

      {names === null ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`วางข้อความ${novel.lang === 'EN' ? 'ภาษาอังกฤษ' : 'ภาษาจีน'}ที่ต้องการดึงชื่อ...`}
            rows={4}
            className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none mb-2"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtract}
              disabled={!text.trim() || loading}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'กำลังวิเคราะห์...' : 'ตรวจหาชื่อ'}
            </button>
            <span className="text-xs text-gray-400">
              ใช้ {Math.max(1, Math.ceil(text.length / 1000))} credit
            </span>
          </div>
        </>
      ) : names.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            ไม่พบชื่อเฉพาะในข้อความนี้ (ใช้ {creditsUsed} credit)
          </p>
          <button
            onClick={() => setNames(null)}
            className="text-xs text-indigo-600 hover:underline self-start"
          >
            ลองใหม่
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 mb-1">
            พบ {names.length} ชื่อ — ติ๊กที่ต้องการ แก้ภาษาไทยได้เลย แล้วกด "เพิ่มที่เลือก"
          </p>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {names.map((n) => (
              <div key={n.source_word} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded text-xs">
                <input
                  type="checkbox"
                  checked={!!checked[n.source_word]}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [n.source_word]: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 accent-indigo-600 flex-shrink-0"
                />
                <span className="text-[9px] text-gray-400 flex-shrink-0 w-5 text-center">{n.type === 'term' ? '📚' : '👤'}</span>
                <span className="text-gray-700 w-20 sm:w-24 truncate flex-shrink-0">{n.source_word}</span>
                <span className="text-gray-300 flex-shrink-0">→</span>
                <input
                  value={edited[n.source_word] ?? n.suggested_thai}
                  onChange={(e) =>
                    setEdited((prev) => ({ ...prev, [n.source_word]: e.target.value }))
                  }
                  className="flex-1 px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-0"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button
              onClick={handleAdd}
              disabled={selectedCount === 0 || adding}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {adding ? 'กำลังเพิ่ม...' : `เพิ่มที่เลือก (${selectedCount} รายการ)`}
            </button>
            <button
              onClick={() => setNames(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ยกเลิก
            </button>
            <span className="text-xs text-gray-400 sm:ml-auto">ใช้ {creditsUsed} credit</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
