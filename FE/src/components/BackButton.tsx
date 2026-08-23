import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BackButton() {
  const navigate = useNavigate()

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-5 inline-flex items-center gap-2  px-4 py-2 text-sm font-bold text-[#401408]"
    >
      <ArrowLeft size={17} />
      돌아가기
    </button>
  )
}
