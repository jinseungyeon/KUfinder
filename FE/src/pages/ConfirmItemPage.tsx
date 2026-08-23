import { ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { mockFoundItems } from '../mock/items'

export default function ConfirmItemPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const foundItemId = Number(params.get('foundItemId') ?? 1)
  const item = mockFoundItems.find((x) => x.id === foundItemId) ?? mockFoundItems[0]

  return (
    <main className="content-wrap max-w-2xl">
      <section className="card overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-ku-700"><ShieldCheck size={19} /><span className="text-sm font-bold">최종 확인</span></div>
          <h1 className="mt-2 text-3xl font-black">혹시 이 물건인가요?</h1>
          <p className="mt-2 text-zinc-600">높은 매칭 가능성이 확인되어 습득자가 등록한 실제 사진을 보여드립니다.</p>
        </div>
        <div className="bg-zinc-100">
          {item.imageUrl ? <img src={item.imageUrl} alt="습득물" className="h-[360px] w-full object-cover" /> : <div className="grid h-[360px] place-items-center text-zinc-400">등록된 사진이 없습니다.</div>}
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
          <button className="btn-primary" onClick={() => navigate(`/complete?foundItemId=${item.id}`)}>네, 제 물건이에요</button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>아니에요</button>
        </div>
      </section>
    </main>
  )
}
