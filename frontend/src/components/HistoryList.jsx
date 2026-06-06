import { useState, useEffect } from 'react'
import { getHistory } from '../services/api'
import ReaderPage from './ReaderPage'

export default function HistoryList({ onSelect }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readerContent, setReaderContent] = useState(null)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-gray-400 py-4">กำลังโหลด...</div>
  if (error) return <div className="text-sm text-red-400 py-4">{error}</div>
  if (!history.length) return <div className="text-sm text-gray-400 py-4">ยังไม่มีประวัติการแปล</div>

  return (
    <>
      <div className="flex flex-col gap-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-colors group overflow-hidden"
          >
            {/* Card body — คลิกเพื่อ select */}
            <button
              onClick={() => onSelect?.(item)}
              className="w-full text-left p-3 block"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors">
                  {item.source_lang} → TH
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{item.original}</p>
              <p className="text-xs text-gray-700 truncate mt-0.5">{item.translated}</p>
            </button>

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
        ))}
      </div>

      {readerContent && (
        <ReaderPage content={readerContent} onClose={() => setReaderContent(null)} />
      )}
    </>
  )
}
