import { useState, type FormEvent } from 'react'
import { CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ImageUploader'
import LocationSelector from '../components/LocationSelector'
import BackButton from '../components/BackButton'
import { createFoundItem } from '../api/items'
import { CATEGORY_LABEL, type ItemCategory, type LocationInfo } from '../types/item'

const defaultLocation: LocationInfo = { name: '안암캠퍼스', latitude: 37.58704982196241, longitude: 127.02929004580606 }
const today = new Date().toISOString().slice(0, 10)

export default function FoundRegisterPage() {
  const navigate = useNavigate()
  const [location, setLocation] = useState(defaultLocation)
  const [category, setCategory] = useState<ItemCategory | ''>('')
  const [foundDate, setFoundDate] = useState(today)
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [storagePlace, setStoragePlace] = useState('')
  const [image, setImage] = useState<File>()
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!category) return alert('카테고리를 선택해주세요.')
    if (!image) return alert('습득물 사진을 등록해주세요.')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('locationName', location.name)
      form.append('locationDescription', location.description ?? '')
      form.append('latitude', String(location.latitude))
      form.append('longitude', String(location.longitude))
      form.append('category', category)
      form.append('description', description)
      form.append('foundDate', foundDate)
      form.append('contact', contact)
      form.append('storagePlace', storagePlace)
      if (image) form.append('image', image)
      const result = await createFoundItem(form)
      navigate(`/matching?foundItemId=${result.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="content-wrap max-w-3xl">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-3xl font-black">습득물 등록</h1>
        <p className="mt-2 text-zinc-600">주운 물건의 정보를 등록해주세요.</p>
      </div>

      <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8">
        <LocationSelector label="습득 장소" value={location} onChange={setLocation} />

        <div>
          <label className="label">습득 날짜</label>
          <input className="input" type="date" required value={foundDate} onChange={(e) => setFoundDate(e.target.value)} />
        </div>

        <div>
          <label className="label">카테고리</label>
          <select
            className={`input ${category ? 'text-zinc-900' : 'text-zinc-400'}`}
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory | '')}
          >
            <option value="" disabled>선택</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">상세 설명</label>
          <textarea className="input min-h-36 resize-y" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="색상, 브랜드, 스티커, 흠집 등 구별 가능한 특징을 적어주세요." />
        </div>

        <ImageUploader onChange={setImage} />

        <div>
          <label className="label">보관장소 (선택)</label>
          <input className="input" value={storagePlace} onChange={(e) => setStoragePlace(e.target.value)} placeholder="예: 하나스퀘어 안내데스크" />
        </div>

        <div>
          <label className="label">연락 수단</label>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="예: 010-xxxx-xxxx / instagram ID / 카카오톡 오픈채팅" />
        </div>

        <button className="btn-primary w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={18} /> 등록 중...</> : <><Sparkles size={18} /> AI로 찾아보기</>}</button>
      </form>
    </main>
  )
}
