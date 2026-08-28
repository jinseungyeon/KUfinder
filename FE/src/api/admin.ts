const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const STORAGE_KEY = 'ku-finder-admin-session'

export interface AdminSession {
  accessToken: string
  tokenType: string
  expiresAt: string
}

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

export function getStoredAdminSession(): AdminSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AdminSession
    if (!session.accessToken || new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearStoredAdminSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function loginAdmin(password: string): Promise<AdminSession> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    if (password !== 'admin') {
      throw new Error('관리자 계정 정보가 올바르지 않습니다.')
    }
    const session = {
      accessToken: 'mock-admin-token',
      tokenType: 'bearer',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return session
  }

  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) throw await buildApiError(response, '관리자 로그인에 실패했습니다.')

  const session: AdminSession = await response.json()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}
