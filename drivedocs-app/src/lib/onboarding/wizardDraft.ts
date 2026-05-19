// F-034 · Slice 1 — Wizard draft persistence
//
// Если пользователь начал onboarding и закрыл вкладку — при следующем
// открытии Welcome → «Начать настройку» восстановит то, что он успел
// заполнить (тип, название). Очищается после успешного завершения wizard'а.

import type { EntityType } from '@/entities/types/domain'

const KEY = 'drivedocs:wizard-draft:v1'

export interface WizardDraft {
  entityType?: EntityType
  workspaceName: string
  updatedAt: string
}

export function readDraft(): WizardDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as WizardDraft
    // Опц: считать draft устаревшим через 30 дней
    const age = Date.now() - new Date(draft.updatedAt).getTime()
    if (age > 30 * 24 * 60 * 60 * 1000) {
      clearDraft()
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function writeDraft(draft: Omit<WizardDraft, 'updatedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const full: WizardDraft = { ...draft, updatedAt: new Date().toISOString() }
    window.localStorage.setItem(KEY, JSON.stringify(full))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
