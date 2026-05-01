import { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspaceStore, useOrgProfile } from '@/app/store/workspaceStore'
import type { EntityType } from '@/entities/types/domain'

interface OrgProfileSheetProps {
  workspaceId: string
  entityType: EntityType
  onClose: () => void
}

export function OrgProfileSheet({ workspaceId, entityType, onClose }: OrgProfileSheetProps) {
  const addOrgProfile = useWorkspaceStore((s) => s.addOrgProfile)
  const existing = useOrgProfile(workspaceId)

  const [form, setForm] = useState({
    organizationName: existing?.organizationName ?? '',
    ownerFullName: existing?.ownerFullName ?? '',
    inn: existing?.inn ?? '',
    kpp: existing?.kpp ?? '',
    ogrn: existing?.ogrn ?? '',
    address: existing?.address ?? '',
    city: existing?.city ?? '',
    phone: existing?.phone ?? '',
    email: existing?.email ?? '',
    bankName: existing?.bankName ?? '',
    bankBik: existing?.bankBik ?? '',
    bankAccount: existing?.bankAccount ?? '',
    bankCorAccount: existing?.bankCorAccount ?? '',
    accountantName: existing?.accountantName ?? '',
  })

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = () => {
    addOrgProfile({
      workspaceId,
      entityType,
      organizationName: form.organizationName.trim() || undefined,
      ownerFullName: form.ownerFullName.trim() || undefined,
      inn: form.inn.trim() || undefined,
      kpp: form.kpp.trim() || undefined,
      ogrn: form.ogrn.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      bankName: form.bankName.trim() || undefined,
      bankBik: form.bankBik.trim() || undefined,
      bankAccount: form.bankAccount.trim() || undefined,
      bankCorAccount: form.bankCorAccount.trim() || undefined,
      accountantName: form.accountantName.trim() || undefined,
    })
    onClose()
  }

  const isIP = entityType === 'IP'

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">
            {isIP ? 'Реквизиты ИП' : 'Реквизиты организации'}
          </h2>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">

          {/* Основные данные */}
          <Section title="Основные данные">
            {!isIP && (
              <Row label="Полное наименование организации">
                <input
                  className={cls}
                  value={form.organizationName}
                  onChange={(e) => set({ organizationName: e.target.value })}
                  placeholder='ООО "Ромашка"'
                />
              </Row>
            )}
            <Row label={isIP ? 'ФИО предпринимателя' : 'ФИО руководителя'}>
              <input
                className={cls}
                value={form.ownerFullName}
                onChange={(e) => set({ ownerFullName: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </Row>
            <Row label="Город">
              <input
                className={cls}
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
                placeholder="Москва"
              />
            </Row>
            <Row label="Юридический адрес">
              <input
                className={cls}
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="г. Москва, ул. Ленина, д. 1, оф. 10"
              />
            </Row>
          </Section>

          {/* Регистрационные данные */}
          <Section title="Регистрационные данные">
            <Row label="ИНН">
              <input
                className={cls}
                value={form.inn}
                inputMode="numeric"
                onChange={(e) => set({ inn: e.target.value })}
                placeholder={isIP ? '123456789012' : '7712345678'}
                maxLength={isIP ? 12 : 10}
              />
            </Row>
            {!isIP && (
              <Row label="КПП">
                <input
                  className={cls}
                  value={form.kpp}
                  inputMode="numeric"
                  onChange={(e) => set({ kpp: e.target.value })}
                  placeholder="771201001"
                  maxLength={9}
                />
              </Row>
            )}
            <Row label={isIP ? 'ОГРНИП' : 'ОГРН'}>
              <input
                className={cls}
                value={form.ogrn}
                inputMode="numeric"
                onChange={(e) => set({ ogrn: e.target.value })}
                placeholder={isIP ? '312345678901234' : '1027700000001'}
                maxLength={isIP ? 15 : 13}
              />
            </Row>
          </Section>

          {/* Банковские реквизиты */}
          <Section title="Банковские реквизиты">
            <Row label="Наименование банка">
              <input
                className={cls}
                value={form.bankName}
                onChange={(e) => set({ bankName: e.target.value })}
                placeholder="ПАО Сбербанк"
              />
            </Row>
            <Row label="БИК">
              <input
                className={cls}
                value={form.bankBik}
                inputMode="numeric"
                onChange={(e) => set({ bankBik: e.target.value })}
                placeholder="044525225"
                maxLength={9}
              />
            </Row>
            <Row label="Расчётный счёт">
              <input
                className={cls}
                value={form.bankAccount}
                inputMode="numeric"
                onChange={(e) => set({ bankAccount: e.target.value })}
                placeholder="40802810400000012345"
                maxLength={20}
              />
            </Row>
            <Row label="Корреспондентский счёт">
              <input
                className={cls}
                value={form.bankCorAccount}
                inputMode="numeric"
                onChange={(e) => set({ bankCorAccount: e.target.value })}
                placeholder="30101810400000000225"
                maxLength={20}
              />
            </Row>
          </Section>

          {/* Контакты */}
          <Section title="Контакты и бухгалтерия">
            <Row label="Телефон">
              <input
                className={cls}
                value={form.phone}
                type="tel"
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </Row>
            <Row label="Email">
              <input
                className={cls}
                value={form.email}
                type="email"
                onChange={(e) => set({ email: e.target.value })}
                placeholder="info@company.ru"
              />
            </Row>
            <Row label="ФИО главного бухгалтера">
              <input
                className={cls}
                value={form.accountantName}
                onChange={(e) => set({ accountantName: e.target.value })}
                placeholder="Смирнова А.В."
              />
            </Row>
          </Section>

          <div className="h-2" />
        </div>

        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-base font-semibold bg-blue-600 text-white active:bg-blue-700"
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  )
}

const cls = 'w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
