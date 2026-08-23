import { useState } from 'react'
import BackButton from '../components/BackButton'
import CampusMap from '../components/CampusMap'
import { CATEGORY_LABEL, type ItemCategory } from '../types/item'

export default function MapPage() {
  const [filter, setFilter] = useState<ItemCategory | 'all'>('all')
  const categories: (ItemCategory | 'all')[] = ['all', 'wallet', 'electronics', 'clothing', 'bag', 'accessory', 'etc']

  return (
    <main className="content-wrap">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">습득물 지도</h1>
        <p className="mt-2 text-zinc-600">분실물이 발견된 위치를 카테고리 아이콘으로 확인할 수 있습니다.</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === category ? 'bg-ku-700 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
          >
            {category === 'all' ? '전체' : CATEGORY_LABEL[category]}
          </button>
        ))}
      </div>
      <CampusMap filter={filter} />
    </main>
  )
}
