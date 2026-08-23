import { mockMatchResults } from '../mock/items'
import type { MatchResult } from '../types/item'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getMatches(lostItemId: string): Promise<MatchResult[]> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return mockMatchResults
  }

  const response = await fetch(`${API_BASE_URL}/matches/${lostItemId}`)
  if (!response.ok) throw new Error('매칭 결과를 불러오지 못했습니다.')
  return response.json()
}
