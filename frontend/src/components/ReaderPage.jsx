import { useState } from 'react'

export default function ReaderPage({ content, onClose }) {
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState('base')

  const paragraphs = content.split('\n').filter(p => p.trim())

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fontSizeClass = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-loose',
    lg: 'text-xl leading-loose',
  }[fontSize]

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 flex-shrink-0 bg-white">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          กลับ
        </button>

        <span className="flex-1 text-sm font-semibold text-gray-700 truncate">ผลการแปล</span>

        {/* Font size toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          {[
            { key: 'sm', label: 'A' },
            { key: 'base', label: 'A' },
            { key: 'lg', label: 'A' },
          ].map(({ key, label }, i) => (
            <button
              key={key}
              onClick={() => setFontSize(key)}
              className={`px-2 py-1.5 transition-colors
                ${i === 0 ? 'text-xs' : i === 1 ? 'text-sm' : 'text-base'}
                ${fontSize === key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}
        </button>
      </header>

      {/* Reading content */}
      <div className="flex-1 overflow-y-auto bg-amber-50">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={`text-gray-800 mb-5 ${fontSizeClass}`}
              style={{ fontFamily: '"Sarabun", "Noto Sans Thai", sans-serif' }}
            >
              {para}
            </p>
          ))}
          <div className="h-16" />
        </div>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <span className="text-xs text-gray-400">{paragraphs.length} ย่อหน้า · {content.length.toLocaleString()} ตัวอักษร</span>
        <button
          onClick={onClose}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← กลับแปล
        </button>
      </div>
    </div>
  )
}
