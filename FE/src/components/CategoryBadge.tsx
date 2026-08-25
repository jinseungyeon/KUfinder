import { Backpack, CircleEllipsis, CreditCard, Gem, Headphones, KeyRound, PencilRuler, Shirt, Smartphone, Umbrella, WalletCards } from 'lucide-react'
import { CATEGORY_LABEL, type ItemCategory } from '../types/item'

export function categoryIcon(category: ItemCategory, size = 20) {
  const props = { size }
  switch (category) {
    case 'WALLET': return <WalletCards {...props} />
    case 'PHONE': return <Smartphone {...props} />
    case 'ELECTRONICS': return <Headphones {...props} />
    case 'CARD': return <CreditCard {...props} />
    case 'KEY': return <KeyRound {...props} />
    case 'BAG': return <Backpack {...props} />
    case 'CLOTHING': return <Shirt {...props} />
    case 'UMBRELLA': return <Umbrella {...props} />
    case 'STATIONERY': return <PencilRuler {...props} />
    case 'ACCESSORY': return <Gem {...props} />
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
