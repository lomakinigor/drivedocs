import {
  useCurrentWorkspace,
  useVehicleProfile,
  useDrivers,
  useOrgProfile,
} from '@/app/store/workspaceStore'

// F-026 — минимальный набор данных для формирования путевого листа РФ
// (приказ Минтранса № 152).
//
// Правило 2026-05-13: essentials критичны — без них путевой лист недействителен.
// Пользователь НЕ может подтвердить «у меня уже есть» — только заполнить.
// Поле workspace.essentialsAck больше не используется (оставлено для миграции).

export interface EssentialBlock {
  key: 'org' | 'vehicle' | 'driver'
  label: string
  description: string
  done: boolean
}

export interface EssentialsStatus {
  blocks: EssentialBlock[]
  complete: boolean
  /** Показывать напоминалку: пока не complete — всегда true. */
  shouldRemind: boolean
  /** Сколько блоков не заполнено. */
  missingCount: number
}

export function useEssentialsStatus(workspaceId: string): EssentialsStatus {
  const workspace = useCurrentWorkspace()
  const vehicle = useVehicleProfile(workspaceId)
  const drivers = useDrivers(workspaceId)
  const org = useOrgProfile(workspaceId)

  const hasOrg = Boolean(
    (org?.organizationName || org?.ownerFullName) && org?.inn && org.inn.length >= 10,
  )
  const hasVehicle = Boolean(vehicle?.make && vehicle?.model && vehicle?.licensePlate)
  const hasDriver = drivers.length > 0 && Boolean(drivers[0].fullName)

  const blocks: EssentialBlock[] = [
    {
      key: 'org',
      label: workspace?.entityType === 'IP' ? 'Реквизиты ИП' : 'Реквизиты организации',
      description: 'Название, ИНН',
      done: hasOrg,
    },
    {
      key: 'vehicle',
      label: 'Автомобиль',
      description: 'Марка, модель, госномер',
      done: hasVehicle,
    },
    {
      key: 'driver',
      label: 'Водитель',
      description: 'ФИО водителя',
      done: hasDriver,
    },
  ]

  const complete = blocks.every((b) => b.done)
  const missingCount = blocks.filter((b) => !b.done).length

  return {
    blocks,
    complete,
    shouldRemind: !complete, // не зависит от ack — essentials либо заполнены, либо нет
    missingCount,
  }
}
