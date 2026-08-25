import { mockMatchResults } from '../mock/items'
import type { MatchResult } from '../types/item'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getMatches(lostItemId: string): Promise<MatchResult[]> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return mockMatchResults.filter((match) => match.lostItemId === lostItemId)
  }

  const response = await fetch(`${API_BASE_URL}/match-results/generate/${encodeURIComponent(lostItemId)}`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('매칭 결과를 불러오지 못했습니다.')
  const result: { results: MatchResult[] } = await response.json()
  return result.results
}

export async function getMatchesForFoundItem(foundItemId: string): Promise<MatchResult[]> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return mockMatchResults.filter((match) => String(match.foundItemId) === foundItemId)
  }

  const response = await fetch(`${API_BASE_URL}/match-results/generate/found/${encodeURIComponent(foundItemId)}`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('매칭 결과를 불러오지 못했습니다.')
  const result: { results: MatchResult[] } = await response.json()
  return result.results
}
