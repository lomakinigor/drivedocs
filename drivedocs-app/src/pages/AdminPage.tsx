import { Navigate } from 'react-router-dom'
import { Users, Route, FileText, Receipt, TrendingUp, Database, BarChart2, Activity } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { isBackendConfigured } from '@/lib/supabase'

// ─── Admin access guard ───────────────────────────────────────────────────────

const ADMIN_EMAIL = 'claudesecond2026@gmail.com'

function useIsAdmin(): boolean | null {
  const user = useWorkspaceStore((s) => s.user)
  const authChecked = useWorkspaceStore((s) => s.authChecked)

  // localStorage mode: always allow (dev only)
  if (!isBackendConfigured) return true

  if (!authChecked) return null   // loading
  return user.email === ADMIN_EMAIL
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Feature usage row ────────────────────────────────────────────────────────

interface FeatureRowProps {
  label: string
  description: string
}

function FeatureRow({ label, description }: FeatureRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-200 rounded-full w-0" />
        </div>
        <span className="text-xs text-slate-400 w-6 text-right">—</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const isAdmin = useIsAdmin()

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Только для разработчика</p>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">Аналитика бета-версии</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Backend notice */}
        {!isBackendConfigured && (
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Database size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">База данных не подключена</p>
              <p className="text-xs text-amber-700 mt-1">
                Реальные данные появятся после подключения Supabase.{' '}
                <span className="font-medium">Помни: при выборе БД — используй российский хостинг (Selectel, Timeweb, Яндекс.Облако).</span>
              </p>
            </div>
          </div>
        )}

        {/* Overview stats */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Обзор</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Users size={16} />}
              label="Пользователи"
              value="—"
              sub="нет данных"
            />
            <StatCard
              icon={<Activity size={16} />}
              label="Активных за 7 дней"
              value="—"
              sub="нет данных"
            />
            <StatCard
              icon={<Route size={16} />}
              label="Поездок"
              value="—"
              sub="всего в системе"
            />
            <StatCard
              icon={<Receipt size={16} />}
              label="Расходов"
              value="—"
              sub="записано"
            />
          </div>
        </section>

        {/* Feature usage */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Использование фич</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4">
            <FeatureRow label="Поездки" description="пользователей, добавивших ≥1 поездку" />
            <FeatureRow label="Расходы" description="пользователей, добавивших ≥1 расход" />
            <FeatureRow label="Документы" description="пользователей, открывших раздел" />
            <FeatureRow label="События" description="пользователей с активными событиями" />
            <FeatureRow label="Настройки авто" description="заполнили профиль автомобиля" />
            <FeatureRow label="Онбординг пройден" description="от всех зарегистрированных" />
          </div>
        </section>

        {/* Retention stub */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Активность</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-slate-100 rounded-t"
                  style={{ height: '20%' }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-slate-400">14 дней назад</p>
              <p className="text-xs text-slate-400">Сегодня</p>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Данные DAU появятся после подключения БД
            </p>
          </div>
        </section>

        {/* Documents usage */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Документы</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4">
            <FeatureRow label="Приказ о компенсации" description="оформлено / требуется" />
            <FeatureRow label="Журнал поездок" description="ведётся / требуется" />
            <FeatureRow label="Договор аренды" description="подписано / требуется" />
            <FeatureRow label="Путевые листы" description="заполнено за текущий месяц" />
          </div>
        </section>

        <p className="text-xs text-slate-300 text-center pb-4">
          drivedocs admin · beta · только для разработчика
        </p>
      </div>
    </div>
  )
}
