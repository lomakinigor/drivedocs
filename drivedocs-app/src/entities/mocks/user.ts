import type { User } from '../types/domain'

export const mockUser: User = {
  id: 'user-1',
  email: 'ivanov@example.com',
  name: 'Иванов Александр',
  subscriptionStatus: 'trial',
  subscriptionExpiresAt: '2026-05-06',
  createdAt: '2026-04-01T10:00:00Z',
}
