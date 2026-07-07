import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LEGAL_DOCUMENTS, type LegalDocument } from '@/entities/config/legalContent'

export function LegalPage() {
  const { doc } = useParams<{ doc: string }>()
  const document = LEGAL_DOCUMENTS[doc as LegalDocument['slug']]

  if (!document) {
    return <Navigate to="/welcome" replace />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 active:text-slate-700 mb-6"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">{document.title}</h1>
        <p className="text-xs text-slate-500 mb-8">
          Действует с {new Date(document.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-6">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-sm font-bold text-slate-900 mb-2">{section.heading}</h2>
              <div className="space-y-2">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/legal/offer" className="text-xs text-blue-600 active:text-blue-800">Оферта</Link>
          <Link to="/legal/privacy" className="text-xs text-blue-600 active:text-blue-800">Политика ПД</Link>
          <Link to="/legal/consent" className="text-xs text-blue-600 active:text-blue-800">Согласие на обработку ПД</Link>
        </div>
      </div>
    </div>
  )
}
