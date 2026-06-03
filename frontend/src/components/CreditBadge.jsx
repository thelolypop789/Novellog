import { useState, useEffect } from 'react'
import { getMyCredits } from '../services/api'

export default function CreditBadge({ refreshTrigger }) {
  const [credits, setCredits] = useState(null)

  useEffect(() => {
    getMyCredits()
      .then((d) => setCredits(d.credits))
      .catch(() => setCredits(null))
  }, [refreshTrigger])

  if (credits === null) return null

  const isLow = credits < 10

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full border ${
        isLow
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-indigo-50 border-indigo-200 text-indigo-600'
      }`}
      title="1 credit = 1,000 ตัวอักษร"
    >
      {credits} credit{credits !== 1 ? 's' : ''}
      {isLow && ' (ใกล้หมด)'}
    </span>
  )
}
