import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  useCurrentWorkspace,
  useOrgProfile,
  useVehicleProfile,
  useDrivers,
} from '@/app/store/workspaceStore'
import { buildTemplateContext } from './templates/context'
import { getTemplate } from './templates/registry'
import { openPrintWindow } from './templates/printUtils'
import type { WorkspaceDocument } from '@/entities/types/domain'

interface BatchPrintSheetProps {
  docs: WorkspaceDocument[]
  onClose: () => void
}

/**
 * Renders all selected document templates in a hidden container, captures their
 * innerHTML, and opens a single print window with page breaks between documents.
 * Closes itself immediately after triggering print.
 */
export function BatchPrintSheet({ docs, onClose }: BatchPrintSheetProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const workspace = useCurrentWorkspace()
  const org = useOrgProfile(id)
  const vehicle = useVehicleProfile(id)
  const drivers = useDrivers(id)

  const containerRef = useRef<HTMLDivElement>(null)
  const printed = useRef(false)

  const ctx = workspace
    ? buildTemplateContext(workspace, org, vehicle, drivers)
    : {}

  useEffect(() => {
    if (printed.current || !containerRef.current) return
    printed.current = true

    const sections = containerRef.current.querySelectorAll<HTMLDivElement>('[data-doc-section]')
    const parts: string[] = []
    sections.forEach((el) => parts.push(el.innerHTML))

    if (parts.length === 0) {
      onClose()
      return
    }

    const combined = parts
      .map((html, i) =>
        i < parts.length - 1
          ? `${html}<div class="doc-page-break"></div>`
          : html,
      )
      .join('')

    const title =
      parts.length === 1
        ? (docs[0]?.title ?? 'Документ')
        : `Пакет документов (${parts.length} шт.)`

    openPrintWindow(combined, title)
    onClose()
  })

  const printableDocs = docs.filter((d) => !!getTemplate(d.templateKey))

  if (printableDocs.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} style={{ display: 'none' }} aria-hidden="true">
      {printableDocs.map((doc) => {
        const tmpl = getTemplate(doc.templateKey)!
        const TemplateComponent = tmpl.Component
        return (
          <div key={doc.id} data-doc-section>
            <TemplateComponent v={ctx} />
          </div>
        )
      })}
    </div>
  )
}
