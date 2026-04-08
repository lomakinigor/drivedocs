import type { Workspace, VehicleProfile, OrganizationProfile } from '../types/domain'

export const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    userId: 'user-1',
    name: 'ИП Иванов А.В.',
    entityType: 'IP',
    taxMode: 'USN_INCOME',
    vehicleUsageModel: 'COMPENSATION',
    isConfigured: true,
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'ws-2',
    userId: 'user-1',
    name: 'ООО Альфа-Торг',
    entityType: 'OOO',
    taxMode: 'OSN',
    vehicleUsageModel: 'RENT',
    isConfigured: true,
    createdAt: '2026-04-02T12:00:00Z',
  },
]

export const mockVehicleProfiles: VehicleProfile[] = [
  {
    workspaceId: 'ws-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    licensePlate: 'А123ВГ77',
    engineVolume: 2000,
    fuelType: 'gasoline',
    ownerFullName: 'Иванов Александр Валерьевич',
  },
  {
    workspaceId: 'ws-2',
    make: 'Kia',
    model: 'Rio',
    year: 2020,
    licensePlate: 'В456ДЕ99',
    engineVolume: 1600,
    fuelType: 'gasoline',
  },
]

export const mockOrgProfiles: OrganizationProfile[] = [
  {
    workspaceId: 'ws-1',
    entityType: 'IP',
    inn: '771234567890',
    ownerFullName: 'Иванов Александр Валерьевич',
  },
  {
    workspaceId: 'ws-2',
    entityType: 'OOO',
    inn: '7700000001',
    ogrn: '1027700000001',
    organizationName: 'ООО Альфа-Торг',
  },
]
