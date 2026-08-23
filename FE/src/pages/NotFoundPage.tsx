import { Link } from 'react-router-dom'
import BackButton from '../components/BackButton'

export default function NotFoundPage() {
  return <main className="content-wrap"><BackButton /><div className="card p-10 text-center"><h1 className="text-3xl font-black">페이지를 찾을 수 없습니다.</h1><Link className="btn-primary mt-5" to="/">홈으로</Link></div></main>
}
