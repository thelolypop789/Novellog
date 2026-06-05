const TONE_OPTIONS = [
  { value: '', label: 'ไม่ระบุ (อัตโนมัติ)' },
  { value: 'Xianxia', label: 'Xianxia / กำลังภายใน' },
  { value: 'Isekai', label: 'Isekai / ข้ามมิติ' },
  { value: 'Romance', label: 'Romance / โรแมนติก' },
  { value: 'BL', label: "BL (Boys' Love)" },
  { value: 'GL', label: "GL (Girls' Love)" },
  { value: 'Action', label: 'Action / แอ็กชัน' },
  { value: 'Horror', label: 'Horror / สยองขวัญ' },
  { value: 'Historical', label: 'Historical / ประวัติศาสตร์' },
  { value: 'Slice of Life', label: 'Slice of Life / ชีวิตประจำวัน' },
]

export default function TranslateSettingsPanel({
  lang, novelId, genre, novels,
  onLangChange, onNovelChange, onGenreChange,
}) {
  const filteredNovels = novels.filter(n => n.lang === lang)
  const selectedNovel = novels.find(n => n.id === novelId)

  function handleLangChange(l) {
    onLangChange(l)
    onNovelChange(null)
  }

  return (
    <aside className="hidden lg:flex flex-col w-[240px] bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">การตั้งค่าการแปล</h3>
      </div>

      <div className="p-5 space-y-6">
        {/* Language */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">ภาษาต้นทาง</label>
          <div className="flex gap-2">
            {['EN', 'CN'].map(l => (
              <button
                key={l}
                onClick={() => handleLangChange(l)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border
                  ${lang === l
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                {l === 'EN' ? '🇬🇧 EN' : '🇨🇳 CN'}
              </button>
            ))}
          </div>
        </div>

        {/* Novel */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">เลือกนิยาย</label>
          {filteredNovels.length === 0 ? (
            <p className="text-xs text-gray-400 leading-relaxed">
              ยังไม่มีนิยาย {lang}<br />
              <span className="text-indigo-500 cursor-pointer hover:underline" onClick={() => {}}>เพิ่มได้ที่ "คลังนิยาย"</span>
            </p>
          ) : (
            <select
              value={novelId ?? ''}
              onChange={e => onNovelChange(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700 bg-white"
            >
              <option value="">— ไม่เลือกนิยาย —</option>
              {filteredNovels.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          )}

          {selectedNovel && (
            <div className="mt-2 bg-indigo-50 rounded-lg p-3">
              <p className="text-xs font-medium text-indigo-800">{selectedNovel.title}</p>
              {selectedNovel.genre && (
                <p className="text-xs text-indigo-500 mt-0.5">{selectedNovel.genre}</p>
              )}
              <button
                onClick={() => onNovelChange(null)}
                className="mt-1.5 text-[11px] text-indigo-400 hover:text-indigo-600"
              >
                ยกเลิกการเลือก ×
              </button>
            </div>
          )}
        </div>

        {/* Tone - hidden when novel selected (novel already has genre) */}
        {!novelId && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">โทนการแปล</label>
            <div className="space-y-2">
              {TONE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="genre"
                    value={opt.value}
                    checked={genre === opt.value}
                    onChange={() => onGenreChange(opt.value)}
                    className="accent-indigo-600 flex-shrink-0"
                  />
                  <span className={`text-sm transition-colors leading-tight
                    ${genre === opt.value ? 'text-indigo-700 font-medium' : 'text-gray-600 group-hover:text-gray-800'}`}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
