import { mockMatchResults } from '../mock/items'
import type { ConfirmedMatch, MatchResult } from '../types/item'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function buildApiError(response: Response, fallback: string) {
  let detail = ''
  try {
    const body = await response.json()
    detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body)
  } catch {
    detail = await response.text().catch(() => '')
  }
  return new Error(`${fallback} (${response.status}${detail ? `: ${detail}` : ''})`)
}

async function requestJson<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, init)
      if (response.ok) return response.json()
      if (response.status < 500 || attempt === 2) throw await buildApiError(response, fallback)
    } catch (reason) {
      lastError = reason
      if (attempt === 2) break
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000 * (attempt + 1)))
  }

  if (lastError instanceof Error) throw lastError
  throw new Error(fallback)
}

export async function getMatches(lostItemId: string): Promise<MatchResult[]> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return mockMatchResults.filter((match) => match.lostItemId === lostItemId)
  }

  const result = await requestJson<{ results: MatchResult[] }>(
    `${API_BASE_URL}/match-results/generate/${encodeURIComponent(lostItemId)}`,
    { method: 'POST' },
    '매칭 결과를 불러오지 못했습니다.',
  )
  return result.results
}

export async function getMatchesForFoundItem(foundItemId: string): Promise<MatchResult[]> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return mockMatchResults.filter((match) => String(match.foundItemId) === foundItemId)
  }

  const result = await requestJson<{ results: MatchResult[] }>(
    `${API_BASE_URL}/match-results/generate/found/${encodeURIComponent(foundItemId)}`,
    { method: 'POST' },
    '매칭 결과를 불러오지 못했습니다.',
  )
  return result.results
}

export async function confirmMatch(lostItemId: string, foundItemId: string): Promise<ConfirmedMatch> {
  if (!API_BASE_URL) {
    const match = mockMatchResults.find(
      (candidate) => candidate.lostItemId === lostItemId && candidate.foundItemId === foundItemId,
    )
    if (!match) throw new Error('매칭 정보를 찾을 수 없습니다.')
    return { lostItemId, foundItemId }
  }

  return requestJson<ConfirmedMatch>(
    `${API_BASE_URL}/match-results/${encodeURIComponent(lostItemId)}/${encodeURIComponent(foundItemId)}/confirm`,
    { method: 'POST' },
    '매칭 확정에 실패했습니다.',
  )
}
