import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
      <h1 className="text-lg font-semibold text-slate-700 mb-2">Страница не найдена</h1>
      <p className="text-sm text-slate-500 mb-6">Такой страницы не существует</p>
      <button
        onClick={() => navigate(-1)}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl"
      >
        Назад
      </button>
    </div>
  )
}
