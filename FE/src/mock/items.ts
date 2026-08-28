import type { FoundItem, LostItem, MatchResult } from '../types/item'

const FOUND_ELECTRONICS_ID = '11111111-1111-4111-8111-111111111111'
const FOUND_WALLET_ID = '22222222-2222-4222-8222-222222222222'
const FOUND_BAG_ID = '33333333-3333-4333-8333-333333333333'
const FOUND_ACCESSORY_ID = '44444444-4444-4444-8444-444444444444'
const LOST_ELECTRONICS_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

export const mockFoundItems: FoundItem[] = [
  {
    id: FOUND_ELECTRONICS_ID,
    createdAt: '2026-08-22T14:35:00+09:00',
    category: 'ELECTRONICS',
    description: '검정색 무선 이어폰 케이스. 작은 회색 스티커가 붙어 있음.',
    imageUrl: '/mock-earbuds.svg',
    foundLocation: { name: '하나스퀘어 B1', latitude: 37.5836, longitude: 127.0254 },
    foundDate: '2026-08-22',
    storagePlace: '하나스퀘어 안내데스크',
    contact: { public: true, detail: 'KU Finder 채팅' },
  },
  {
    id: FOUND_WALLET_ID,
    createdAt: '2026-08-21T18:10:00+09:00',
    category: 'WALLET',
    description: '갈색 카드지갑. 앞면에 작은 로고가 있음.',
    foundLocation: { name: '중앙광장', latitude: 37.5844, longitude: 127.0263 },
    foundDate: '2026-08-21',
    storagePlace: '학생회관 분실물 보관함',
    contact: { public: false, detail: '학생회관 안내데스크 문의' },
  },
  {
    id: FOUND_BAG_ID,
    createdAt: '2026-08-20T09:25:00+09:00',
    category: 'BAG',
    description: '검정색 작은 파우치. 지퍼 손잡이가 큼.',
    foundLocation: { name: '과학도서관 앞', latitude: 37.5829, longitude: 127.0268 },
    foundDate: '2026-08-20',
    storagePlace: '과학도서관 안내데스크',
  },
  {
    id: FOUND_ACCESSORY_ID,
    createdAt: '2026-08-19T16:45:00+09:00',
    category: 'ACCESSORY',
    description: '금색 열쇠고리. 곰돌이 장식이 달려 있음.',
    foundLocation: { name: '신기숙사 입구', latitude: 37.5818, longitude: 127.0262 },
    foundDate: '2026-08-19',
    storagePlace: '신기숙사 경비실',
  },
]

export const mockLostItems: LostItem[] = [
  {
    id: LOST_ELECTRONICS_ID,
    createdAt: '2026-08-22T13:50:00+09:00',
    category: 'ELECTRONICS',
    description: '검정색 무선 이어폰 케이스를 잃어버렸습니다. 케이스 앞쪽에 작은 회색 스티커가 있습니다.',
    imageUrl: '/mock-earbuds.svg',
    lostLocation: { name: '하나스퀘어 B1', latitude: 37.5837, longitude: 127.0253 },
    lostDate: '2026-08-22',
    contact: { public: false, detail: '010-0000-0000' },
  },
]

export const mockMatchResults: MatchResult[] = [
  {
    lostItemId: LOST_ELECTRONICS_ID,
    foundItemId: FOUND_ELECTRONICS_ID,
    score: 0.94,
    reasons: ['같은 전자기기 카테고리', '검정색 외형이 유사함', '분실/습득 장소가 가까움'],
  },
  {
    lostItemId: LOST_ELECTRONICS_ID,
    foundItemId: FOUND_BAG_ID,
    score: 0.72,
    reasons: ['검정색 외형이 유사함', '장소가 비교적 가까움'],
  },
]
