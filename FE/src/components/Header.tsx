import { Link, NavLink } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function Header() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition ${isActive ? 'text-ku-700' : 'text-zinc-500 hover:text-zinc-900'}`

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-black tracking-tight text-ku-800">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ku-700 text-white"><MapPin size={19} /></span>
          KU Finder
        </Link>
        <nav className="flex items-center gap-5">
          <NavLink to="/map" className={navClass}>지도</NavLink>
          <NavLink to="/lost/register" className={navClass}>분실물 찾기</NavLink>
          <NavLink to="/found/register" className={navClass}>습득물 등록</NavLink>
        </nav>
      </div>
    </header>
  )
}
