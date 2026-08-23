export type ItemCategory =
  | 'wallet'
  | 'electronics'
  | 'clothing'
  | 'bag'
  | 'accessory'
  | 'etc'

export interface LocationInfo {
  name: string
  latitude: number
  longitude: number
}

export interface FoundItem {
  id: number
  category: ItemCategory
  description: string
  imageUrl?: string
  foundLocation: LocationInfo
  foundAt: string
  contact?: string
  storagePlace?: string
}

export interface LostItem {
  id?: number
  category: ItemCategory
  description: string
  imageUrl?: string
  lostLocation: LocationInfo
  lostAt?: string
  contact?: string
}

export interface MatchResult {
  foundItemId: number
  score: number
  reasons: string[]
  question?: string
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  wallet: '지갑/카드',
  electronics: '전자기기',
  clothing: '의류',
  bag: '가방',
  accessory: '액세서리',
  etc: '기타',
}
