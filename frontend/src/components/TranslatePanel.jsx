import { useState } from 'react'
import LanguageSelector from './LanguageSelector'
import { translate, saveHistory } from '../services/api'

export default function TranslatePanel({ onCreditUsed }) {
  const [lang, setLang] = useState('EN')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chunks, setChunks] = useState(0)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleTranslate() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setSaved(false)
    setCreditsUsed(0)
    try {
      const data = await translate(input, lang)
      setOutput(data.translated)
      setChunks(data.chunks)
      setCreditsUsed(data.credits_used)
      onCreditUsed?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!output) return
    try {
      await saveHistory(lang, input, output)
      setSaved(true)
    } catch (e) {
      setError(e.message)
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
        <LanguageSelector value={lang} onChange={(l) => { setLang(l); setSaved(false) }} />
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
          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
          </button>
          <button
            onClick={handleSave}
            disabled={!output || saved}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
