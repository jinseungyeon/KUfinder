import { useEffect, useRef, useState } from 'react'
import { Map } from 'lucide-react'
import type { LocationInfo } from '../types/item'

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
    addListener: (target: KakaoMap, type: string, callback: (event: { latLng: KakaoLatLng }) => void) => void
  }
}

let kakaoMapsPromise: Promise<KakaoMaps> | null = null
const MAX_ZOOM_OUT_LEVEL = 5
const CAMPUS_BOUNDS = {
  south: 37.5808,
  west: 127.0218,
  north: 37.5915,
  east: 127.0368,
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

function getKakaoGlobal() {
  return (window as unknown as { kakao?: { maps: KakaoMaps } }).kakao
}

function loadKakaoMaps() {
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY

  if (!appKey) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다.'))
  }

  const kakao = getKakaoGlobal()

  if (kakao?.maps) {
    return new Promise<KakaoMaps>((resolve) => {
      kakao.maps.load(() => resolve(kakao.maps))
    })
  }

  if (!kakaoMapsPromise) {
    kakaoMapsPromise = new Promise<KakaoMaps>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
      script.async = true
      script.onload = () => {
        const loadedKakao = getKakaoGlobal()
        if (!loadedKakao?.maps) {
          reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.'))
          return
        }

        loadedKakao.maps.load(() => resolve(loadedKakao.maps))
      }
      script.onerror = () => reject(new Error('Kakao Maps SDK 스크립트 로드에 실패했습니다.'))
      document.head.appendChild(script)
    })
  }

  return kakaoMapsPromise
}

function createLocationPin() {
  const pin = document.createElement('div')
  pin.innerHTML = `
    <div style="display:grid;height:42px;width:42px;place-items:center;color:#401408;filter:drop-shadow(0 6px 10px rgba(0,0,0,.24));">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="#7a2011" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3" fill="white" stroke="#7a2011"></circle>
      </svg>
    </div>
  `
  return pin
}

interface Props {
  label: string
  value: LocationInfo
  onChange: (location: LocationInfo) => void
}

export default function LocationSelector({ label, value, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<KakaoMap | null>(null)
  const pinRef = useRef<KakaoMapOverlay | null>(null)
  const latestValueRef = useRef(value)
  const [kakaoMaps, setKakaoMaps] = useState<KakaoMaps | null>(null)
  const [error, setError] = useState('')
  const [isMapOpen, setIsMapOpen] = useState(false)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  useEffect(() => {
    if (!isMapOpen) return

    let cancelled = false

    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return

        const center = new maps.LatLng(value.latitude, value.longitude)
        mapInstanceRef.current = new maps.Map(mapRef.current, { center, level: 4 })
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
        maps.event.addListener(mapInstanceRef.current, 'click', (event) => {
          onChange({
            ...latestValueRef.current,
            latitude: event.latLng.getLat(),
            longitude: event.latLng.getLng(),
          })
        })
        setKakaoMaps(maps)
        setError('')
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      pinRef.current?.setMap(null)
      pinRef.current = null
      mapInstanceRef.current = null
    }
  }, [isMapOpen])

  useEffect(() => {
    if (!mapInstanceRef.current || !kakaoMaps) return

    const position = new kakaoMaps.LatLng(value.latitude, value.longitude)
    mapInstanceRef.current.setCenter(position)
    pinRef.current?.setMap(null)
    pinRef.current = new kakaoMaps.CustomOverlay({
      map: mapInstanceRef.current,
      position,
      content: createLocationPin(),
      xAnchor: 0.5,
      yAnchor: 1,
    })
  }, [kakaoMaps, value.latitude, value.longitude])

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{label}</label>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3">
          <button
            type="button"
            onClick={() => setIsMapOpen((open) => !open)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#401408] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2e0e05]"
          >
            <Map size={17} />
            지도에서 선택
          </button>
          <p className="mt-2 text-center text-xs text-zinc-500">
            선택 좌표: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </p>
        </div>
      </div>

      <div>
        <label className="label">장소 설명</label>
        <textarea
          className="input min-h-24 resize-y"
          value={value.description ?? ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="예: SK미래관 B1 여자화장실 앞, 정운오IT교양관 1층 로비 등"
        />
      </div>

      {isMapOpen && (
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-[#eef1ee]">
          <div ref={mapRef} className="h-72 w-full" />
          {error && (
            <div className="grid min-h-40 place-items-center p-5 text-center text-sm text-zinc-500">
              {error}
            </div>
          )}
          {/* <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 bg-white px-4 py-3 text-xs text-zinc-500">
            <span>지도를 클릭해서 좌표를 지정하세요. 선택 좌표: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</span>
            <button type="button" className="font-bold text-[#401408]" onClick={() => setIsMapOpen(false)}>
              닫기
            </button>
          </div> */}
        </div>
      )}
    </div>
  )
}
