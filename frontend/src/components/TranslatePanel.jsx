import { useState } from 'react'
import LanguageSelector from './LanguageSelector'
import { translate, saveHistory } from '../services/api'

export default function TranslatePanel({ onCreditUsed, novels = [] }) {
  const [lang, setLang] = useState('EN')
  const [selectedNovelId, setSelectedNovelId] = useState(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chunks, setChunks] = useState(0)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const filteredNovels = novels.filter((n) => n.lang === lang)

  function handleLangChange(l) {
    setLang(l)
    setSaved(false)
    setSelectedNovelId(null)
  }

  async function handleTranslate() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setSaved(false)
    setCreditsUsed(0)
    try {
      const data = await translate(input, lang, selectedNovelId)
      setOutput(data.translated)
      setChunks(data.chunks)
      setCreditsUsed(data.credits_used)
      onCreditUsed?.()
      // Auto-save — credits already spent
      saveHistory(lang, input, data.translated).catch(() => {})
      setSaved(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleTranslate()
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Input side */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <LanguageSelector value={lang} onChange={handleLangChange} />
          {filteredNovels.length > 0 && (
            <select
              value={selectedNovelId ?? ''}
              onChange={(e) => setSelectedNovelId(e.target.value || null)}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600 max-w-[200px] truncate"
            >
              <option value="">— ไม่เลือกนิยาย —</option>
              {filteredNovels.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="วางข้อความที่ต้องการแปลที่นี่... (Ctrl+Enter เพื่อแปล)"
          className="flex-1 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">{input.length.toLocaleString()} ตัวอักษร</span>
          <button
            onClick={handleTranslate}
            disabled={loading || !input.trim()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังแปล...' : 'แปล'}
          </button>
        </div>
      </div>

      {/* Output side */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between h-[34px]">
          <span className="text-xs text-gray-400">
            {chunks > 0 && `${chunks} chunk${chunks > 1 ? 's' : ''}`}
            {creditsUsed > 0 && ` · ใช้ ${creditsUsed} credit`}
          </span>
          {error && <span className="text-xs text-red-500 truncate ml-2">{error}</span>}
        </div>
        <div className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {loading ? (
            <span className="text-gray-400 animate-pulse">กำลังแปล...</span>
          ) : output ? (
            output
          ) : (
            <span className="text-gray-300">ผลการแปลจะแสดงที่นี่</span>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          {saved && (
            <span className="text-xs text-green-600 px-2">บันทึกแล้ว ✓</span>
          )}
          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
          </button>
        </div>
      </div>
    </div>
  )
}
