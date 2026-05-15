import { useState } from 'react'
import { X, Plus, Trash2, UserCheck } from 'lucide-react'
import { useWorkspaceStore, useDrivers } from '@/app/store/workspaceStore'
import type { Driver } from '@/entities/types/domain'

interface DriversSheetProps {
  workspaceId: string
  onClose: () => void
}

export function DriversSheet({ workspaceId, onClose }: DriversSheetProps) {
  const drivers = useDrivers(workspaceId)
  const addDriver = useWorkspaceStore((s) => s.addDriver)
  const updateDriver = useWorkspaceStore((s) => s.updateDriver)
  const deleteDriver = useWorkspaceStore((s) => s.deleteDriver)

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  const handleSetDefault = (id: string) => {
    drivers.forEach((d) => updateDriver(d.id, { isDefault: d.id === id }))
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Водители</h2>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {drivers.length === 0 && editingId !== 'new' && (
            <p className="text-sm text-slate-500 text-center py-6">
              Водителей пока нет — добавьте первого
            </p>
          )}

          {drivers.map((driver) =>
            editingId === driver.id ? (
              <DriverForm
                key={driver.id}
                initial={driver}
                onSave={(patch) => {
                  updateDriver(driver.id, patch)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <DriverCard
                key={driver.id}
                driver={driver}
                onEdit={() => setEditingId(driver.id)}
                onDelete={() => deleteDriver(driver.id)}
                onSetDefault={() => handleSetDefault(driver.id)}
              />
            ),
          )}

          {editingId === 'new' && (
            <DriverForm
              onSave={(data) => {
                addDriver({
                  id: `driver-${Date.now()}`,
                  workspaceId,
                  isDefault: drivers.length === 0,
                  ...data,
                } as Driver)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          )}

          <button
            onClick={() => setEditingId('new')}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 active:border-blue-300 active:text-blue-500 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Добавить водителя</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Driver card ──────────────────────────────────────────────────────────────

function DriverCard({
  driver,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  driver: Driver
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${driver.isDefault ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {driver.fullName.slice(0, 1)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {driver.fullName}
          {driver.isDefault && (
            <span className="ml-2 text-xs font-medium text-blue-500">основной</span>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">ВУ: {driver.licenseNumber || '—'}</p>
        {driver.licenseExpires && (
          <p className="text-xs text-slate-500">
            Действует до: {new Date(driver.licenseExpires).toLocaleDateString('ru-RU')}
          </p>
        )}
        {driver.licenseCategories && (
          <p className="text-xs text-slate-500">Категории: {driver.licenseCategories}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!driver.isDefault && (
          <button
            onClick={onSetDefault}
            className="p-1.5 rounded-xl text-slate-300 active:text-blue-500 active:bg-blue-50"
            title="Сделать основным"
          >
            <UserCheck size={15} />
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 rounded-xl text-slate-500 active:bg-slate-100 text-xs font-medium"
        >
          Изм.
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-xl text-slate-300 active:text-red-500 active:bg-red-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Driver form ──────────────────────────────────────────────────────────────

type DriverFormData = Omit<Driver, 'id' | 'workspaceId'>

function DriverForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<DriverFormData>
  onSave: (data: DriverFormData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? '',
    licenseNumber: initial?.licenseNumber ?? '',
    licenseIssueDate: initial?.licenseIssueDate ?? '',
    licenseExpires: initial?.licenseExpires ?? '',
    licenseCategories: initial?.licenseCategories ?? '',
  })

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }))
  const ok = form.fullName.trim().length >= 2

  const handleSave = () => {
    if (!ok) return
    onSave({
      fullName: form.fullName.trim(),
      licenseNumber: form.licenseNumber.trim(),
      licenseIssueDate: form.licenseIssueDate || undefined,
      licenseExpires: form.licenseExpires || undefined,
      licenseCategories: form.licenseCategories.trim() || undefined,
    })
  }

  return (
    <div className="px-4 py-4 rounded-2xl border-2 border-blue-200 bg-blue-50/30 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {initial?.fullName ? 'Редактировать водителя' : 'Новый водитель'}
      </p>
      <Field label="ФИО">
        <input className={cls} value={form.fullName} onChange={(e) => patch({ fullName: e.target.value })} placeholder="Иванов Иван Иванович" autoFocus />
      </Field>
      <Field label="Серия и номер ВУ">
        <input className={cls} value={form.licenseNumber} onChange={(e) => patch({ licenseNumber: e.target.value })} placeholder="77 АА 123456" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата выдачи ВУ">
          <input className={cls} type="date" value={form.licenseIssueDate} onChange={(e) => patch({ licenseIssueDate: e.target.value })} />
        </Field>
        <Field label="Срок действия ВУ">
          <input className={cls} type="date" value={form.licenseExpires} onChange={(e) => patch({ licenseExpires: e.target.value })} />
        </Field>
      </div>
      <Field label="Открытые категории">
        <input className={cls} value={form.licenseCategories} onChange={(e) => patch({ licenseCategories: e.target.value })} placeholder="B, C" />
      </Field>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 active:bg-slate-50">
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={!ok}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${ok ? 'bg-blue-600 text-white active:bg-blue-700' : 'bg-slate-100 text-slate-500'}`}
        >
          Сохранить
        </button>
      </div>
    </div>
  )
}

const cls = 'w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-300 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
