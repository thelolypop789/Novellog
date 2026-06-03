import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        // Email confirm disabled — onAuthStateChange in App.jsx handles redirect
      } else {
        setMessage('สมัครสำเร็จ! ตรวจสอบ email เพื่อยืนยันก่อนเข้าสู่ระบบ')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-lg font-bold text-gray-800 mb-1">NovelLog</h1>
        <p className="text-sm text-gray-500 mb-6">แปลนิยาย EN / CN → TH</p>

        <div className="flex border border-gray-200 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage('') }}
            className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'login' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setMessage('') }}
            className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
              mode === 'register' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-1"
          >
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-xs text-gray-400 text-center mt-4">
            สมัครใหม่รับ 50 credits ฟรี (50,000 ตัวอักษร)
          </p>
        )}
      </div>
    </div>
  )
}
