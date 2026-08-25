import { useEffect } from 'react'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BackButton from '../components/BackButton'

export default function MatchingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const foundItemId = params.get('foundItemId')
  const lostItemId = params.get('lostItemId') ?? 'demo'
  const isFoundFlow = Boolean(foundItemId)

  useEffect(() => {
    const nextPath = foundItemId
      ? `/matches/${lostItemId}?source=found&foundItemId=${foundItemId}`
      : `/matches/${lostItemId}`
    const timer = window.setTimeout(() => navigate(nextPath), 1800)
    return () => window.clearTimeout(timer)
  }, [foundItemId, navigate, lostItemId])

  return (
    <main className="content-wrap min-h-[calc(100vh-64px)] py-12">
      <BackButton />
      <div className="grid min-h-[calc(100vh-180px)] place-items-center">
        <section className="card w-full max-w-xl p-8 text-center sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-ku-50 text-ku-700">
            <LoaderCircle size={38} className="animate-spin" />
          </div>
          <h1 className="mt-6 text-3xl font-black">{isFoundFlow ? '분실 신고를 찾고 있어요' : '분실물을 찾고 있어요'}</h1>
          <p className="mt-3 leading-7 text-zinc-600">
            {isFoundFlow
              ? 'AI가 방금 등록한 습득물과 기존 분실 신고의 이미지, 설명, 카테고리, 위치 정보를 비교하고 있습니다.'
              : 'AI가 등록된 습득물의 이미지, 설명, 카테고리, 위치 정보를 비교하고 있습니다.'}
          </p>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full w-3/4 animate-pulse rounded-full bg-ku-700" /></div>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ku-700"><Sparkles size={16} /> 유사 후보 분석 중...</div>
        </section>
      </div>
    </main>
  )
}
