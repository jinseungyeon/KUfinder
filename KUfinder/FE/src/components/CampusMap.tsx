import { useState } from 'react'
import { X } from 'lucide-react'
import { mockFoundItems } from '../mock/items'
import { CATEGORY_LABEL, type FoundItem, type ItemCategory } from '../types/item'
import { categoryIcon } from './CategoryBadge'

const pinPositions = [
  { left: '55%', top: '35%' },
  { left: '38%', top: '48%' },
  { left: '68%', top: '58%' },
  { left: '47%', top: '70%' },
]

interface Props { filter?: ItemCategory | 'all' }

export default function CampusMap({ filter = 'all' }: Props) {
  const [selected, setSelected] = useState<FoundItem | null>(null)
  const items = mockFoundItems.filter((item) => filter === 'all' || item.category === filter)

  return (
    <div className="relative h-[560px] overflow-hidden rounded-3xl border border-zinc-200 bg-[#eef1ee]">
      <div className="absolute inset-0 opacity-60" style={{
        backgroundImage: 'linear-gradient(20deg, transparent 48%, #d4d9d3 49%, #d4d9d3 51%, transparent 52%), linear-gradient(110deg, transparent 48%, #d8ddd7 49%, #d8ddd7 51%, transparent 52%)',
        backgroundSize: '170px 150px, 230px 190px'
      }} />
      <div className="absolute left-[12%] top-[18%] h-36 w-56 rotate-[-8deg] rounded-[40px] bg-white/75 shadow-sm" />
      <div className="absolute right-[8%] top-[23%] h-44 w-52 rotate-[7deg] rounded-[44px] bg-white/75 shadow-sm" />
      <div className="absolute bottom-[10%] left-[28%] h-36 w-72 rotate-[3deg] rounded-[45px] bg-white/70 shadow-sm" />
      <div className="absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <p className="font-bold text-zinc-900">안암캠퍼스 습득 위치</p>
        <p className="text-xs text-zinc-500">실제 사진 대신 카테고리 아이콘을 표시합니다.</p>
      </div>

      {items.map((item) => {
        const originalIndex = mockFoundItems.findIndex((x) => x.id === item.id)
        const pos = pinPositions[originalIndex]
        return (
          <button
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white bg-ku-700 p-3 text-white shadow-lg transition hover:scale-110"
            style={pos}
            onClick={() => setSelected(item)}
            aria-label={`${CATEGORY_LABEL[item.category]} 습득물`}
          >
            {categoryIcon(item.category, 22)}
          </button>
        )
      })}

      {selected && (
        <div className="absolute bottom-5 left-5 right-5 max-w-sm rounded-3xl bg-white p-5 shadow-soft sm:right-auto">
          <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"><X size={18} /></button>
          <div className="mb-3 flex items-center gap-2 text-ku-700">
            {categoryIcon(selected.category, 20)}
            <strong>{CATEGORY_LABEL[selected.category]}</strong>
          </div>
          <dl className="grid grid-cols-[76px_1fr] gap-y-2 text-sm">
            <dt className="text-zinc-500">발견 장소</dt><dd className="font-medium">{selected.foundLocation.name}</dd>
            <dt className="text-zinc-500">발견 날짜</dt><dd className="font-medium">{selected.foundAt}</dd>
          </dl>
          <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">지도 단계에서는 도난/오인 수령 방지를 위해 실제 사진을 노출하지 않는 흐름으로 구성했습니다.</p>
        </div>
      )}
    </div>
  )
}
