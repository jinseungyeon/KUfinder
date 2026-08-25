import { Backpack, CircleEllipsis, Gem, Headphones, Shirt, Smartphone, WalletCards } from 'lucide-react'
import { CATEGORY_LABEL, type ItemCategory } from '../types/item'

export function categoryIcon(category: ItemCategory, size = 20) {
  const props = { size }
  switch (category) {
    case 'wallet': return <WalletCards {...props} />
    case 'smartphone': return <Smartphone {...props} />
    case 'headphones': return <Headphones {...props} />
    case 'clothing': return <Shirt {...props} />
    case 'bag': return <Backpack {...props} />
    case 'accessory': return <Gem {...props} />
    default: return <CircleEllipsis {...props} />
  }
}

export default function CategoryBadge({ category }: { category: ItemCategory }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700">
      {categoryIcon(category, 16)} {CATEGORY_LABEL[category]}
    </span>
  )
}
