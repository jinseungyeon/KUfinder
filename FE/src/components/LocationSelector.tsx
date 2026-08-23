import { MapPin } from 'lucide-react'
import type { LocationInfo } from '../types/item'

const locations: LocationInfo[] = [
  { name: '하나스퀘어 B1', latitude: 37.5836, longitude: 127.0254 },
  { name: '중앙광장', latitude: 37.5844, longitude: 127.0263 },
  { name: '과학도서관 앞', latitude: 37.5829, longitude: 127.0268 },
  { name: '애기능생활관', latitude: 37.5818, longitude: 127.0262 },
  { name: '우정정보관', latitude: 37.5832, longitude: 127.0258 },
]

interface Props {
  label: string
  value: LocationInfo
  onChange: (location: LocationInfo) => void
}

export default function LocationSelector({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-4 top-3.5 text-ku-700" size={19} />
        <select
          className="input appearance-none pl-11"
          value={value.name}
          onChange={(e) => onChange(locations.find((x) => x.name === e.target.value) ?? locations[0])}
        >
          {locations.map((location) => <option key={location.name}>{location.name}</option>)}
        </select>
      </div>
      <p className="mt-2 text-xs text-zinc-500">현재는 대표 장소 목록으로 구현되어 있습니다. 실제 지도 선택 UI로 교체하면 됩니다.</p>
    </div>
  )
}
