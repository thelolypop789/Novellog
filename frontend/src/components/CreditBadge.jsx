import { useState, useEffect } from 'react'
import { getMyCredits } from '../services/api'

export default function CreditBadge({ refreshTrigger }) {
  const [credits, setCredits] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    getMyCredits()
      .then((d) => { setCredits(d.credits); setErr('') })
      .catch((e) => { setCredits(null); setErr(e.message) })
  }, [refreshTrigger])

  if (err) return <span className="text-xs text-red-500 px-2">{err}</span>
  if (credits === null) return <span className="text-xs text-gray-400 px-2">loading...</span>

  const isLow = credits < 10

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full border ${
        isLow
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-indigo-50 border-indigo-200 text-indigo-600'
      }`}
      title={`1 credit = 1,000 ตัวอักษร`}
    >
      {credits} credit{credits !== 1 ? 's' : ''}
      {isLow && ' (ใกล้หมด)'}
    </span>
  )
}
