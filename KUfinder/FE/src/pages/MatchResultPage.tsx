import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, MapPin, Sparkles } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMatches } from '../api/matching'
import CategoryBadge from '../components/CategoryBadge'
import { mockFoundItems } from '../mock/items'
import type { MatchResult } from '../types/item'

export default function MatchResultPage() {
  const { lostItemId = 'demo' } = useParams()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')

  useEffect(() => { getMatches(lostItemId).then(setMatches) }, [lostItemId])

  const current = matches[index]
  const item = useMemo(() => current ? mockFoundItems.find((x) => x.id === current.foundItemId) : undefined, [current])

  if (!current || !item) return <main className="content-wrap"><div className="card p-8 text-center">매칭 결과를 불러오는 중...</div></main>

  const percent = Math.round(current.score * 100)
  const highConfidence = current.score >= 0.8

  return (
    <main className="content-wrap max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-ku-700"><Sparkles size={18} /><span className="text-sm font-bold">AI 검색 결과</span></div>
        <h1 className="mt-2 text-3xl font-black">비슷한 물건을 찾았어요</h1>
        <p className="mt-2 text-zinc-600">후보 {index + 1} / {matches.length}</p>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-zinc-100 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-5xl font-black text-ku-700">{percent}%</div>
              <div className="mt-1 font-semibold text-zinc-700">일치 가능성</div>
            </div>
            <CategoryBadge category={item.category} />
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-ku-700" style={{ width: `${percent}%` }} /></div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-3 rounded-2xl bg-zinc-50 p-5 sm:grid-cols-2">
            <div><div className="text-xs font-semibold text-zinc-400">발견 장소</div><div className="mt-1 flex items-center gap-1.5 font-bold"><MapPin size={17} /> {item.foundLocation.name}</div></div>
            <div><div className="text-xs font-semibold text-zinc-400">발견 날짜</div><div className="mt-1 font-bold">{item.foundAt}</div></div>
          </div>

          <div>
            <h2 className="font-bold">AI가 비슷하다고 판단한 이유</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {current.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-ku-700">•</span>{reason}</li>)}
            </ul>
          </div>

          {!highConfidence && current.question && (
            <div className="rounded-2xl border border-ku-100 bg-ku-50 p-5">
              <div className="text-sm font-bold text-ku-900">조금 더 확인이 필요해요</div>
              <p className="mt-2 font-semibold">Q. {current.question}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['있었다', '없었다', '모르겠다'].map((value) => (
                  <button key={value} onClick={() => setAnswer(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${answer === value ? 'bg-ku-700 text-white' : 'bg-white text-zinc-700'}`}>{value}</button>
                ))}
              </div>
            </div>
          )}

          {highConfidence ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="btn-primary" onClick={() => navigate(`/matches/${lostItemId}/confirm?foundItemId=${item.id}`)}>내 물건 같아요 <ArrowRight size={18} /></button>
              <button className="btn-secondary" onClick={() => setIndex((index + 1) % matches.length)}>다음 후보 보기</button>
            </div>
          ) : (
            <button className="btn-primary w-full" disabled={!answer} onClick={() => setIndex(0)}>답변 반영하고 다시 비교하기</button>
          )}
        </div>
      </section>
    </main>
  )
}
