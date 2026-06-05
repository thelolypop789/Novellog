import { useState, useEffect } from 'react'
import { translate, saveHistory, getHistory } from '../services/api'

function StepIndicator({ step }) {
  const steps = ['ใส่ข้อความ', 'AI แปล', 'ผลลัพธ์']
  return (
    <div className="flex items-center justify-center gap-0 mb-5 select-none">
      {steps.map((label, i) => {
        const num = i + 1
        const isDone = num < step
        const isActive = num === step
        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : isDone ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-400'}`}
              >
                {isDone ? '✓' : num}
              </div>
              <span className={`text-xs font-medium transition-colors hidden sm:block
                ${isActive ? 'text-indigo-700' : isDone ? 'text-indigo-400' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 sm:w-10 h-px mx-1.5 sm:mx-2 transition-colors ${isDone ? 'bg-indigo-300' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function TranslatePanel({
  lang, novelId, genre, novels = [],
  onLangChange, onNovelChange,
  onCreditUsed, historyRefresh, onOpenReader,
}) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [recentHistory, setRecentHistory] = useState([])

  const step = output ? 3 : loading ? 2 : 1
  const filteredNovels = novels.filter(n => n.lang === lang)

  useEffect(() => {
    getHistory().then(items => setRecentHistory(items.slice(0, 3))).catch(() => {})
  }, [historyRefresh])

  function handleLangChange(l) {
    onLangChange?.(l)
    onNovelChange?.(null)
  }

  async function handleTranslate() {
    if (!input.trim() || loading) return
    setLoading(true)
    setError('')
    setOutput('')
    setCreditsUsed(0)
    try {
      const data = await translate(input, lang, novelId, genre || null)
      setOutput(data.translated)
      setCreditsUsed(data.credits_used)
      onCreditUsed?.()
      saveHistory(lang, input, data.translated).catch(() => {})
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleTranslate()
  }

  const creditsNeeded = Math.ceil(input.length / 1000)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <StepIndicator step={step} />

      {/* Settings bar — mobile + tablet (hidden on desktop where right panel handles it) */}
      <div className="flex items-center gap-2 flex-wrap lg:hidden">
        <div className="flex gap-1">
          {['EN', 'CN'].map(l => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${lang === l ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {l} → TH
            </button>
          ))}
        </div>
        {filteredNovels.length > 0 && (
          <select
            value={novelId ?? ''}
            onChange={e => onNovelChange?.(e.target.value || null)}
            className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">— ไม่เลือกนิยาย —</option>
            {filteredNovels.map(n => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Text areas */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Input */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">
              ต้นฉบับ ({lang === 'EN' ? 'English' : 'Chinese'})
            </span>
            <span className="text-xs text-gray-400">{input.length.toLocaleString()} ตัวอักษร</span>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`วางข้อความ${lang === 'EN' ? 'ภาษาอังกฤษ' : 'ภาษาจีน'}ที่นี่...\n(Ctrl+Enter เพื่อแปล)`}
            className="h-[200px] md:h-[260px] lg:h-[320px] p-4 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono leading-relaxed bg-white overflow-y-auto"
          />
        </div>

        {/* Divider */}
        <div className="hidden md:flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium flex-shrink-0">
            ⇄
          </div>
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">ผลลัพธ์ (ภาษาไทย)</span>
            {creditsUsed > 0 && (
              <span className="text-xs text-indigo-500 font-medium">ใช้ {creditsUsed} credit</span>
            )}
          </div>
          <div className="h-[200px] md:h-[260px] lg:h-[320px] p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                  <span className="text-sm text-gray-400">กำลังแปล...</span>
                </div>
              </div>
            ) : output ? (
              output
            ) : (
              <span className="text-gray-300">ผลการแปลจะแสดงที่นี่</span>
            )}
          </div>
          {output && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onOpenReader?.(output)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
              >
                📖 อ่านผล
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Translate button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !input.trim()}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-base font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            กำลังแปล...
          </>
        ) : (
          <>
            แปลเลย ✨
            {input.trim() && (
              <span className="text-sm font-normal opacity-70">
                ({creditsNeeded} credit)
              </span>
            )}
          </>
        )}
      </button>

      {/* Recent history */}
      {recentHistory.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">ประวัติล่าสุด</p>
          <div className="flex flex-col gap-1.5">
            {recentHistory.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setInput(item.original)
                  setOutput(item.translated)
                  setCreditsUsed(0)
                  setError('')
                }}
                className="text-left px-3 py-2.5 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 group-hover:bg-indigo-100 px-1.5 py-0.5 rounded-full transition-colors">
                    {item.source_lang} → TH
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{item.original}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
