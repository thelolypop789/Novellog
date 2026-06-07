import { useState, useEffect } from 'react'
import { getHistory, deleteHistory } from '../services/api'
import ReaderPage from './ReaderPage'

export default function HistoryList({ novels = [] }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readerContent, setReaderContent] = useState(null)
  const [readerTitle, setReaderTitle] = useState('')
  const [filterNovelId, setFilterNovelId] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [confirmId, setConfirmId] = useState(null)    // id waiting for inline confirm
  const [deleting, setDeleting] = useState(false)     // batch delete in progress
  const [deleteError, setDeleteError] = useState('')  // inline error message
  const [confirmBatch, setConfirmBatch] = useState(false)  // batch delete confirm

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-400 py-4">กำลังโหลด...</div>
  if (error) return <div className="text-sm text-red-400 py-4">{error}</div>
  if (!history.length) return <div className="text-sm text-gray-400 py-4">ยังไม่มีประวัติการแปล</div>

  const novelMap = Object.fromEntries(novels.map(n => [n.id, n.title]))

  const filtered = filterNovelId === 'all'
    ? history
    : history.filter(item => item.novel_id === filterNovelId)

  const filteredIds = filtered.map(i => i.id)
  const allChecked = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))
  const someChecked = filteredIds.some(id => selected.has(id))
  const selectedInView = filteredIds.filter(id => selected.has(id))

  function toggleItem(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allChecked) {
      setSelected(prev => { const next = new Set(prev); filteredIds.forEach(id => next.delete(id)); return next })
    } else {
      setSelected(prev => new Set([...prev, ...filteredIds]))
    }
  }

  async function doDelete(id) {
    setDeleteError('')
    try {
      await deleteHistory(id)
      setHistory(prev => prev.filter(i => i.id !== id))
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setConfirmId(null)
    }
  }

  async function doDeleteBatch() {
    setDeleting(true)
    setDeleteError('')
    setConfirmBatch(false)
    for (const id of selectedInView) {
      try {
        await deleteHistory(id)
        setHistory(prev => prev.filter(i => i.id !== id))
        setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
      } catch { /* continue on partial failure */ }
    }
    setDeleting(false)
  }

  const exportItems = someChecked
    ? filtered.filter(item => selected.has(item.id))
    : filtered

  function openInReader(items) {
    if (!items.length) return
    const sections = items.map(item => {
      const date = new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
      const novelName = item.novel_id ? novelMap[item.novel_id] : ''
      const meta = [date, item.source_lang + ' → TH', novelName].filter(Boolean).join(' · ')
      return `── ${meta} ──\n\n${item.translated}`
    })
    const content = sections.join('\n\n' + '─'.repeat(32) + '\n\n')
    const title = items.length === 1
      ? new Date(items[0].created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
      : `${items.length} ตอนที่เลือก`
    setReaderTitle(title)
    setReaderContent(content)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filterNovelId}
          onChange={e => { setFilterNovelId(e.target.value); setSelected(new Set()); setConfirmId(null); setConfirmBatch(false) }}
          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">📋 ทั้งหมด ({history.length})</option>
          {novels.map(n => {
            const count = history.filter(h => h.novel_id === n.id).length
            return <option key={n.id} value={n.id}>📖 {n.title} ({count})</option>
          })}
        </select>

        {filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 border border-gray-200 rounded-lg transition-colors"
          >
            {allChecked ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        )}

        {someChecked && (
          <span className="text-xs text-indigo-600 font-medium">เลือก {selectedInView.length} รายการ</span>
        )}

        <div className="ml-auto flex gap-2 flex-wrap justify-end">
          {someChecked && (
            confirmBatch ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                <span className="text-xs text-red-600">ลบ {selectedInView.length} รายการ?</span>
                <button onClick={doDeleteBatch} disabled={deleting} className="text-xs font-medium text-red-600 hover:text-red-800 px-1.5 py-0.5 bg-red-100 rounded transition-colors">
                  {deleting ? 'กำลังลบ...' : 'ยืนยัน'}
                </button>
                <button onClick={() => setConfirmBatch(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded transition-colors">
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmBatch(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                🗑️ ลบที่เลือก ({selectedInView.length})
              </button>
            )
          )}

          <button
            onClick={() => openInReader(exportItems)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            📄 ส่งออก {someChecked ? `(${selectedInView.length} ตอน)` : `(${filtered.length} ตอน)`}
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="mb-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {deleteError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">ไม่มีประวัติสำหรับนิยายที่เลือก</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const novelTitle = item.novel_id ? novelMap[item.novel_id] : null
            const isChecked = selected.has(item.id)
            const isPendingDelete = confirmId === item.id

            return (
              <div
                key={item.id}
                className={`border rounded-xl transition-colors group overflow-hidden flex
                  ${isPendingDelete
                    ? 'border-red-300 bg-red-50'
                    : isChecked
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50'}`}
              >
                {/* Checkbox */}
                <div className="flex items-start pt-3 px-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300 cursor-pointer"
                  />
                </div>

                {/* Card content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="p-3 pb-2">
                    <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors">
                          {item.source_lang} → TH
                        </span>
                        {novelTitle && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            {novelTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.original}</p>
                    <p className="text-xs text-gray-700 truncate mt-0.5">{item.translated}</p>
                  </div>

                  {/* Inline delete confirm */}
                  {isPendingDelete && (
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <span className="text-xs text-red-600">ลบรายการนี้?</span>
                      <button
                        onClick={() => doDelete(item.id)}
                        className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        ยืนยันลบ
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 border border-gray-200 rounded-lg transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex border-t border-gray-100 group-hover:border-indigo-100 transition-colors mt-auto">
                    <button
                      onClick={() => {
                        const date = new Date(item.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
                        setReaderTitle(date)
                        setReaderContent(item.translated)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-indigo-600 hover:bg-indigo-100 transition-colors font-medium"
                    >
                      📖 อ่านผล
                    </button>
                    <div className="w-px bg-gray-100 group-hover:bg-indigo-100 transition-colors" />
                    <button
                      onClick={() => navigator.clipboard.writeText(item.translated)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      📋 คัดลอก
                    </button>
                    <div className="w-px bg-gray-100 group-hover:bg-indigo-100 transition-colors" />
                    <button
                      onClick={() => setConfirmId(isPendingDelete ? null : item.id)}
                      className={`flex items-center justify-center gap-1 px-4 py-2 text-xs transition-colors
                        ${isPendingDelete
                          ? 'bg-red-100 text-red-600'
                          : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {readerContent && (
        <ReaderPage content={readerContent} title={readerTitle} onClose={() => setReaderContent(null)} />
      )}
    </>
  )
}
