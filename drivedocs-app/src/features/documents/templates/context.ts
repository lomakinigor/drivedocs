import type { Workspace, OrganizationProfile, VehicleProfile, Driver } from '@/entities/types/domain'
import type { TemplateValues } from './types'

const MONTH_GEN: Record<number, string> = {
  0: 'января', 1: 'февраля', 2: 'марта', 3: 'апреля',
  4: 'мая', 5: 'июня', 6: 'июля', 7: 'августа',
  8: 'сентября', 9: 'октября', 10: 'ноября', 11: 'декабря',
}

const MONTH_NOM: Record<number, string> = {
  0: 'Январь', 1: 'Февраль', 2: 'Март', 3: 'Апрель',
  4: 'Май', 5: 'Июнь', 6: 'Июль', 7: 'Август',
  8: 'Сентябрь', 9: 'Октябрь', 10: 'Ноябрь', 11: 'Декабрь',
}

export function buildTemplateContext(
  workspace: Workspace,
  org: OrganizationProfile | null,
  vehicle: VehicleProfile | null,
  drivers: Driver[],
): TemplateValues {
  const now = new Date()
  const defaultDriver = drivers.find((d) => d.isDefault) ?? drivers[0] ?? null

  const engineL = vehicle?.engineVolume
    ? (vehicle.engineVolume / 1000).toFixed(1)
    : ''

  return {
    // Дата
    today: now.toLocaleDateString('ru-RU'),
    todayDay: String(now.getDate()),
    todayMonth: MONTH_GEN[now.getMonth()],
    todayMonthNom: MONTH_NOM[now.getMonth()],
    todayYear: String(now.getFullYear()),
    currentMonth: `${MONTH_NOM[now.getMonth()]} ${now.getFullYear()}`,

    // Организация / ИП
    orgName: org?.organizationName || workspace.name,
    ownerFullName: org?.ownerFullName || vehicle?.ownerFullName || '',
    inn: org?.inn || '',
    ogrn: org?.ogrn || '',
    city: '',

    // Авто
    vehicleMake: vehicle?.make || '',
    vehicleModel: vehicle?.model || '',
    vehicleYear: vehicle?.year ? String(vehicle.year) : '',
    licensePlate: vehicle?.licensePlate || '',
    vin: vehicle?.vin || '',
    engineVolumeCc: vehicle?.engineVolume ? String(vehicle.engineVolume) : '',
    engineVolumeL: engineL,
    enginePowerHp: vehicle?.enginePowerHp ? String(vehicle.enginePowerHp) : '',
    fuelConsumption: vehicle?.fuelConsumptionPer100km
      ? String(vehicle.fuelConsumptionPer100km)
      : '',

    // Водитель
    driverFullName: defaultDriver?.fullName || '',
    driverLicense: defaultDriver?.licenseNumber || '',

    // Заполняется пользователем
    orderNumber: '',
    compensationAmount: '',
    paymentDay: '15',
    rentAmount: '',
    contractNumber: '',
    contractDate: '',
    // Поля для расчёта компенсации и маршрутного листа
    workingDaysInMonth: '',
    daysWorked: '',
    actualMileage: '',
    odometerStart: '',
    odometerEnd: '',
    lessorFullName: '',
    lessorPassport: '',
    inventoryNumber: '',
    employeePosition: '',
    contractStartDate: '',
    contractEndDate: '',
    actNumber: '',
    waybillNumber: '',
    initialCost: '',
    usefulLifeYears: '',
    depreciationGroup: '',
    fuelWinterAdd: '',
    fuelWinterStart: '',
    fuelWinterEnd: '',
    fuelType: '',
    fuelIssued: '',
    fuelRemainStart: '',
    fuelRemainEnd: '',
    totalMileage: '',
    fuelFact: '',
    fuelPrice: '',
    accountantName: '',
  }
}
