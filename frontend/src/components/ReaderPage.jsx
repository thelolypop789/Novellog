import { useState } from 'react'

const DIVIDER = '─'.repeat(32)

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseContent(content) {
  if (!content.includes(DIVIDER)) {
    return [{ header: null, paragraphs: content.split('\n').filter(p => p.trim()) }]
  }
  return content.split('\n\n' + DIVIDER + '\n\n').map(part => {
    const lines = part.split('\n')
    const first = lines[0].trim()
    if (first.startsWith('──') && first.endsWith('──')) {
      const header = first.replace(/^──\s*/, '').replace(/\s*──$/, '')
      const body = lines.slice(2).join('\n')
      return { header, paragraphs: body.split('\n').filter(p => p.trim()) }
    }
    return { header: null, paragraphs: part.split('\n').filter(p => p.trim()) }
  })
}

function exportToPDF(sections, title) {
  const sectionsHTML = sections.map((s, i) => {
    const pageBreakStyle = i < sections.length - 1
      ? ' style="break-after:page;page-break-after:always"'
      : ''
    const headerHTML = s.header
      ? `<div class="meta">${escapeHTML(s.header)}</div>`
      : ''
    const parasHTML = s.paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('\n')
    return `<div class="sec"${pageBreakStyle}>\n${headerHTML}\n${parasHTML}\n</div>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>${escapeHTML(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,500;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#fffbeb;font-family:'Sarabun','Noto Sans Thai',sans-serif;color:#1f2937}
  .wrap{max-width:42rem;margin:0 auto;padding:2.5rem 2rem}
  h1{font-size:1.1rem;font-weight:600;color:#374151;margin-bottom:2rem;padding-bottom:.75rem;border-bottom:2px solid #fcd34d}
  .sec{margin-bottom:1.5rem}
  .meta{font-size:.8rem;color:#92400e;font-weight:500;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid #fde68a}
  p{font-size:1.1rem;line-height:1.9;margin-bottom:1.1rem}
  @media print{
    body{background:#fffbeb!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
</style>
</head>
<body>
<div class="wrap">
<h1>${escapeHTML(title)}</h1>
${sectionsHTML}
</div>
<script>
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){window.print()})}
else{setTimeout(function(){window.print()},1200)}
</script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('เปิดหน้าต่างใหม่ไม่ได้ กรุณาอนุญาตป๊อปอัปในเบราว์เซอร์แล้วลองใหม่')
    return
  }
  w.document.write(html)
  w.document.close()
}

export default function ReaderPage({ content, onClose, title = 'ผลการแปล' }) {
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState('base')

  const sections = parseContent(content)
  const totalParagraphs = sections.reduce((sum, s) => sum + s.paragraphs.length, 0)

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

        <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{title}</span>

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

        <button
          onClick={() => exportToPDF(sections, title)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          🖨️ PDF
        </button>
      </header>

      {/* Reading content */}
      <div className="flex-1 overflow-y-auto bg-amber-50">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
          {sections.map((section, si) => (
            <div key={si}>
              {section.header && (
                <div className="mb-4 pb-2 border-b border-amber-200">
                  <span className="text-sm text-amber-700 font-medium">{section.header}</span>
                </div>
              )}
              {section.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={`text-gray-800 mb-5 ${fontSizeClass}`}
                  style={{ fontFamily: '"Sarabun", "Noto Sans Thai", sans-serif' }}
                >
                  {para}
                </p>
              ))}
              {si < sections.length - 1 && (
                <hr className="my-6 border-amber-200" />
              )}
            </div>
          ))}
          <div className="h-16" />
        </div>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <span className="text-xs text-gray-400">{totalParagraphs} ย่อหน้า · {content.length.toLocaleString()} ตัวอักษร</span>
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
