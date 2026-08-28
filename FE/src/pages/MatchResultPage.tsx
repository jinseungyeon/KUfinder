import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MapPin, Phone, Sparkles } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getFoundItem, getLostItem } from '../api/items'
import { confirmMatch, getMatches, getMatchesForFoundItem } from '../api/matching'
import BackButton from '../components/BackButton'
import CategoryBadge from '../components/CategoryBadge'
import type { ConfirmedMatch, FoundItem, LostItem, MatchResult } from '../types/item'
import { formatKoreanLongDate } from '../utils/date'

export default function MatchResultPage() {
  const { lostItemId = 'demo' } = useParams()
  const [params] = useSearchParams()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [itemLoading, setItemLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [item, setItem] = useState<FoundItem | LostItem>()
  const [sourceItem, setSourceItem] = useState<FoundItem | LostItem>()
  const [confirmed, setConfirmed] = useState<ConfirmedMatch>()
  const [imageFailed, setImageFailed] = useState(false)
  const [index, setIndex] = useState(0)
  const foundItemId = params.get('foundItemId')
  const isFoundFlow = params.get('source') === 'found' && Boolean(foundItemId)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setConfirmError('')
    setConfirmed(undefined)
    setIndex(0)

    const request = isFoundFlow && foundItemId ? getMatchesForFoundItem(foundItemId) : getMatches(lostItemId)
    request
      .then((result) => {
        if (!active) return
        setMatches(result)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : '매칭 결과를 불러오지 못했습니다.')
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
    setSourceItem(undefined)

    const request = isFoundFlow && foundItemId ? getFoundItem(foundItemId) : getLostItem(lostItemId)
    request
      .then((result) => {
        if (active) setSourceItem(result)
      })
      .catch(() => {
        if (active) setSourceItem(undefined)
      })

    return () => {
      active = false
    }
  }, [foundItemId, isFoundFlow, lostItemId])

  useEffect(() => {
    let active = true
    setItem(undefined)
    setImageFailed(false)
    setConfirmError('')
    setConfirmed(undefined)
    if (!current) return

    setError('')
    setItemLoading(true)
    const request = isFoundFlow ? getLostItem(current.lostItemId) : getFoundItem(current.foundItemId)
    request
      .then((result) => {
        if (active) setItem(result)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : '매칭 후보 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setItemLoading(false)
      })

    return () => {
      active = false
    }
  }, [current, isFoundFlow])

  const hasMultipleMatches = matches.length > 1
  const goPrev = () => setIndex((index - 1 + matches.length) % matches.length)
  const goNext = () => setIndex((index + 1) % matches.length)

  async function handleConfirm() {
    if (!current || confirming || confirmed) return

    setConfirming(true)
    setConfirmError('')
    try {
      const result = await confirmMatch(current.lostItemId, current.foundItemId)
      setConfirmed(result)
    } catch (reason) {
      setConfirmError(reason instanceof Error ? reason.message : '매칭 확정에 실패했습니다.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <main className="content-wrap min-h-[calc(100vh-64px)] py-12">
        <BackButton />
        <div className="grid min-h-[calc(100vh-180px)] place-items-center">
          <section className="card w-full max-w-xl p-8 text-center sm:p-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-ku-50 text-ku-700">
              <Sparkles size={36} className="animate-pulse" />
            </div>
            <h1 className="mt-6 text-3xl font-black">AI가 후보를 비교하고 있어요</h1>
            <p className="mt-3 leading-7 text-zinc-600">
              사진, 설명, 카테고리, 위치 정보를 함께 비교해 가장 비슷한 후보를 찾고 있습니다.
            </p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-3/4 animate-pulse rounded-full bg-ku-700" />
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="content-wrap">
        <BackButton />
        <div className="card p-8 text-center text-zinc-700">{error}</div>
      </main>
    )
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
            이후 비슷한 신고가 들어오면 다시 매칭할 수 있습니다.
          </p>
          <Link to="/map" className="btn-primary mx-auto mt-7">
            지도에서 보기
          </Link>
        </section>
      </main>
    )
  }

  if (itemLoading) {
    return (
      <main className="content-wrap">
        <BackButton />
        <div className="card p-8 text-center">매칭 후보 정보를 불러오는 중...</div>
      </main>
    )
  }

  if (!current || !item) {
    return (
      <main className="content-wrap">
        <BackButton />
        <div className="card p-8 text-center">매칭 후보 정보를 찾지 못했습니다.</div>
      </main>
    )
  }

  const percent = Math.round(current.score * 100)
  const itemLocation = 'lostLocation' in item ? item.lostLocation : item.foundLocation
  const itemDate = 'lostDate' in item ? item.lostDate : item.foundDate
  const contact = isFoundFlow ? confirmed?.lostContact : confirmed?.foundContact
  const imageUrl = imageFailed ? sourceItem?.imageUrl : item.imageUrl ?? sourceItem?.imageUrl

  return (
    <main className="content-wrap max-w-3xl">
      <BackButton />
      <div className="mb-6">
        <div className="flex items-center gap-2 text-ku-700">
          <Sparkles size={18} />
          <span className="text-sm font-bold">AI 매칭 결과</span>
        </div>
        <h1 className="mt-2 text-3xl font-black">
          {isFoundFlow ? '비슷한 분실 신고를 찾았어요' : '비슷한 습득물을 찾았어요'}
        </h1>
        <p className="mt-2 text-zinc-600">후보 {index + 1} / {matches.length}</p>
      </div>

      <div className="relative overflow-visible pr-0 sm:pr-10">
        {matches.length > 1 && (
          <>
            <div className="absolute bottom-4 left-3 right-0 top-5 rounded-[28px] border border-zinc-200 bg-zinc-100 shadow-sm sm:-right-3 sm:left-24" />
            {/* <div className="absolute bottom-2 left-3 right-0 top-3 rounded-[28px] border border-zinc-200 bg-zinc-200 shadow-sm sm:-right-3 sm:left-24" /> */}
          </>
        )}

        <section className="card relative z-10 overflow-hidden">
          <div className="bg-zinc-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="매칭 후보 사진"
                className="h-[340px] w-full object-cover sm:h-[420px]"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="grid h-[340px] place-items-center text-zinc-400 sm:h-[420px]">
                등록된 사진이 없습니다.
              </div>
            )}
          </div>

          <div className="border-b border-zinc-100 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-5xl font-black text-ku-700">{percent}%</div>
                <div className="mt-1 font-semibold text-zinc-700">일치 가능성</div>
              </div>
              <CategoryBadge category={item.category} />
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-ku-700" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-3 rounded-2xl bg-zinc-50 p-5 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-zinc-400">{isFoundFlow ? '분실 장소' : '습득 장소'}</div>
                <div className="mt-1 flex items-center gap-1.5 font-bold">
                  <MapPin size={17} />
                  {itemLocation.name}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400">{isFoundFlow ? '분실 날짜' : '습득 날짜'}</div>
                <div className="mt-1 font-bold">{formatKoreanLongDate(itemDate)}</div>
              </div>
            </div>

            <div>
              <h2 className="font-bold">AI가 비슷하다고 판단한 이유</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                {current.reasons.map((reason, reasonIndex) => (
                  <li key={`${reason}-${reasonIndex}`} className="flex gap-2">
                    <span className="text-ku-700">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="pr-0 sm:pr-10">
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="btn-secondary px-4 py-2.5 text-sm" disabled={!hasMultipleMatches || confirming || Boolean(confirmed)} onClick={goPrev}>
            <ArrowLeft size={17} /> 이전
          </button>
          <button className="btn-secondary px-4 py-2.5 text-sm" disabled={!hasMultipleMatches || confirming || Boolean(confirmed)} onClick={goNext}>
            다음 <ArrowRight size={17} />
          </button>
        </div>

        <button className="btn-primary mt-3 w-full" disabled={confirming || Boolean(confirmed)} onClick={handleConfirm}>
          {confirming ? <LoaderCircle className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {confirmed ? '매칭이 확정되었습니다' : '이 물건이 맞습니다'}
        </button>

        {confirmError && <div className="mt-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{confirmError}</div>}

        {confirmed && (
          <section className="mt-4 rounded-3xl border border-ku-100 bg-ku-50 p-5">
            <div className="flex items-center gap-2 font-black text-ku-900">
              <Phone size={18} />
              {isFoundFlow ? '분실자 연락처' : '습득자 연락처'}
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              매칭이 확정되어 지도에서 해당 분실물과 습득물이 삭제되었습니다.
            </p>
            <div className="mt-4 rounded-2xl bg-white p-4 font-bold text-zinc-900">
              {contact?.detail ?? '등록된 연락처가 없습니다.'}
            </div>
            {!isFoundFlow && confirmed.storagePlace && (
              <div className="mt-3 rounded-2xl bg-white p-4">
                <div className="text-xs font-semibold text-zinc-400">보관 장소</div>
                <div className="mt-1 font-bold">{confirmed.storagePlace}</div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
