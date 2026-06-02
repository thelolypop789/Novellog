import { useState, useEffect } from 'react'
import { getHistory } from '../services/api'

export default function HistoryList({ onSelect }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <div className="flex flex-col gap-2">
      {history.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect?.(item)}
          className="text-left p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
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
      ))}
    </div>
  )
}
