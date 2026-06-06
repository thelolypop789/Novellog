import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthPage from './components/AuthPage'
import Sidebar from './components/Sidebar'
import TranslatePanel from './components/TranslatePanel'
import TranslateSettingsPanel from './components/TranslateSettingsPanel'
import HistoryList from './components/HistoryList'
import GlossaryManager from './components/GlossaryManager'
import NovelManager from './components/NovelManager'
import SettingsPage from './components/SettingsPage'
import CreditBadge from './components/CreditBadge'
import ReaderPage from './components/ReaderPage'
import { getNovels } from './services/api'

const PAGE_TITLES = {
  translate: 'แปลนิยาย',
  history: 'ประวัติการแปล',
  novels: 'คลังนิยาย',
  glossary: 'Glossary',
  settings: 'การตั้งค่า',
}

const BOTTOM_NAV = [
  {
    id: 'translate',
    label: 'แปล',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'ประวัติ',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'novels',
    label: 'คลัง',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'glossary',
    label: 'Glossary',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'ตั้งค่า',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage] = useState('translate')
  const [creditRefresh, setCreditRefresh] = useState(0)
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [novels, setNovels] = useState([])
  const [lang, setLang] = useState('EN')
  const [novelId, setNovelId] = useState(null)
  const [genre, setGenre] = useState('')
  const [readerContent, setReaderContent] = useState(null)

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
    if (user) getNovels().then(setNovels).catch(() => {})
    else setNovels([])
  }, [user])

  function handleLangChange(l) {
    setLang(l)
    setNovelId(null)
  }

  function handleCreditUsed() {
    setCreditRefresh(n => n + 1)
  }

  function handleTranslated() {
    setCreditRefresh(n => n + 1)
    setHistoryRefresh(n => n + 1)
  }

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — desktop only */}
      <Sidebar page={page} onNav={setPage} user={user} creditRefresh={creditRefresh} />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 h-14 flex-shrink-0 flex items-center justify-between gap-3">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">N</div>
            <span className="font-bold text-sm text-gray-800">NovelLog</span>
          </div>
          {/* Desktop page title */}
          <p className="hidden md:block text-sm font-semibold text-gray-700">
            {PAGE_TITLES[page]}
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <CreditBadge refreshTrigger={creditRefresh} />
            <span className="text-xs text-gray-400 hidden lg:block max-w-[140px] truncate">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 border border-gray-200 rounded-lg transition-colors whitespace-nowrap"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {/* Content row */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {page === 'translate' && (
              <TranslatePanel
                lang={lang}
                novelId={novelId}
                genre={genre}
                novels={novels}
                onLangChange={handleLangChange}
                onNovelChange={setNovelId}
                onCreditUsed={handleCreditUsed}
                onTranslated={handleTranslated}
                historyRefresh={historyRefresh}
                onOpenReader={setReaderContent}
              />
            )}

            {page === 'history' && (
              <div className="p-4 md:p-6 max-w-3xl">
                <h2 className="text-sm font-semibold text-gray-600 mb-4">ประวัติการแปล</h2>
                <HistoryList novels={novels} />
              </div>
            )}

            {page === 'novels' && (
              <div className="p-4 md:p-6">
                <NovelManager onNovelsChange={refreshNovels} onCreditUsed={handleCreditUsed} />
              </div>
            )}

            {page === 'glossary' && (
              <div className="p-4 md:p-6">
                <GlossaryManager novels={novels} />
              </div>
            )}

            {page === 'settings' && (
              <div className="p-4 md:p-6">
                <SettingsPage onNovelsChange={refreshNovels} onCreditUsed={handleCreditUsed} />
              </div>
            )}
          </main>

          {/* Right settings panel — translate page, desktop only */}
          {page === 'translate' && (
            <TranslateSettingsPanel
              lang={lang}
              novelId={novelId}
              genre={genre}
              novels={novels}
              onLangChange={handleLangChange}
              onNovelChange={setNovelId}
              onGenreChange={setGenre}
            />
          )}
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden flex border-t border-gray-200 bg-white flex-shrink-0">
          {BOTTOM_NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors
                ${page === item.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {readerContent && (
        <ReaderPage content={readerContent} onClose={() => setReaderContent(null)} />
      )}
    </div>
  )
}
