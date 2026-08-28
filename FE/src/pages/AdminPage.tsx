import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  LoaderCircle,
  LogOut,
  MapPin,
  PackageCheck,
  PackageSearch,
  Search,
  Shield,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import BackButton from '../components/BackButton'
import { categoryIcon } from '../components/CategoryBadge'
import { clearStoredAdminSession, getStoredAdminSession, loginAdmin, type AdminSession } from '../api/admin'
import { deleteFoundItem, deleteLostItem, getFoundItems, getLostItems } from '../api/items'
import { CATEGORY_LABEL, type ContactInfo, type FoundItem, type ItemCategory, type LostItem } from '../types/item'
import { formatKoreanDate } from '../utils/date'

type AdminItemKind = 'lost' | 'found'
type AdminFilter = 'all' | AdminItemKind

interface AdminItem {
  id: string
  kind: AdminItemKind
  category: ItemCategory
  description: string
  imageUrl?: string
  locationName: string
  eventDate: string
  createdAt?: string
  storagePlace?: string
  contact?: ContactInfo
}

const kindLabel: Record<AdminItemKind, string> = {
  lost: '분실물',
  found: '습득물',
}

function toTimestamp(value?: string) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function normalizeLostItem(item: LostItem): AdminItem | null {
  if (!item.id) return null
  return {
    id: item.id,
    kind: 'lost',
    category: item.category,
    description: item.description,
    imageUrl: item.imageUrl,
    locationName: item.lostLocation.name,
    eventDate: item.lostDate,
    createdAt: item.createdAt,
    contact: item.contact,
  }
}

function normalizeFoundItem(item: FoundItem): AdminItem {
  return {
    id: item.id,
    kind: 'found',
    category: item.category,
    description: item.description,
    imageUrl: item.imageUrl,
    locationName: item.foundLocation.name,
    eventDate: item.foundDate,
    createdAt: item.createdAt,
    storagePlace: item.storagePlace,
    contact: item.contact,
  }
}

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(() => getStoredAdminSession())
  const [items, setItems] = useState<AdminItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string>()
  const [filter, setFilter] = useState<AdminFilter>('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!session) {
      setItems([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError('')

    Promise.all([getLostItems({ limit: 200 }), getFoundItems({ limit: 200 })])
      .then(([lostItems, foundItems]) => {
        if (!active) return
        const normalized = [
          ...lostItems.map(normalizeLostItem).filter((item): item is AdminItem => Boolean(item)),
          ...foundItems.map(normalizeFoundItem),
        ].sort((a, b) => toTimestamp(b.createdAt ?? b.eventDate) - toTimestamp(a.createdAt ?? a.eventDate))
        setItems(normalized)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : '관리자 데이터를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [session])

  const stats = useMemo(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const categoryCounts = items.reduce<Record<ItemCategory, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {} as Record<ItemCategory, number>)

    return {
      total: items.length,
      lost: items.filter((item) => item.kind === 'lost').length,
      found: items.filter((item) => item.kind === 'found').length,
      recent: items.filter((item) => now - toTimestamp(item.createdAt ?? item.eventDate) <= sevenDays).length,
      withImage: items.filter((item) => Boolean(item.imageUrl)).length,
      missingStorage: items.filter((item) => item.kind === 'found' && !item.storagePlace).length,
      topCategories: Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5) as [ItemCategory, number][],
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesKind = filter === 'all' || item.kind === filter
      if (!matchesKind) return false
      if (!normalizedQuery) return true
      return [
        item.description,
        item.locationName,
        item.storagePlace ?? '',
        CATEGORY_LABEL[item.category],
        kindLabel[item.kind],
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [filter, items, query])

  async function handleDelete(item: AdminItem) {
    if (!session) {
      setError('관리자 로그인이 필요합니다.')
      return
    }
    if (!window.confirm(`${kindLabel[item.kind]} "${item.description.slice(0, 24)}" 항목을 삭제할까요?`)) return

    setDeletingId(item.id)
    setError('')
    setNotice('')
    try {
      if (item.kind === 'found') {
        await deleteFoundItem(item.id, session.accessToken)
      } else {
        await deleteLostItem(item.id, session.accessToken)
      }
      setItems((current) => current.filter((candidate) => candidate.id !== item.id))
      setNotice(`${kindLabel[item.kind]} 항목을 삭제했습니다.`)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : `${kindLabel[item.kind]} 삭제에 실패했습니다.`
      if (message.includes('(401')) {
        clearStoredAdminSession()
        setSession(null)
        setLoginError('관리자 인증이 만료되었습니다. 다시 로그인해 주세요.')
      }
      setError(message)
    } finally {
      setDeletingId(undefined)
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const nextSession = await loginAdmin(password)
      setPassword('')
      setSession(nextSession)
    } catch (reason) {
      setLoginError(reason instanceof Error ? reason.message : '관리자 로그인에 실패했습니다.')
    } finally {
      setLoginLoading(false)
    }
  }

  function handleLogout() {
    clearStoredAdminSession()
    setSession(null)
    setNotice('')
    setError('')
  }

  const statCards: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: '전체 등록', value: stats.total, Icon: ClipboardList },
    { label: '분실물', value: stats.lost, Icon: PackageSearch },
    { label: '습득물', value: stats.found, Icon: PackageCheck },
    { label: '최근 7일', value: stats.recent, Icon: CalendarDays },
    { label: '사진 포함', value: stats.withImage, Icon: ImageIcon },
    { label: '보관장소 미입력', value: stats.missingStorage, Icon: AlertTriangle },
  ]

  if (!session) {
    return (
      <main className="content-wrap max-w-md">
        <BackButton />
        <section className="card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-ku-700">
            <Shield size={19} />
            <span className="text-sm font-bold">관리자 인증</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">관리자 로그인</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">관리자만 접근할 수 있습니다.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="label">비밀번호</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                <AlertTriangle size={18} />
                {loginError}
              </div>
            )}
            <button className="btn-primary w-full" disabled={loginLoading || !password}>
              {loginLoading ? <LoaderCircle className="animate-spin" size={18} /> : <Shield size={18} />}
              로그인
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="content-wrap">
      <BackButton />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-ku-700">
            <Shield size={19} />
            <span className="text-sm font-bold">관리자</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">운영 대시보드</h1>
          <p className="mt-2 text-zinc-600">분실물과 습득물 등록 현황을 확인하고 잘못 등록된 항목을 삭제합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['all', '전체'],
            ['lost', '분실물'],
            ['found', '습득물'],
          ] as [AdminFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === value ? 'bg-ku-700 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
          <button className="btn-secondary px-4 py-2 text-sm" onClick={handleLogout}>
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map(({ label, value, Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-500">{label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-ku-50 text-ku-700">
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-zinc-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card overflow-hidden">
          <div className="border-b border-zinc-100 p-4 sm:p-5">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                className="input pl-11"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="설명, 장소, 카테고리 검색"
              />
            </label>
          </div>

          {notice && (
            <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 sm:mx-5">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}
          {error && (
            <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 sm:mx-5">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid min-h-80 place-items-center text-zinc-500">
              <div className="flex items-center gap-2 font-bold">
                <LoaderCircle className="animate-spin" size={20} />
                관리자 데이터를 불러오는 중
              </div>
            </div>
          ) : filteredItems.length ? (
            <div className="divide-y divide-zinc-100">
              {filteredItems.map((item) => (
                <article key={`${item.kind}-${item.id}`} className="grid gap-4 p-4 sm:grid-cols-[88px_1fr_auto] sm:p-5">
                  <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-zinc-100 text-zinc-400">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      categoryIcon(item.category, 28)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        item.kind === 'lost' ? 'bg-rose-50 text-ku-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {kindLabel[item.kind]}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-700">
                        {categoryIcon(item.category, 15)}
                        {CATEGORY_LABEL[item.category]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-semibold leading-6 text-zinc-950">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={15} />
                        {item.locationName}
                      </span>
                      <span>{formatKoreanDate(item.eventDate)}</span>
                      {item.storagePlace && <span>보관: {item.storagePlace}</span>}
                    </div>
                  </div>
                  <button
                    className="btn-secondary self-center border-red-100 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 sm:justify-self-end"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item)}
                  >
                    {deletingId === item.id ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}
                    삭제
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center p-8 text-center text-zinc-500">
              조건에 맞는 항목이 없습니다.
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="font-black text-zinc-950">카테고리 상위</h2>
            <div className="mt-4 space-y-3">
              {stats.topCategories.length ? stats.topCategories.map(([category, count]) => (
                <div key={category}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-1.5 font-bold text-zinc-700">
                      {categoryIcon(category, 15)}
                      {CATEGORY_LABEL[category]}
                    </span>
                    <span className="font-black text-ku-700">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-ku-700" style={{ width: `${Math.max(8, (count / Math.max(stats.total, 1)) * 100)}%` }} />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-zinc-500">집계할 항목이 없습니다.</p>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-black text-zinc-950">운영 체크</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 text-emerald-600" size={16} />
                중복 또는 테스트 등록 항목은 삭제할 수 있습니다.
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 text-amber-600" size={16} />
                삭제하면 연결된 매칭 결과도 함께 사라집니다.
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  )
}
