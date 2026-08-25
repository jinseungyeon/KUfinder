import type { FoundItem, LostItem } from '../types/item'
import { mockFoundItems, mockLostItems } from '../mock/items'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const MOCK_FOUND_ELECTRONICS_ID = '11111111-1111-4111-8111-111111111111'
const MOCK_LOST_ELECTRONICS_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

type FoundItemCreatePayload = Omit<FoundItem, 'id' | 'createdAt'>
type LostItemCreatePayload = Omit<LostItem, 'id' | 'createdAt'>

export async function uploadImage(image: File): Promise<string> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return URL.createObjectURL(image)
  }

  const form = new FormData()
  form.append('image', image)
  const response = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: 'POST',
    body: form,
  })
  if (!response.ok) throw new Error('이미지 업로드에 실패했습니다.')
  const result: { imageUrl: string } = await response.json()
  return result.imageUrl
}

export async function getFoundItems(): Promise<FoundItem[]> {
  if (!API_BASE_URL) return mockFoundItems

  const response = await fetch(`${API_BASE_URL}/found-items`)
  if (!response.ok) throw new Error('습득물 목록을 불러오지 못했습니다.')
  return response.json()
}

export async function getFoundItem(id: string): Promise<FoundItem> {
  if (!API_BASE_URL) {
    const item = mockFoundItems.find((candidate) => candidate.id === id)
    if (!item) throw new Error('습득물 정보를 찾지 못했습니다.')
    return item
  }

  const response = await fetch(`${API_BASE_URL}/found-items/${encodeURIComponent(id)}`)
  if (!response.ok) throw new Error('습득물 정보를 불러오지 못했습니다.')
  return response.json()
}

export async function getLostItems(): Promise<LostItem[]> {
  if (!API_BASE_URL) return mockLostItems

  const response = await fetch(`${API_BASE_URL}/lost-items`)
  if (!response.ok) throw new Error('분실물 목록을 불러오지 못했습니다.')
  return response.json()
}

export async function getLostItem(id: string): Promise<LostItem> {
  if (!API_BASE_URL) {
    const item = mockLostItems.find((candidate) => candidate.id === id)
    if (!item) throw new Error('분실물 정보를 찾지 못했습니다.')
    return item
  }

  const response = await fetch(`${API_BASE_URL}/lost-items/${encodeURIComponent(id)}`)
  if (!response.ok) throw new Error('분실물 정보를 불러오지 못했습니다.')
  return response.json()
}

export async function createFoundItem(payload: FoundItemCreatePayload) {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { id: payload.category === 'ELECTRONICS' ? MOCK_FOUND_ELECTRONICS_ID : crypto.randomUUID(), ...payload }
  }

  const response = await fetch(`${API_BASE_URL}/found-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('습득물 등록에 실패했습니다.')
  return response.json()
}

export async function createLostItem(payload: LostItemCreatePayload) {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { id: payload.category === 'ELECTRONICS' ? MOCK_LOST_ELECTRONICS_ID : crypto.randomUUID(), ...payload }
  }

  const response = await fetch(`${API_BASE_URL}/lost-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('분실물 등록에 실패했습니다.')
  return response.json()
}
