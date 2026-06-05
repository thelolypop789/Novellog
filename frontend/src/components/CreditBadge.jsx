import { useState, useEffect } from 'react'
import { getMyCredits } from '../services/api'

export default function CreditBadge({ refreshTrigger }) {
  const [credits, setCredits] = useState(null)

  useEffect(() => {
    getMyCredits().then(d => setCredits(d.credits)).catch(() => setCredits(null))
  }, [refreshTrigger])

  if (credits === null) return null

  const isLow = credits < 10

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border cursor-default select-none ${
        isLow
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}
      title="1 credit = 1,000 ตัวอักษร"
    >
      <span>🪙</span>
      <span>{credits.toLocaleString()}</span>
      {isLow && <span className="text-xs font-normal opacity-80">(ใกล้หมด)</span>}
    </div>
  )
}
