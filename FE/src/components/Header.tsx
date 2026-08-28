import { Link, NavLink } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function Header() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs font-semibold transition sm:text-sm ${isActive ? 'text-[#401408]' : 'text-zinc-500 hover:text-zinc-900'}`

  return (
    <header className="sticky top-0 z-40 border-b border-[#401408]/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-black tracking-tight text-[#401408]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#401408] text-white"><MapPin size={19} /></span>
          KU Finder
        </Link>
        <nav className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start sm:gap-6">
          <NavLink to="/map" className={navClass}>지도</NavLink>
          <NavLink to="/lost/register" className={navClass}>분실물 찾기</NavLink>
          <NavLink to="/found/register" className={navClass}>습득물 등록</NavLink>
          <NavLink to="/admin" className={navClass}>관리자</NavLink>
        </nav>
      </div>
    </header>
  )
}
