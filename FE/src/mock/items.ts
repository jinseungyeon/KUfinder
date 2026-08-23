import type { FoundItem, MatchResult } from '../types/item'

export const mockFoundItems: FoundItem[] = [
  {
    id: 1,
    category: 'electronics',
    description: '검정색 무선 이어폰 케이스. 작은 흰색 스티커가 붙어 있음.',
    imageUrl: '/mock-earbuds.svg',
    foundLocation: { name: '하나스퀘어 B1', latitude: 37.5836, longitude: 127.0254 },
    foundAt: '2026-08-22',
    storagePlace: '하나스퀘어 안내데스크',
    contact: 'KU Finder 채팅',
  },
  {
    id: 2,
    category: 'wallet',
    description: '갈색 카드지갑. 앞면에 작은 로고가 있음.',
    foundLocation: { name: '중앙광장', latitude: 37.5844, longitude: 127.0263 },
    foundAt: '2026-08-21',
    storagePlace: '학생회관 분실물 보관함',
  },
  {
    id: 3,
    category: 'bag',
    description: '검정색 작은 파우치. 지퍼 손잡이가 은색.',
    foundLocation: { name: '과학도서관 앞', latitude: 37.5829, longitude: 127.0268 },
    foundAt: '2026-08-20',
    storagePlace: '과학도서관 안내데스크',
  },
  {
    id: 4,
    category: 'accessory',
    description: '은색 열쇠고리. 둥근 장식이 달려 있음.',
    foundLocation: { name: '애기능생활관', latitude: 37.5818, longitude: 127.0262 },
    foundAt: '2026-08-19',
    storagePlace: '애기능생활관 경비실',
  },
]

export const mockMatchResults: MatchResult[] = [
  {
    foundItemId: 1,
    score: 0.94,
    reasons: ['동일한 전자기기 카테고리', '검정색 외형이 유사함', '분실/습득 장소가 가까움'],
  },
  {
    foundItemId: 3,
    score: 0.72,
    reasons: ['검정색 외형이 유사함', '장소가 비교적 가까움'],
    question: '물건에 작은 스티커나 장식이 있었나요?',
  },
]
