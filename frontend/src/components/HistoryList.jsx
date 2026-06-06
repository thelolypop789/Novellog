import { useState, useEffect } from 'react'
import { getHistory } from '../services/api'
import ReaderPage from './ReaderPage'

function exportToPDF(items, novels) {
  const novelMap = Object.fromEntries((novels || []).map(n => [n.id, n.title]))

  const rows = items.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    const novelName = item.novel_id ? (novelMap[item.novel_id] || '') : ''
    const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
  const [filterNovelId, setFilterNovelId] = useState('all')   // 'all' | novel.id

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

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filterNovelId}
          onChange={e => setFilterNovelId(e.target.value)}
          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">📋 ทั้งหมด ({history.length})</option>
          {novels.map(n => {
            const count = history.filter(h => h.novel_id === n.id).length
            return <option key={n.id} value={n.id}>📖 {n.title} ({count})</option>
          })}
        </select>

        <button
          onClick={() => exportToPDF(filtered, novels)}
          disabled={filtered.length === 0}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          📄 ส่งออก PDF ({filtered.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">ไม่มีประวัติสำหรับนิยายที่เลือก</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const novelTitle = item.novel_id ? novelMap[item.novel_id] : null
            return (
              <div
                key={item.id}
                className="border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-colors group overflow-hidden"
              >
                {/* Card body */}
                <div className="p-3">
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
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-indigo-600 hover:bg-indigo-100 transition-colors font-medium"
                  >
                    📖 อ่านผล
                  </button>
                  <div className="w-px bg-gray-100 group-hover:bg-indigo-100 transition-colors" />
                  <button
                    onClick={() => navigator.clipboard.writeText(item.translated)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    📋 คัดลอก
                  </button>
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
