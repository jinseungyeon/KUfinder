import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Sparkles } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getFoundItem, getLostItem } from '../api/items'
import { getMatches, getMatchesForFoundItem } from '../api/matching'
import BackButton from '../components/BackButton'
import CategoryBadge from '../components/CategoryBadge'
import type { FoundItem, LostItem, MatchResult } from '../types/item'

export default function MatchResultPage() {
  const { lostItemId = 'demo' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [itemLoading, setItemLoading] = useState(false)
  const [error, setError] = useState('')
  const [item, setItem] = useState<FoundItem | LostItem>()
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const foundItemId = params.get('foundItemId')
  const isFoundFlow = params.get('source') === 'found' && Boolean(foundItemId)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setIndex(0)
    const request = isFoundFlow && foundItemId ? getMatchesForFoundItem(foundItemId) : getMatches(lostItemId)
    request
      .then((result) => {
        if (!active) return
        setMatches(result)
      })
      .catch(() => {
        if (!active) return
        setError('매칭 결과를 불러오지 못했습니다.')
        setMatches([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [foundItemId, isFoundFlow, lostItemId])

  const current = matches[index]

  useEffect(() => {
    let active = true
    setItem(undefined)
    if (!current) return

    setError('')
    setItemLoading(true)
    const request = isFoundFlow ? getLostItem(current.lostItemId) : getFoundItem(current.foundItemId)
    request
      .then((result) => {
        if (active) setItem(result)
      })
      .catch(() => {
        if (active) setError('매칭 후보 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setItemLoading(false)
      })

    return () => {
      active = false
    }
  }, [current, isFoundFlow])

  if (loading) {
    return <main className="content-wrap"><BackButton /><div className="card p-8 text-center">매칭 결과를 불러오는 중...</div></main>
  }

  if (error) {
    return <main className="content-wrap"><BackButton /><div className="card p-8 text-center text-zinc-700">{error}</div></main>
  }

  if (!matches.length) {
    return (
      <main className="content-wrap max-w-2xl">
        <BackButton />
        <section className="card p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-ku-50 text-ku-700">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="mt-5 text-2xl font-black">
            {isFoundFlow ? '매칭되는 분실물이 없어 지도에 등록되었습니다' : '매칭되는 습득물이 없어 지도에 등록되었습니다'}
          </h1>
          <p className="mt-3 leading-7 text-zinc-600">
            {isFoundFlow
              ? '등록한 습득물은 지도에서 확인할 수 있고, 이후 비슷한 분실 신고가 들어오면 다시 연결할 수 있습니다.'
              : '등록한 분실물은 지도에서 확인할 수 있고, 이후 비슷한 습득물이 들어오면 다시 연결할 수 있습니다.'}
          </p>
          <button className="btn-primary mx-auto mt-7" onClick={() => navigate('/map')}>지도에서 보기</button>
        </section>
      </main>
    )
  }

  if (itemLoading) {
    return <main className="content-wrap"><BackButton /><div className="card p-8 text-center">매칭 후보 정보를 불러오는 중...</div></main>
  }

  if (!current || !item) return <main className="content-wrap"><BackButton /><div className="card p-8 text-center">매칭 후보 정보를 찾지 못했습니다.</div></main>

  const percent = Math.round(current.score * 100)
  const highConfidence = current.score >= 0.8
  const itemLocation = 'lostLocation' in item ? item.lostLocation : item.foundLocation
  const itemDate = 'lostDate' in item ? item.lostDate : item.foundDate
  const hasMultipleMatches = matches.length > 1
  const goPrev = () => {
    setAnswer('')
    setIndex((index - 1 + matches.length) % matches.length)
  }
  const goNext = () => {
    setAnswer('')
    setIndex((index + 1) % matches.length)
  }

  return (
    <main className="content-wrap max-w-3xl">
      <BackButton />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-ku-700"><Sparkles size={18} /><span className="text-sm font-bold">AI 검색 결과</span></div>
          <h1 className="mt-2 text-3xl font-black">{isFoundFlow ? '비슷한 분실 신고를 찾았어요' : '비슷한 물건을 찾았어요'}</h1>
          <p className="mt-2 text-zinc-600">후보 {index + 1} / {matches.length}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-64">
          <button className="btn-secondary px-4 py-2.5 text-sm" disabled={!hasMultipleMatches} onClick={goPrev}>
            <ArrowLeft size={17} /> 이전
          </button>
          <button className="btn-secondary px-4 py-2.5 text-sm" disabled={!hasMultipleMatches} onClick={goNext}>
            다음 <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div className="relative overflow-visible pr-0 sm:pr-8">
        {matches.length > 1 && (
          <>
            <div className="absolute bottom-4 left-6 right-1 top-4 rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm sm:-right-4 sm:left-10" />
            <div className="absolute bottom-8 left-12 right-0 top-8 rounded-3xl border border-zinc-200 bg-zinc-200 shadow-sm sm:-right-8 sm:left-20" />
          </>
        )}

        <section className="card relative z-10 overflow-hidden">
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
              <div><div className="text-xs font-semibold text-zinc-400">{isFoundFlow ? '분실 장소' : '발견 장소'}</div><div className="mt-1 flex items-center gap-1.5 font-bold"><MapPin size={17} /> {itemLocation.name}</div></div>
              <div><div className="text-xs font-semibold text-zinc-400">{isFoundFlow ? '분실 날짜' : '발견 날짜'}</div><div className="mt-1 font-bold">{itemDate}</div></div>
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
          </div>
        </section>
      </div>

      <div className="mt-3">
        {highConfidence ? (
          <button
            className="btn-primary w-full"
            onClick={() => {
              if (isFoundFlow) {
                alert('분실자 연결 기능은 추후 백엔드/채팅 연결 예정입니다.')
                return
              }
              navigate(`/matches/${lostItemId}/confirm?foundItemId=${item.id}`)
            }}
          >
            {isFoundFlow ? '연락처 보기' : '내 물건 같아요'} <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn-primary w-full" disabled={!answer} onClick={() => setIndex(0)}>
            답변 반영하고 다시 비교하기
          </button>
        )}
      </div>
    </main>
  )
}
