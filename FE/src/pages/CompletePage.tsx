import { CheckCircle2, MapPin, MessageCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { mockFoundItems } from '../mock/items'

export default function CompletePage() {
  const [params] = useSearchParams()
  const foundItemId = Number(params.get('foundItemId') ?? 1)
  const item = mockFoundItems.find((x) => x.id === foundItemId) ?? mockFoundItems[0]

  return (
    <main className="content-wrap min-h-[calc(100vh-64px)] py-12">
      <BackButton />
      <div className="grid min-h-[calc(100vh-180px)] place-items-center">
        <section className="card w-full max-w-xl p-7 sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ku-50 text-ku-700"><CheckCircle2 size={40} /></div>
          <h1 className="mt-5 text-center text-3xl font-black">분실물을 찾았어요!</h1>
          <p className="mt-2 text-center text-zinc-600">아래 정보로 물건을 수령하거나 습득자와 연락할 수 있습니다.</p>

          <div className="mt-7 space-y-4 rounded-2xl bg-zinc-50 p-5">
            <div><div className="text-xs font-semibold text-zinc-400">습득 장소</div><div className="mt-1 flex items-center gap-2 font-bold"><MapPin size={17} />{item.foundLocation.name}</div></div>
            <div><div className="text-xs font-semibold text-zinc-400">보관 장소</div><div className="mt-1 font-bold">{item.storagePlace ?? '습득자 직접 보관'}</div></div>
            <div><div className="text-xs font-semibold text-zinc-400">연락 방법</div><div className="mt-1 font-bold">{item.contact?.public ? item.contact.detail : 'KU Finder 채팅'}</div></div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link to="/map" className="btn-secondary"><MapPin size={18} /> 지도 보기</Link>
            <button className="btn-primary" onClick={() => alert('채팅 기능은 추후 백엔드/WebSocket 연결 예정입니다.')}><MessageCircle size={18} /> 채팅하기</button>
          </div>
        </section>
      </div>
    </main>
  )
}
