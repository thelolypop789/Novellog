import { useState } from 'react'
import GlossaryManager from './GlossaryManager'
import NovelManager from './NovelManager'
import AdminPanel from './AdminPanel'

const TABS = [
  { id: 'glossary', label: 'Glossary' },
  { id: 'novels', label: 'นิยาย' },
  { id: 'admin', label: 'Admin' },
]

export default function SettingsPage({ onNovelsChange, onCreditUsed }) {
  const [tab, setTab] = useState('glossary')

  return (
    <div className="max-w-3xl">
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'glossary' && <GlossaryManager />}
      {tab === 'novels' && (
        <NovelManager onNovelsChange={onNovelsChange} onCreditUsed={onCreditUsed} />
      )}
      {tab === 'admin' && <AdminPanel />}
    </div>
  )
}
