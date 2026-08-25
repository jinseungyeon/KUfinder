export type ItemCategory =
  | 'wallet'
  | 'smartphone'
  | 'headphones'
  | 'clothing'
  | 'bag'
  | 'accessory'
  | 'etc'

export interface LocationInfo {
  name: string
  latitude: number
  longitude: number
  description?: string
}

export interface ContactInfo {
  public: 0 | 1
  detail: string
}

export interface FoundItem {
  id: number
  createdAt: string
  category: ItemCategory
  description: string
  imageUrl?: string
  foundLocation: LocationInfo
  foundDate: string
  storagePlace?: string
  contact?: ContactInfo
}

export interface LostItem {
  id?: number
  createdAt?: string
  category: ItemCategory
  description: string
  imageUrl?: string
  lostLocation: LocationInfo
  lostDate: string
  contact?: ContactInfo
}

export interface MatchResult {
  lostItemId: number | string
  foundItemId: number
  score: number
  reasons: string[]
  question?: string
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  wallet: '지갑/카드',
  smartphone: '스마트폰',
  headphones: '이어폰',
  clothing: '의류',
  bag: '가방',
  accessory: '액세서리',
  etc: '기타',
}
