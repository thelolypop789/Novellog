import { useState } from 'react'

function getBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const host = window.location.hostname
  if (host.includes('.app.github.dev')) {
    return `https://${host.replace(/-\d+\.app\.github\.dev$/, '-8000.app.github.dev')}`
  }
  return 'http://localhost:8000'
}

const BASE_URL = getBaseUrl()

export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState('')
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState(100)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCheck() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${BASE_URL}/admin/credits/${userId}`, {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      setResult({ type: 'check', ...data })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${BASE_URL}/admin/add-credits`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: Number(amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      setResult({ type: 'add', ...data })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || !adminKey || !userId

  return (
    <div className="max-w-md space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Admin Secret Key</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="novellog-admin-xxxx"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">User ID (UUID)</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <button
        onClick={handleCheck}
        disabled={disabled}
        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-40 transition-colors"
      >
        ดู Credits
      </button>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <label className="block text-xs font-medium text-gray-600">เติม Credits</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={1}
            className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleAdd}
            disabled={disabled || !amount}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 transition-colors"
          >
            {loading ? 'กำลังดำเนินการ...' : 'เติม'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="text-sm bg-green-50 px-3 py-2 rounded-lg space-y-1">
          {result.type === 'check' ? (
            <>
              <div className="text-green-800 font-medium">Credits ปัจจุบัน</div>
              <div className="text-green-700 font-mono text-lg font-bold">{result.credits}</div>
            </>
          ) : (
            <>
              <div className="text-green-800 font-medium">เติม Credits สำเร็จ</div>
              <div className="text-green-700">เติมไป: <span className="font-mono font-bold">+{result.credits_added}</span></div>
              <div className="text-green-700">ยอดรวม: <span className="font-mono font-bold">{result.credits_now}</span></div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
