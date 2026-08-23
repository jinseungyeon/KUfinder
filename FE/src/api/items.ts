import type { FoundItem, LostItem } from '../types/item'
import { mockFoundItems } from '../mock/items'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getFoundItems(): Promise<FoundItem[]> {
  if (!API_BASE_URL) return mockFoundItems

  const response = await fetch(`${API_BASE_URL}/found-items`)
  if (!response.ok) throw new Error('습득물 목록을 불러오지 못했습니다.')
  return response.json()
}

export async function createFoundItem(payload: FormData) {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { id: Date.now(), ok: true }
  }

  const response = await fetch(`${API_BASE_URL}/found-items`, {
    method: 'POST',
    body: payload,
  })
  if (!response.ok) throw new Error('습득물 등록에 실패했습니다.')
  return response.json()
}

export async function createLostItem(payload: LostItem) {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { id: 'demo', ...payload }
  }

  const response = await fetch(`${API_BASE_URL}/lost-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('분실물 등록에 실패했습니다.')
  return response.json()
}
