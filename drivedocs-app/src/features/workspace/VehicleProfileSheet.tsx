import { useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import type { VehicleProfile, FuelType } from '@/entities/types/domain'

const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: 'Бензин',
  diesel: 'Дизель',
  electric: 'Электро',
  hybrid: 'Гибрид',
}

const FUEL_OPTIONS: FuelType[] = ['gasoline', 'diesel', 'electric', 'hybrid']

interface VehicleProfileSheetProps {
  workspaceId: string
  profile: VehicleProfile
  onClose: () => void
}

export function VehicleProfileSheet({ workspaceId, profile, onClose }: VehicleProfileSheetProps) {
  const updateVehicleProfile = useWorkspaceStore((s) => s.updateVehicleProfile)

  const [form, setForm] = useState({
    make: profile.make ?? '',
    model: profile.model ?? '',
    year: String(profile.year ?? ''),
    licensePlate: profile.licensePlate ?? '',
    vin: profile.vin ?? '',
    engineVolume: profile.engineVolume ? String(profile.engineVolume) : '',
    enginePowerHp: profile.enginePowerHp ? String(profile.enginePowerHp) : '',
    vehicleCategory: profile.vehicleCategory ?? 'B',
    fuelType: profile.fuelType ?? 'gasoline' as FuelType,
    fuelConsumptionPer100km: profile.fuelConsumptionPer100km ? String(profile.fuelConsumptionPer100km) : '',
    ownerFullName: profile.ownerFullName ?? '',
    ptsNumber: profile.ptsNumber ?? '',
    stsNumber: profile.stsNumber ?? '',
    stsDate: profile.stsDate ?? '',
    osagoNumber: profile.osagoNumber ?? '',
    osagoInsurer: profile.osagoInsurer ?? '',
    osagoExpires: profile.osagoExpires ?? '',
    kaskoNumber: profile.kaskoNumber ?? '',
    kaskoInsurer: profile.kaskoInsurer ?? '',
    kaskoExpires: profile.kaskoExpires ?? '',
  })

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = () => {
    updateVehicleProfile(workspaceId, {
      make: form.make.trim(),
      model: form.model.trim(),
      year: parseInt(form.year) || profile.year,
      licensePlate: form.licensePlate.trim(),
      vin: form.vin.trim() || undefined,
      engineVolume: form.engineVolume ? parseFloat(form.engineVolume) : undefined,
      enginePowerHp: form.enginePowerHp ? parseFloat(form.enginePowerHp) : undefined,
      vehicleCategory: form.vehicleCategory.trim() || undefined,
      fuelType: form.fuelType,
      fuelConsumptionPer100km: form.fuelConsumptionPer100km
        ? parseFloat(form.fuelConsumptionPer100km)
        : undefined,
      ownerFullName: form.ownerFullName.trim() || undefined,
      ptsNumber: form.ptsNumber.trim() || undefined,
      stsNumber: form.stsNumber.trim() || undefined,
      stsDate: form.stsDate || undefined,
      osagoNumber: form.osagoNumber.trim() || undefined,
      osagoInsurer: form.osagoInsurer.trim() || undefined,
      osagoExpires: form.osagoExpires || undefined,
      kaskoNumber: form.kaskoNumber.trim() || undefined,
      kaskoInsurer: form.kaskoInsurer.trim() || undefined,
      kaskoExpires: form.kaskoExpires || undefined,
    })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Профиль автомобиля</h2>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">
          {/* Основные данные */}
          <Section title="Основные данные">
            <Row label="Марка">
              <input className={cls} value={form.make} onChange={(e) => set({ make: e.target.value })} placeholder="Toyota" />
            </Row>
            <Row label="Модель">
              <input className={cls} value={form.model} onChange={(e) => set({ model: e.target.value })} placeholder="Camry" />
            </Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Год">
                <input className={cls} type="text" inputMode="numeric" value={form.year}
                  onChange={(e) => set({ year: e.target.value })} placeholder="2020" />
              </Row>
              <Row label="Категория ТС">
                <input className={cls} value={form.vehicleCategory}
                  onChange={(e) => set({ vehicleCategory: e.target.value })} placeholder="B" />
              </Row>
            </div>
            <Row label="Гос. номер">
              <input className={cls} value={form.licensePlate}
                onChange={(e) => set({ licensePlate: e.target.value.toUpperCase() })}
                placeholder="А123БВ 77" />
            </Row>
            <Row label="Владелец (ФИО)">
              <input className={cls} value={form.ownerFullName}
                onChange={(e) => set({ ownerFullName: e.target.value })} placeholder="Иванов Иван Иванович" />
            </Row>
          </Section>

          {/* Двигатель и топливо */}
          <Section title="Двигатель и топливо">
            <div className="grid grid-cols-2 gap-3">
              <Row label="Объём двигателя, куб.см">
                <input className={cls} type="text" inputMode="decimal" value={form.engineVolume}
                  onChange={(e) => set({ engineVolume: e.target.value })} placeholder="1998" />
              </Row>
              <Row label="Мощность, л.с.">
                <input className={cls} type="text" inputMode="decimal" value={form.enginePowerHp}
                  onChange={(e) => set({ enginePowerHp: e.target.value })} placeholder="150" />
              </Row>
            </div>
            <Row label="Тип топлива">
              <div className="grid grid-cols-2 gap-2">
                {FUEL_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set({ fuelType: f })}
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                      form.fuelType === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {FUEL_LABELS[f]}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Расход топлива, л/100 км">
              <input className={cls} type="text" inputMode="decimal" value={form.fuelConsumptionPer100km}
                onChange={(e) => set({ fuelConsumptionPer100km: e.target.value })} placeholder="8.5" />
            </Row>
          </Section>

          {/* ПТС и СТС */}
          <Section title="ПТС и СТС">
            <Row label="VIN">
              <input className={cls} value={form.vin}
                onChange={(e) => set({ vin: e.target.value.toUpperCase() })}
                placeholder="XTA..." maxLength={17} />
            </Row>
            <Row label="Номер ПТС (серия и номер)">
              <input className={cls} value={form.ptsNumber}
                onChange={(e) => set({ ptsNumber: e.target.value })} placeholder="78УА 123456" />
            </Row>
            <Row label="Номер СТС">
              <input className={cls} value={form.stsNumber}
                onChange={(e) => set({ stsNumber: e.target.value })} placeholder="78 АА 123456" />
            </Row>
            <Row label="Дата регистрации СТС">
              <input className={cls} type="date" value={form.stsDate}
                onChange={(e) => set({ stsDate: e.target.value })} />
            </Row>
          </Section>

          {/* ОСАГО */}
          <Section title="ОСАГО">
            <Row label="Номер полиса ОСАГО">
              <input className={cls} value={form.osagoNumber}
                onChange={(e) => set({ osagoNumber: e.target.value })} placeholder="МММ 1234567890" />
            </Row>
            <Row label="Страховщик">
              <input className={cls} value={form.osagoInsurer}
                onChange={(e) => set({ osagoInsurer: e.target.value })} placeholder="РЕСО-Гарантия" />
            </Row>
            <Row label="Срок действия до">
              <input className={cls} type="date" value={form.osagoExpires}
                onChange={(e) => set({ osagoExpires: e.target.value })} />
            </Row>
          </Section>

          {/* КАСКО */}
          <Section title="КАСКО (необязательно)">
            <Row label="Номер полиса КАСКО">
              <input className={cls} value={form.kaskoNumber}
                onChange={(e) => set({ kaskoNumber: e.target.value })} placeholder="..." />
            </Row>
            <Row label="Страховщик">
              <input className={cls} value={form.kaskoInsurer}
                onChange={(e) => set({ kaskoInsurer: e.target.value })} placeholder="..." />
            </Row>
            <Row label="Срок действия до">
              <input className={cls} type="date" value={form.kaskoExpires}
                onChange={(e) => set({ kaskoExpires: e.target.value })} />
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
