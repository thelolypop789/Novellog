export default function LanguageSelector({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {['EN', 'CN'].map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${value === lang
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {lang} → TH
        </button>
      ))}
    </div>
  )
}
