import { useState, useRef } from 'react'
import { scrapeChapters, scrapeChapterText } from '../services/api'

export default function ChapterPicker({ onLoaded, onClose }) {
  const [url, setUrl] = useState('')
  const [siteTitle, setSiteTitle] = useState('')
  const [chapters, setChapters] = useState([])
  const [autoDetected, setAutoDetected] = useState(false)
  const [filter, setFilter] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingChapter, setLoadingChapter] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFetchList() {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoadingList(true)
    setError('')
    setChapters([])
    setSiteTitle('')
    try {
      const data = await scrapeChapters(trimmed)
      setChapters(data.chapters)
      setSiteTitle(data.site_title)
      setAutoDetected(data.auto_detected)
      if (data.total === 0) setError('ไม่พบลิงก์ในหน้านี้')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingList(false)
    }
  }

  async function handleLoadChapter(chapterUrl, chapterTitle) {
    setLoadingChapter(chapterUrl)
    setError('')
    try {
      const data = await scrapeChapterText(chapterUrl)
      onLoaded(data.text, chapterTitle || data.title)
      onClose()
    } catch (e) {
      setError(e.message)
      setLoadingChapter(null)
    }
  }

  const filtered = filter
    ? chapters.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()))
    : chapters

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">📚 ดึงบทจากเว็บ</h2>
            {siteTitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{siteTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* URL input */}
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetchList()}
              placeholder="https://เว็บนิยาย.com/novel/..."
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={handleFetchList}
              disabled={!url.trim() || loadingList}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {loadingList ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ดึง...
                </span>
              ) : 'ดึงรายการ'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}

          {chapters.length > 0 && !autoDetected && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1.5 rounded-lg">
              ⚠️ ตรวจไม่พบบทอัตโนมัติ — แสดงลิงก์ทั้งหมดในหน้า ลองหาบทที่ต้องการด้านล่าง
            </p>
          )}
        </div>

        {/* Chapter filter + list */}
        {chapters.length > 0 && (
          <>
            <div className="px-5 py-2.5 border-b border-gray-100 flex-shrink-0">
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="ค้นหาบท..."
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                {autoDetected ? '✓ ตรวจพบบทอัตโนมัติ' : 'ลิงก์ทั้งหมดในหน้า'} · {filtered.length} รายการ
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">ไม่พบผลการค้นหา</p>
              ) : (
                filtered.map(ch => (
                  <button
                    key={ch.url}
                    onClick={() => handleLoadChapter(ch.url, ch.title)}
                    disabled={!!loadingChapter}
                    className="w-full text-left px-5 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-3 group disabled:opacity-60"
                  >
                    {loadingChapter === ch.url ? (
                      <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 text-sm">→</span>
                    )}
                    <span className="text-sm text-gray-700 group-hover:text-indigo-700 truncate transition-colors">
                      {ch.title}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {chapters.length === 0 && !loadingList && !error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-4xl">🔗</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              วาง URL ของหน้า TOC (สารบัญ) หรือหน้าแรกของนิยาย<br />
              แล้วกด "ดึงรายการ" เพื่อดูรายการบท
            </p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              ใช้ได้กับเว็บที่โหลดด้วย HTML ปกติ<br />
              (ไม่รองรับเว็บที่ใช้ JS render หรือต้อง login)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
