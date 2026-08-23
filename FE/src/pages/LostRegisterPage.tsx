import { useState, type FormEvent } from 'react'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ImageUploader'
import LocationSelector from '../components/LocationSelector'
import BackButton from '../components/BackButton'
import { createLostItem } from '../api/items'
import { CATEGORY_LABEL, type ItemCategory, type LocationInfo } from '../types/item'

const defaultLocation: LocationInfo = { name: '하나스퀘어 B1', latitude: 37.5836, longitude: 127.0254 }

export default function LostRegisterPage() {
  const navigate = useNavigate()
  const [location, setLocation] = useState(defaultLocation)
  const [category, setCategory] = useState<ItemCategory>('electronics')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [image, setImage] = useState<File>()
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!description.trim() && !image) return alert('사진 또는 설명 중 하나는 입력해주세요.')
    setLoading(true)
    try {
      const result = await createLostItem({ category, description, lostLocation: location, contact })
      // 실제 백엔드 연결 시 image는 multipart 업로드 구조로 조정하면 됩니다.
      void image
      navigate(`/matching?lostItemId=${result.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="content-wrap max-w-3xl">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-3xl font-black">분실물 찾기</h1>
        <p className="mt-2 text-zinc-600">기억나는 정보만 입력해도 됩니다. 사진 또는 설명 중 하나는 필요합니다.</p>
      </div>

      <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8">
        <LocationSelector label="분실 추정 장소" value={location} onChange={setLocation} />

        <div>
          <label className="label">카테고리</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)}>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">물건 설명</label>
          <textarea className="input min-h-36 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="예: 검정색 무선 이어폰, 케이스에 흰색 스티커가 붙어 있음" />
        </div>

        <ImageUploader onChange={setImage} />

        <div>
          <label className="label">연락처 / 연락 수단</label>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="매칭 완료 후 사용할 연락 수단" />
          <label className="mt-3 flex items-center gap-2 text-sm text-zinc-600"><input type="checkbox" defaultChecked /> 매칭이 이루어졌을 때만 공개</label>
        </div>

        <button className="btn-primary w-full" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={18} /> 등록 중...</> : <><Sparkles size={18} /> AI로 찾아보기</>}</button>
      </form>
    </main>
  )
}
