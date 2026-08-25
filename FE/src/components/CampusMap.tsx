import { useEffect, useMemo, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mockFoundItems, mockLostItems } from '../mock/items'
import { CATEGORY_LABEL, type FoundItem, type ItemCategory, type LostItem } from '../types/item'
import { categoryIcon } from './CategoryBadge'

type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}
type KakaoMap = {
  relayout: () => void
  getCenter: () => KakaoLatLng
  getLevel: () => number
  setCenter: (latlng: KakaoLatLng) => void
  setLevel: (level: number) => void
}
type KakaoMapOverlay = { setMap: (map: KakaoMap | null) => void }

interface KakaoMaps {
  load: (callback: () => void) => void
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  CustomOverlay: new (options: {
    map: KakaoMap
    position: KakaoLatLng
    content: HTMLElement | string
    xAnchor?: number
    yAnchor?: number
  }) => KakaoMapOverlay
  event: {
    addListener: (target: KakaoMap, type: string, callback: () => void) => void
  }
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps }
  }
}

const CAMPUS_CENTER = { latitude: 37.58704982196241, longitude: 127.02929004580606 }
const INITIAL_MAP_LEVEL = 4
const MAX_ZOOM_OUT_LEVEL = 5
const CAMPUS_BOUNDS = {
  south: 37.5808,
  west: 127.0218,
  north: 37.5915,
  east: 127.0368,
}
const CATEGORY_MARKER_COLOR: Record<ItemCategory, string> = {
  wallet: '#7a0029',
  smartphone: '#401408',
  headphones: '#401408',
  clothing: '#275738',
  bag: '#5f3b16',
  accessory: '#8a5b00',
  etc: '#3f3f46',
}
let kakaoMapsPromise: Promise<KakaoMaps> | null = null

type MapMode = 'found' | 'lost'
type MapItem = FoundItem | LostItem

function isFoundItem(item: MapItem): item is FoundItem {
  return 'foundLocation' in item
}

function getItemLocation(item: MapItem) {
  return isFoundItem(item) ? item.foundLocation : item.lostLocation
}

function getItemDate(item: MapItem) {
  return isFoundItem(item) ? item.foundDate : item.lostDate
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function keepCenterInCampusBounds(map: KakaoMap, maps: KakaoMaps) {
  const center = map.getCenter()
  const latitude = center.getLat()
  const longitude = center.getLng()
  const clampedLatitude = clamp(latitude, CAMPUS_BOUNDS.south, CAMPUS_BOUNDS.north)
  const clampedLongitude = clamp(longitude, CAMPUS_BOUNDS.west, CAMPUS_BOUNDS.east)

  if (latitude !== clampedLatitude || longitude !== clampedLongitude) {
    map.setCenter(new maps.LatLng(clampedLatitude, clampedLongitude))
  }
}

function keepZoomInAllowedRange(map: KakaoMap) {
  if (map.getLevel() > MAX_ZOOM_OUT_LEVEL) {
    map.setLevel(MAX_ZOOM_OUT_LEVEL)
  }
}

function createCategoryMarkerContent(item: MapItem, mode: MapMode, onSelect: (item: MapItem) => void) {
  const markerColor = CATEGORY_MARKER_COLOR[item.category]
  const location = getItemLocation(item)
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('aria-label', `${CATEGORY_LABEL[item.category]} ${mode === 'found' ? '습득물' : '분실물'}`)
  button.title = `${CATEGORY_LABEL[item.category]} - ${location.name}`
  button.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect(item)
  })

  Object.assign(button.style, {
    alignItems: 'center',
    background: 'transparent',
    border: '0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.22))',
    padding: '0',
    transform: 'translateY(-2px)',
  })

  const iconWrap = document.createElement('span')
  Object.assign(iconWrap.style, {
    alignItems: 'center',
    background: markerColor,
    border: '4px solid white',
    borderRadius: '18px',
    color: '#fff',
    display: 'flex',
    fontSize: '22px',
    height: '52px',
    justifyContent: 'center',
    lineHeight: '1',
    width: '52px',
  })
  iconWrap.innerHTML = renderToStaticMarkup(categoryIcon(item.category, 24))

  const pointer = document.createElement('span')
  Object.assign(pointer.style, {
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: `11px solid ${markerColor}`,
    height: '0',
    marginTop: '-3px',
    width: '0',
  })

  button.append(iconWrap, pointer)
  return button
}

function loadKakaoMaps() {
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY

  if (!appKey) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다.'))
  }

  if (window.kakao?.maps) {
    return new Promise<KakaoMaps>((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps))
    })
  }

  if (!kakaoMapsPromise) {
    kakaoMapsPromise = new Promise<KakaoMaps>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
      script.async = true
      script.onload = () => {
        if (!window.kakao?.maps) {
          reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.'))
          return
        }

        window.kakao.maps.load(() => resolve(window.kakao!.maps))
      }
      script.onerror = () => reject(new Error('Kakao Maps SDK 스크립트 로드에 실패했습니다. Network 탭에서 sdk.js 요청의 상태 코드를 확인해주세요.'))
      document.head.appendChild(script)
    })
  }

  return kakaoMapsPromise
}

interface Props { filter?: ItemCategory | 'all' }

export default function CampusMap({ filter = 'all' }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<KakaoMap | null>(null)
  const markersRef = useRef<KakaoMapOverlay[]>([])
  const detailOverlayRef = useRef<KakaoMapOverlay | null>(null)
  const [kakaoMaps, setKakaoMaps] = useState<KakaoMaps | null>(null)
  const [mode, setMode] = useState<MapMode>('found')
  const [selected, setSelected] = useState<MapItem | null>(null)
  const [error, setError] = useState('')
  const items = useMemo(
    () => {
      const source = mode === 'found' ? mockFoundItems : mockLostItems
      return source.filter((item) => filter === 'all' || item.category === filter)
    },
    [filter, mode],
  )

  useEffect(() => {
    let cancelled = false

    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return

        const center = new maps.LatLng(CAMPUS_CENTER.latitude, CAMPUS_CENTER.longitude)
        mapInstanceRef.current = new maps.Map(mapRef.current, { center, level: INITIAL_MAP_LEVEL })
        mapInstanceRef.current.relayout()
        mapInstanceRef.current.setCenter(center)
        maps.event.addListener(mapInstanceRef.current, 'dragend', () => {
          if (mapInstanceRef.current) keepCenterInCampusBounds(mapInstanceRef.current, maps)
        })
        maps.event.addListener(mapInstanceRef.current, 'zoom_changed', () => {
          if (!mapInstanceRef.current) return
          keepZoomInAllowedRange(mapInstanceRef.current)
          keepCenterInCampusBounds(mapInstanceRef.current, maps)
        })
        setKakaoMaps(maps)
        setError('')
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
      detailOverlayRef.current?.setMap(null)
      detailOverlayRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !kakaoMaps) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    detailOverlayRef.current?.setMap(null)
    detailOverlayRef.current = null
    setSelected(null)

    items.forEach((item) => {
      const location = getItemLocation(item)
      const marker = new kakaoMaps.CustomOverlay({
        map: mapInstanceRef.current!,
        position: new kakaoMaps.LatLng(location.latitude, location.longitude),
        content: createCategoryMarkerContent(item, mode, setSelected),
        xAnchor: 0.5,
        yAnchor: 1,
      })

      markersRef.current.push(marker)
    })
  }, [items, kakaoMaps, mode])

  useEffect(() => {
    if (!mapInstanceRef.current || !kakaoMaps) return

    detailOverlayRef.current?.setMap(null)
    detailOverlayRef.current = null

    if (!selected) return

    const location = getItemLocation(selected)
    const content = document.createElement('div')
    content.className = 'rounded-3xl bg-white p-5 shadow-soft'
    Object.assign(content.style, {
      boxSizing: 'border-box',
      maxWidth: 'calc(100vw - 48px)',
      overflow: 'hidden',
      position: 'relative',
      width: '320px',
    })
    content.innerHTML = `
      <button type="button" aria-label="닫기" class="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900">×</button>
      <div class="mb-3 flex items-center gap-2 text-ku-700">
        <strong>${CATEGORY_LABEL[selected.category]}</strong>
        <span class="text-sm font-medium text-zinc-500">${mode === 'found' ? '습득물' : '분실물'}</span>
      </div>
      <dl class="grid grid-cols-[76px_1fr] gap-y-2 text-sm">
        <dt class="text-zinc-500">${mode === 'found' ? '발견 장소' : '분실 장소'}</dt>
        <dd class="font-medium">${location.name}</dd>
        <dt class="text-zinc-500">${mode === 'found' ? '발견 날짜' : '분실 날짜'}</dt>
        <dd class="font-medium">${getItemDate(selected)}</dd>
        ${selected.contact?.public === 1 ? `<dt class="text-zinc-500">연락수단</dt><dd class="font-medium">${selected.contact.detail}</dd>` : ''}
      </dl>
      ${mode === 'lost'
        ? `<p class="mt-4 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500" style="box-sizing:border-box;max-width:100%;overflow-wrap:anywhere;white-space:normal;word-break:keep-all;">${selected.description}</p>`
        : ''
      }
    `
    content.querySelector('button')?.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      setSelected(null)
    })

    detailOverlayRef.current = new kakaoMaps.CustomOverlay({
      map: mapInstanceRef.current,
      position: new kakaoMaps.LatLng(location.latitude, location.longitude),
      content,
      xAnchor: 0.5,
      yAnchor: 1.35,
    })

    return () => {
      detailOverlayRef.current?.setMap(null)
      detailOverlayRef.current = null
    }
  }, [selected, kakaoMaps, mode])

  return (
    <div className="relative h-[700px] overflow-hidden rounded-3xl border border-zinc-200 bg-[#eef1ee]">
      <div ref={mapRef} className="absolute inset-0" />
      <div className="absolute left-5 top-5 z-10 rounded-2xl bg-white/90 p-3 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1">
          {[
            ['found', '습득 지도'],
            ['lost', '분실 지도'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value as MapMode)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === value ? 'bg-[#401408] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#eef1ee] p-6 text-center">
          <div className="max-w-sm rounded-3xl bg-white p-6 shadow-soft">
            <p className="font-bold text-zinc-900">지도를 불러올 수 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{error}</p>
          </div>
        </div>
      )}

    </div>
  )
}
