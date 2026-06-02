import { useState } from 'react'
import TranslatePanel from './components/TranslatePanel'
import HistoryList from './components/HistoryList'
import GlossaryManager from './components/GlossaryManager'

const TABS = [
  { id: 'translate', label: 'แปล' },
  { id: 'history', label: 'ประวัติ' },
  { id: 'glossary', label: 'Glossary' },
]

export default function App() {
  const [tab, setTab] = useState('translate')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <h1 className="text-base font-bold text-gray-800">
          NovelLog{' '}
          <span className="text-indigo-500 font-normal text-sm">แปลนิยาย EN / CN → TH</span>
        </h1>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${tab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {tab === 'translate' && (
          <div
            className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col"
            style={{ height: 'calc(100vh - 140px)' }}
          >
            <TranslatePanel />
          </div>
        )}

        {tab === 'history' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">ประวัติการแปล</h2>
            <HistoryList />
          </div>
        )}

        {tab === 'glossary' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">จัดการ Glossary</h2>
            <GlossaryManager />
          </div>
        )}
      </main>
    </div>
  )
}
