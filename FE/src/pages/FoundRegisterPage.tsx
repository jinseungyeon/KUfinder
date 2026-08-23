import { useState, type FormEvent } from 'react'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ImageUploader'
import LocationSelector from '../components/LocationSelector'
import BackButton from '../components/BackButton'
import { createFoundItem } from '../api/items'
import { CATEGORY_LABEL, type ItemCategory, type LocationInfo } from '../types/item'

const defaultLocation: LocationInfo = { name: '하나스퀘어 B1', latitude: 37.5836, longitude: 127.0254 }

export default function FoundRegisterPage() {
  const navigate = useNavigate()
  const [location, setLocation] = useState(defaultLocation)
  const [category, setCategory] = useState<ItemCategory>('electronics')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [storagePlace, setStoragePlace] = useState('')
  const [image, setImage] = useState<File>()
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData()
      form.append('locationName', location.name)
      form.append('latitude', String(location.latitude))
      form.append('longitude', String(location.longitude))
      form.append('category', category)
      form.append('description', description)
      form.append('contact', contact)
      form.append('storagePlace', storagePlace)
      if (image) form.append('image', image)
      await createFoundItem(form)
      navigate('/map', { state: { registered: true } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="content-wrap max-w-3xl">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-3xl font-black">습득물 등록</h1>
        <p className="mt-2 text-zinc-600">주운 물건의 특징과 발견 장소를 등록해주세요.</p>
      </div>

      <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8">
        <LocationSelector label="습득 장소" value={location} onChange={setLocation} />

        <div>
          <label className="label">카테고리</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)}>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">상세 설명</label>
          <textarea className="input min-h-36 resize-y" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="색상, 브랜드, 스티커, 흠집 등 구별 가능한 특징을 적어주세요." />
        </div>

        <ImageUploader required onChange={setImage} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">보관 장소</label>
            <input className="input" value={storagePlace} onChange={(e) => setStoragePlace(e.target.value)} placeholder="예: 하나스퀘어 안내데스크" />
          </div>
          <div>
            <label className="label">연락처 / 연락 수단</label>
            <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="예: 카카오톡 오픈채팅 / 전화번호" />
          </div>
        </div>

        <div className="rounded-2xl bg-ku-50 p-4 text-sm leading-6 text-ku-900">
          <div className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><span>지도에서는 실제 사진을 바로 공개하지 않고 카테고리와 습득 위치만 보여주는 흐름을 가정했습니다.</span></div>
        </div>

        <button className="btn-primary w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={18} /> 등록 중...</> : '등록하기'}</button>
      </form>
    </main>
  )
}
