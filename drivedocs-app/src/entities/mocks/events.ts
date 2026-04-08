import type { WorkspaceEvent, Reminder, WorkspaceDocument, Trip, Fine } from '../types/domain'

export const mockEvents: WorkspaceEvent[] = [
  {
    id: 'ev-1',
    workspaceId: 'ws-1',
    type: 'fine',
    title: 'Штраф 500 ₽',
    description: 'КоАП 12.16 — несоблюдение требований знака',
    date: '2026-04-05T09:15:00Z',
    isRead: false,
    severity: 'warning',
  },
  {
    id: 'ev-2',
    workspaceId: 'ws-1',
    type: 'document_due',
    title: 'Приказ об использовании авто',
    description: 'Срок оформления — 7 апреля',
    date: '2026-04-06T08:00:00Z',
    isRead: false,
    severity: 'urgent',
  },
  {
    id: 'ev-3',
    workspaceId: 'ws-1',
    type: 'trip_logged',
    title: 'Поездка записана',
    description: 'Москва → Химки, 24 км',
    date: '2026-04-06T11:30:00Z',
    isRead: true,
    severity: 'info',
  },
  {
    id: 'ev-4',
    workspaceId: 'ws-2',
    type: 'reminder',
    title: 'Путевой лист за март',
    description: 'Необходимо заполнить и подписать',
    date: '2026-04-01T08:00:00Z',
    isRead: false,
    severity: 'warning',
  },
]

export const mockReminders: Reminder[] = [
  {
    id: 'rem-1',
    workspaceId: 'ws-1',
    title: 'Записать поездки за неделю',
    dueDate: '2026-04-07',
    isCompleted: false,
    type: 'trip',
  },
  {
    id: 'rem-2',
    workspaceId: 'ws-1',
    title: 'Подписать приказ о компенсации',
    dueDate: '2026-04-10',
    isCompleted: false,
    type: 'document',
  },
]

export const mockDocuments: WorkspaceDocument[] = [
  {
    id: 'doc-1',
    workspaceId: 'ws-1',
    title: 'Приказ об использовании личного автомобиля',
    description: 'Основной документ для ИП УСН с компенсацией',
    type: 'one_time',
    status: 'required',
    dueDate: '2026-04-10',
    templateKey: 'ip_compensation_order',
  },
  {
    id: 'doc-2',
    workspaceId: 'ws-1',
    title: 'Журнал учёта поездок',
    description: 'Ведётся ежемесячно',
    type: 'recurring',
    status: 'in_progress',
    templateKey: 'trip_log',
  },
  {
    id: 'doc-3',
    workspaceId: 'ws-1',
    title: 'Расчёт суммы компенсации',
    description: 'Фиксированная сумма в месяц',
    type: 'recurring',
    status: 'completed',
    completedAt: '2026-04-01',
    templateKey: 'compensation_calc',
  },
  {
    id: 'doc-4',
    workspaceId: 'ws-2',
    title: 'Договор аренды автомобиля',
    description: 'Аренда у сотрудника, ООО — налог на прибыль',
    type: 'one_time',
    status: 'completed',
    completedAt: '2026-03-15',
    templateKey: 'ooo_rent_agreement',
  },
]

export const mockTrips: Trip[] = [
  {
    id: 'trip-1',
    workspaceId: 'ws-1',
    date: '2026-04-06',
    startLocation: 'Москва, ул. Ленина, 1',
    endLocation: 'Химки, ТЦ Мега',
    distanceKm: 24,
    purpose: 'Встреча с клиентом',
    createdAt: '2026-04-06T11:30:00Z',
  },
  {
    id: 'trip-2',
    workspaceId: 'ws-1',
    date: '2026-04-05',
    startLocation: 'Москва, ул. Ленина, 1',
    endLocation: 'Москва, Ленинградский пр., 37',
    distanceKm: 12,
    purpose: 'Переговоры с поставщиком',
    createdAt: '2026-04-05T14:00:00Z',
  },
]

export const mockFines: Fine[] = [
  {
    id: 'fine-1',
    workspaceId: 'ws-1',
    amount: 500,
    date: '2026-04-05',
    description: 'Несоблюдение требований знака',
    status: 'unpaid',
    licensePlate: 'А123ВГ77',
    articleCode: 'КоАП 12.16',
  },
]
