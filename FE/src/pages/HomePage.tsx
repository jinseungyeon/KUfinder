import {
  ArrowRight,
  Box,
  Camera,
  CheckCircle2,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const processSteps = [
  ['01', '정보 등록', '분실자와 습득자가 위치, 카테고리, 설명, 사진 등의 정보를 등록합니다.'],
  ['02', 'AI 매칭', '이미지와 텍스트를 함께 비교해 유사한 습득물 후보를 정렬합니다.'],
  ['03', '확인 및 연결', '가능성이 높은 후보를 실제 사진으로 확인하고 보관 장소 또는 연락 수단을 안내합니다.'],
]

export default function HomePage() {
  return (
    <main>
      <section className="content-wrap py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#f6dee3] px-4 py-2 text-sm font-bold text-[#401408]">
              고려대학교 안암캠퍼스 분실물 매칭 서비스
            </span>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#191a23] sm:text-5xl">
              잃어버린 물건을<br />AI로 더 빠르게 찾으세요.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              분실물의 사진과 설명을 등록하면 이미지와 텍스트 정보를 바탕으로 습득물 후보를 비교하고,
              필요할 경우 추가 질문으로 후보를 좁혀갑니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/lost/register" className="btn-primary bg-[#401408] hover:bg-[#2e0e05]">
                <Search size={18} /> 분실물 찾기 <ArrowRight size={17} />
              </Link>
              <Link to="/found/register" className="btn-secondary border-[#401408]/15 bg-white text-[#401408] hover:bg-[#fff8f8]">
                <Box size={18} /> 습득물 등록
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4">
              {[
                ['17분', '평균 확인'],
                ['92%', '상위 유사도'],
                ['24곳', '캠퍼스 지점'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-[#401408]/10 bg-white px-4 py-4 shadow-soft">
                  <p className="text-2xl font-black text-[#401408]">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden bg-[#401408] p-4">
            <div className="relative h-[390px] overflow-hidden rounded-[28px] bg-[#f6dee3]">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage: 'linear-gradient(35deg, transparent 48%, rgba(64,20,8,0.16) 49%, rgba(64,20,8,0.16) 51%, transparent 52%)',
                  backgroundSize: '120px 110px',
                }}
              />
              <div className="absolute bottom-0 right-0 h-[70%] w-[78%] rounded-tl-[90px] bg-white/70" />
              <div className="absolute right-[10%] top-[22%] h-20 w-[58%] -rotate-6 rounded-[32px] bg-[#401408]" />
              <div className="absolute bottom-[22%] right-[15%] grid grid-cols-3 gap-3">
                {[
                  ['📱', 'bg-white'],
                  ['👛', 'bg-[#fff7f8]'],
                  ['🎒', 'bg-white'],
                  ['🔑', 'bg-[#fff7f8]'],
                  ['⌚', 'bg-white'],
                  ['💳', 'bg-[#fff7f8]'],
                ].map(([item, color]) => (
                  <div key={item} className={`grid h-14 w-14 place-items-center rounded-2xl border border-[#401408]/10 ${color} text-2xl shadow-sm`}>
                    {item}
                  </div>
                ))}
              </div>

              <div className="absolute left-5 top-5 w-[230px] rounded-[28px] bg-white/95 p-5 shadow-[0_18px_55px_rgba(64,20,8,0.18)]">
                <p className="text-sm font-bold text-zinc-400">Search options</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1f1f1] text-[#401408]"><MapPin size={20} /></span>
                    <div>
                      <p className="text-xs text-zinc-500">위치</p>
                      <p className="text-sm font-black">안암캠퍼스</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1f1f1] text-[#401408]"><Camera size={20} /></span>
                    <div>
                      <p className="text-xs text-zinc-500">비교 정보</p>
                      <p className="text-sm font-black">사진 + 설명</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 rounded-[28px] bg-white/95 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 font-black text-[#191a23]">
                  <Map size={18} className="text-[#275738]" /> 습득 위치 기반 지도
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">건물별 습득물 후보를 한 화면에서 확인</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-wrap pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {processSteps.map(([num, title, desc], index) => (
            <div key={num} className="card p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-black text-[#401408]">{num}</span>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f6dee3] text-[#401408]">
                  {index === 0 && <CheckCircle2 size={21} />}
                  {index === 1 && <Sparkles size={21} />}
                  {index === 2 && <ShieldCheck size={21} />}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black text-[#191a23]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
