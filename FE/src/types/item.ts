export type ItemCategory =
  | 'WALLET'
  | 'PHONE'
  | 'ELECTRONICS'
  | 'CARD'
  | 'KEY'
  | 'BAG'
  | 'CLOTHING'
  | 'UMBRELLA'
  | 'STATIONERY'
  | 'ACCESSORY'
  | 'OTHER'

export interface LocationInfo {
  name: string
  latitude: number
  longitude: number
  description?: string
}

export interface ContactInfo {
  public: boolean
  detail: string
}

export interface FoundItem {
  id: string
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
  id?: string
  createdAt?: string
  category: ItemCategory
  description: string
  imageUrl?: string
  lostLocation: LocationInfo
  lostDate: string
  contact?: ContactInfo
}

export interface MatchResult {
  lostItemId: string
  foundItemId: string
  score: number
  reasons: string[]
  question?: string
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  WALLET: '지갑',
  PHONE: '스마트폰',
  ELECTRONICS: '전자기기',
  CARD: '카드/학생증',
  KEY: '열쇠',
  BAG: '가방',
  CLOTHING: '의류',
  UMBRELLA: '우산',
  STATIONERY: '문구류',
  ACCESSORY: '액세서리',
  OTHER: '기타',
}
