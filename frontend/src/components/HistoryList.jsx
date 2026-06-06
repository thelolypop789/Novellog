import { useState, useEffect } from 'react'
import { getHistory, deleteHistory } from '../services/api'
import ReaderPage from './ReaderPage'

function exportToPDF(items, novels) {
  const novelMap = Object.fromEntries((novels || []).map(n => [n.id, n.title]))
  const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const rows = items.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    const novelName = item.novel_id ? (novelMap[item.novel_id] || '') : ''
    return `
      <div class="item">
        <div class="meta">
          <span class="lang">${item.source_lang} → TH</span>
          ${novelName ? `<span class="novel">📖 ${esc(novelName)}</span>` : ''}
          <span class="date">${date}</span>
        </div>
        <div class="original">${esc(item.original)}</div>
        <div class="arrow">↓</div>
        <div class="translated">${esc(item.translated)}</div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ประวัติการแปล — NovelLog</title>
  <style>
    body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #111; margin: 32px; max-width: 720px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 11px; color: #9ca3af; margin-bottom: 24px; }
    .item { border-bottom: 1px solid #e5e7eb; padding: 14px 0; page-break-inside: avoid; }
    .meta { display: flex; gap: 12px; margin-bottom: 6px; font-size: 11px; color: #6b7280; }
    .lang { font-weight: 700; color: #4f46e5; }
    .novel { color: #374151; }
    .original { color: #6b7280; white-space: pre-wrap; margin-bottom: 4px; }
    .arrow { color: #d1d5db; font-size: 11px; margin-bottom: 4px; }
    .translated { color: #111827; white-space: pre-wrap; line-height: 1.7; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>ประวัติการแปล — NovelLog</h1>
  <p class="subtitle">ส่งออกเมื่อ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} · ${items.length} รายการ</p>
  ${rows}
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

export default function HistoryList({ novels = [] }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readerContent, setReaderContent] = useState(null)
  const [filterNovelId, setFilterNovelId] = useState('all')
  const [selected, setSelected] = useState(new Set())   // ids checked for export/delete
  const [deleting, setDeleting] = useState(null)         // id currently being deleted

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

  async function handleDelete(id) {
    if (!window.confirm('ลบรายการนี้ออกจากประวัติ?')) return
    setDeleting(id)
    try {
      await deleteHistory(id)
      setHistory(prev => prev.filter(i => i.id !== id))
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleDeleteSelected() {
    if (!window.confirm(`ลบ ${selectedInView.length} รายการที่เลือก?`)) return
    for (const id of selectedInView) {
      try {
        await deleteHistory(id)
        setHistory(prev => prev.filter(i => i.id !== id))
        setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
      } catch { /* continue */ }
    }
  }

  const exportItems = someChecked
    ? filtered.filter(item => selected.has(item.id))
    : filtered

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Novel filter */}
        <select
          value={filterNovelId}
          onChange={e => { setFilterNovelId(e.target.value); setSelected(new Set()) }}
          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">📋 ทั้งหมด ({history.length})</option>
          {novels.map(n => {
            const count = history.filter(h => h.novel_id === n.id).length
            return <option key={n.id} value={n.id}>📖 {n.title} ({count})</option>
          })}
        </select>

        {/* Select all toggle */}
        {filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 border border-gray-200 rounded-lg transition-colors"
          >
            {allChecked ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        )}

        {/* Selected count badge */}
        {someChecked && (
          <span className="text-xs text-indigo-600 font-medium">
            เลือก {selectedInView.length} รายการ
          </span>
        )}

        <div className="ml-auto flex gap-2">
          {/* Delete selected */}
          {someChecked && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              🗑️ ลบที่เลือก ({selectedInView.length})
            </button>
          )}

          {/* PDF export */}
          <button
            onClick={() => exportToPDF(exportItems, novels)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            📄 ส่งออก PDF {someChecked ? `(${selectedInView.length} ที่เลือก)` : `(${filtered.length})`}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">ไม่มีประวัติสำหรับนิยายที่เลือก</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const novelTitle = item.novel_id ? novelMap[item.novel_id] : null
            const isChecked = selected.has(item.id)
            return (
              <div
                key={item.id}
                className={`border rounded-xl transition-colors group overflow-hidden flex
                  ${isChecked
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50'}`}
              >
                {/* Checkbox column */}
                <div className="flex items-center px-3 flex-shrink-0">
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

                  {/* Action bar */}
                  <div className="flex border-t border-gray-100 group-hover:border-indigo-100 transition-colors">
                    <button
                      onClick={() => setReaderContent(item.translated)}
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
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="flex items-center justify-center gap-1 px-4 py-2 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deleting === item.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {readerContent && (
        <ReaderPage content={readerContent} onClose={() => setReaderContent(null)} />
      )}
    </>
  )
}
