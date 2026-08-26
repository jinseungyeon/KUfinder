import { Camera, ImagePlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  onChange: (file?: File) => void
  required?: boolean
}

export default function ImageUploader({ onChange, required = false }: Props) {
  const [file, setFile] = useState<File>()
  const [preview, setPreview] = useState<string>()

  useEffect(() => {
    if (!file) {
      setPreview(undefined)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const update = (next?: File) => {
    setFile(next)
    onChange(next)
  }

  return (
    <div>
      <span className="label">사진 {required ? '(필수)' : '(선택)'}</span>
      {!preview ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-center transition hover:border-ku-500 hover:bg-ku-50">
            <ImagePlus className="mb-2 text-ku-700" />
            <span className="font-semibold">사진 선택</span>
            <span className="mt-1 text-xs text-zinc-500">JPG, PNG 등 이미지 파일</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => update(e.target.files?.[0])}
            />
          </label>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-center transition hover:border-ku-500 hover:bg-ku-50">
            <Camera className="mb-2 text-ku-700" />
            <span className="font-semibold">사진 촬영</span>
            <span className="mt-1 text-xs text-zinc-500">카메라로 촬영하기</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => update(e.target.files?.[0])}
            />
          </label>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200">
          <img src={preview} alt="업로드 미리보기" className="h-56 w-full object-cover" />
          <button type="button" onClick={() => update(undefined)} className="absolute right-3 top-3 rounded-full bg-black/65 p-2 text-white" aria-label="사진 삭제">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
