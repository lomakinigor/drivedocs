import type {
  Trip,
  Receipt,
  WorkspaceEvent,
  EntityType,
  VehicleUsageModel,
} from '@/entities/types/domain'

// Generates a date string N days ago from today
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function isoAgo(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export interface DemoSeedData {
  trips: Trip[]
  receipts: Receipt[]
  events: WorkspaceEvent[]
}

export function buildDemoSeedData(
  workspaceId: string,
  entityType: EntityType,
  vehicleUsageModel: VehicleUsageModel,
): DemoSeedData {
  const trips: Trip[] = [
    {
      id: `demo-trip-1-${workspaceId}`,
      workspaceId,
      date: daysAgo(2),
      startLocation: 'Офис',
      endLocation: 'Клиент, ул. Садовая, 15',
      distanceKm: 18,
      purpose: 'Встреча с клиентом',
      createdAt: isoAgo(2),
    },
    {
      id: `demo-trip-2-${workspaceId}`,
      workspaceId,
      date: daysAgo(5),
      startLocation: 'Офис',
      endLocation: 'Банк, ул. Центральная, 3',
      distanceKm: 7,
      purpose: 'Сдача документов в банк',
      createdAt: isoAgo(5),
    },
    {
      id: `demo-trip-3-${workspaceId}`,
      workspaceId,
      date: daysAgo(9),
      startLocation: 'Склад поставщика',
      endLocation: 'Офис',
      distanceKm: 32,
      purpose: 'Получение товара',
      createdAt: isoAgo(9),
    },
    {
      id: `demo-trip-4-${workspaceId}`,
      workspaceId,
      date: daysAgo(14),
      startLocation: 'Офис',
      endLocation: 'Налоговая инспекция',
      distanceKm: 11,
      purpose: 'Сдача отчётности',
      createdAt: isoAgo(14),
    },
    {
      id: `demo-trip-5-${workspaceId}`,
      workspaceId,
      date: daysAgo(20),
      startLocation: 'Офис',
      endLocation: 'Клиент, пр. Мира, 42',
      distanceKm: 24,
      purpose: 'Переговоры',
      createdAt: isoAgo(20),
    },
  ]

  const receipts: Receipt[] = [
    {
      id: `demo-rec-1-${workspaceId}`,
      workspaceId,
      date: daysAgo(3),
      amount: 2800,
      category: 'fuel' as const,
      description: 'АЗС Лукойл — заправка 40 л',
    },
    {
      id: `demo-rec-2-${workspaceId}`,
      workspaceId,
      date: daysAgo(10),
      amount: 12500,
      category: 'repair' as const,
      description: 'ТО — замена масла и фильтров',
    },
    {
      id: `demo-rec-3-${workspaceId}`,
      workspaceId,
      date: daysAgo(18),
      amount: 350,
      category: 'parking' as const,
      description: 'Парковка у банка',
    },
  ]

  const docTitle =
    vehicleUsageModel === 'COMPENSATION'
      ? 'Приказ о компенсации — оформить до конца месяца'
      : vehicleUsageModel === 'RENT'
      ? 'Договор аренды авто — проверьте срок действия'
      : 'Договор безвозмездного пользования — проверьте актуальность'

  const events: WorkspaceEvent[] = [
    {
      id: `demo-ev-1-${workspaceId}`,
      workspaceId,
      type: 'document_due',
      title: docTitle,
      description: 'Это демо-напоминание — можно удалить',
      date: isoAgo(1),
      isRead: false,
      severity: 'warning',
    },
    {
      id: `demo-ev-2-${workspaceId}`,
      workspaceId,
      type: 'trip_logged',
      title: 'Добро пожаловать в Drivedocs',
      description:
        entityType === 'IP'
          ? 'Здесь примерные данные ИП. Редактируйте или удаляйте — это ваш рабочий стол.'
          : 'Здесь примерные данные организации. Редактируйте или удаляйте — это ваш рабочий стол.',
      date: isoAgo(0),
      isRead: false,
      severity: 'info',
    },
  ]

  return { trips, receipts, events }
}
