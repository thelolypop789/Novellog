import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthPage from './components/AuthPage'
import TranslatePanel from './components/TranslatePanel'
import HistoryList from './components/HistoryList'
import GlossaryManager from './components/GlossaryManager'
import NovelManager from './components/NovelManager'
import CreditBadge from './components/CreditBadge'
import { getNovels } from './services/api'

const TABS = [
  { id: 'translate', label: 'แปล' },
  { id: 'history', label: 'ประวัติ' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'novels', label: 'นิยาย' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState('translate')
  const [creditRefresh, setCreditRefresh] = useState(0)
  const [novels, setNovels] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      getNovels().then(setNovels).catch(() => {})
    } else {
      setNovels([])
    }
  }, [user])

  function refreshNovels() {
    getNovels().then(setNovels).catch(() => {})
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-sm text-gray-400">กำลังโหลด...</span>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-800">
          NovelLog{' '}
          <span className="text-indigo-500 font-normal text-sm">แปลนิยาย EN / CN → TH</span>
        </h1>
        <div className="flex items-center gap-3">
          <CreditBadge refreshTrigger={creditRefresh} />
          <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded-md transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
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
            <TranslatePanel
              onCreditUsed={() => setCreditRefresh((n) => n + 1)}
              novels={novels}
            />
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
            <h2 className="text-sm font-semibold text-gray-600 mb-4">Global Glossary</h2>
            <GlossaryManager />
          </div>
        )}

        {tab === 'novels' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">จัดการนิยาย</h2>
            <NovelManager onNovelsChange={refreshNovels} />
          </div>
        )}
      </main>
    </div>
  )
}
