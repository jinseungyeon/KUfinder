import { ArrowRight, Box, Map, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <main>
      <section className="content-wrap py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex rounded-full bg-ku-50 px-3 py-1 text-sm font-semibold text-ku-700">고려대학교 안암캠퍼스 분실물 매칭 서비스</span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-zinc-950 sm:text-6xl">
              잃어버린 물건을<br />AI로 더 빠르게 찾으세요.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              분실물의 사진과 설명을 등록하면 이미지·텍스트 정보를 바탕으로 습득물 후보를 비교하고, 필요할 경우 추가 질문으로 후보를 좁혀갑니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/lost/register" className="btn-primary"><Search size={18} /> 분실물 찾기 <ArrowRight size={17} /></Link>
              <Link to="/found/register" className="btn-secondary"><Box size={18} /> 습득물 등록</Link>
            </div>
          </div>

          <div className="card overflow-hidden p-4">
            <div className="relative h-[360px] overflow-hidden rounded-[22px] bg-[#edf0ed]">
              <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(35deg, transparent 48%, #d6dbd5 49%, #d6dbd5 51%, transparent 52%)', backgroundSize: '120px 110px' }} />
              <div className="absolute left-[14%] top-[17%] h-28 w-44 rotate-[-8deg] rounded-3xl bg-white/80" />
              <div className="absolute right-[8%] top-[29%] h-32 w-40 rotate-[5deg] rounded-3xl bg-white/80" />
              {[
                ['📱', '54%', '31%'], ['👛', '33%', '48%'], ['🎒', '62%', '64%'], ['🔑', '44%', '73%'],
              ].map(([emoji, left, top]) => (
                <div key={`${left}-${top}`} className="absolute grid h-12 w-12 place-items-center rounded-2xl border-4 border-white bg-ku-700 text-xl shadow-lg" style={{ left, top }}>{emoji}</div>
              ))}
              <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 font-bold"><Map size={18} className="text-ku-700" /> 습득 위치 기반 지도</div>
                <p className="mt-1 text-xs text-zinc-500">실제 사진 대신 카테고리 아이콘으로 표시</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-wrap pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['01', '정보 등록', '분실자와 습득자가 위치, 카테고리, 설명, 사진 등의 정보를 등록합니다.'],
            ['02', 'AI 매칭', '이미지와 텍스트를 함께 비교해 유사한 습득물 후보를 정렬합니다.'],
            ['03', '확인 및 연결', '가능성이 높은 후보를 실제 사진으로 확인하고 보관 장소 또는 연락 수단을 안내합니다.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="card p-6">
              <span className="text-sm font-black text-ku-700">{num}</span>
              <h2 className="mt-2 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
