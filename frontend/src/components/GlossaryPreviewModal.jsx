import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { extractNames, getGlossary, addGlossary } from '../services/api'

export default function GlossaryPreviewModal({ text, lang, novelId, onProceed, onCreditUsed }) {
  const [phase, setPhase] = useState('loading')   // loading | preview | adding
  const [names, setNames] = useState([])
  const [glossaryMap, setGlossaryMap] = useState({})
  const [checked, setChecked] = useState({})
  const [edited, setEdited] = useState({})
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [glossaryData, namesData] = await Promise.all([
          getGlossary(lang, novelId || null),
          extractNames(text, lang),
        ])
        onCreditUsed?.()
        setCreditsUsed(namesData.credits_used)

        const gMap = Object.fromEntries(glossaryData.map(g => [g.source_word, g.target_word]))
        setGlossaryMap(gMap)
        setNames(namesData.names)

        const initChecked = {}
        const initEdited = {}
        namesData.names.forEach(n => {
          const isNew = !(n.source_word in gMap)
          initChecked[n.source_word] = isNew
          initEdited[n.source_word] = isNew ? n.suggested_thai : gMap[n.source_word]
        })
        setChecked(initChecked)
        setEdited(initEdited)
      } catch (e) {
        setError(e.message)
      } finally {
        setPhase('preview')
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const newTerms = names.filter(n => !(n.source_word in glossaryMap))
  const existingTerms = names.filter(n => n.source_word in glossaryMap)
  const selectedCount = newTerms.filter(n => checked[n.source_word]).length

  async function handleAddAndProceed() {
    setPhase('adding')
    const toAdd = newTerms.filter(n => checked[n.source_word])
    for (const n of toAdd) {
      try {
        await addGlossary(n.source_word, edited[n.source_word] || n.suggested_thai, lang, novelId || null)
      } catch { /* continue on partial failure */ }
    }
    onProceed()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">🔍 ตรวจคำเฉพาะก่อนแปล</h2>
            {creditsUsed > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">ใช้ {creditsUsed} credit ในการวิเคราะห์</p>
            )}
          </div>
          <button
            onClick={onProceed}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {phase === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">กำลังวิเคราะห์คำเฉพาะ...</p>
            </div>
          ) : (
            <div className="px-5 py-3">
              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
              )}

              {names.length === 0 && !error ? (
                <p className="text-sm text-gray-400 py-6 text-center">ไม่พบคำเฉพาะในข้อความนี้</p>
              ) : (
                <>
                  {/* New terms */}
                  {newTerms.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-indigo-600 mb-2 flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">✨</span>
                        คำใหม่ — ยังไม่มีใน Glossary ({newTerms.length} คำ)
                      </p>
                      <div className="flex flex-col gap-1">
                        {newTerms.map(n => (
                          <div
                            key={n.source_word}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors
                              ${checked[n.source_word] ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checked[n.source_word]}
                              onChange={e => setChecked(prev => ({ ...prev, [n.source_word]: e.target.checked }))}
                              className="w-3.5 h-3.5 accent-indigo-600 flex-shrink-0 cursor-pointer"
                            />
                            <span className="text-gray-700 w-28 truncate flex-shrink-0 font-medium">{n.source_word}</span>
                            <span className="text-gray-300 flex-shrink-0">→</span>
                            <input
                              value={edited[n.source_word] ?? ''}
                              onChange={e => setEdited(prev => ({ ...prev, [n.source_word]: e.target.value }))}
                              disabled={!checked[n.source_word]}
                              className="flex-1 min-w-0 px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-50 disabled:bg-gray-50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Already in glossary */}
                  {existingTerms.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                        <span className="text-green-500">✓</span>
                        มีใน Glossary แล้ว ({existingTerms.length} คำ)
                      </p>
                      <div className="flex flex-col gap-1">
                        {existingTerms.map(n => (
                          <div key={n.source_word} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50/60 rounded-lg text-xs opacity-60">
                            <span className="w-3.5 text-green-500 flex-shrink-0">✓</span>
                            <span className="text-gray-600 w-28 truncate flex-shrink-0">{n.source_word}</span>
                            <span className="text-gray-300 flex-shrink-0">→</span>
                            <span className="text-gray-500 flex-1 truncate">{glossaryMap[n.source_word]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase !== 'loading' && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <button
              onClick={onProceed}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              ข้ามขั้นตอนนี้
            </button>
            <button
              onClick={handleAddAndProceed}
              disabled={phase === 'adding'}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {phase === 'adding'
                ? 'กำลังบันทึก...'
                : selectedCount > 0
                  ? `เพิ่ม ${selectedCount} คำ แล้วแปล`
                  : 'แปลเลย'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
