import { AlertTriangle } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import type { HelpContent } from '@/entities/config/onboardingHelp'

// Bottom sheet для справочного контента в OnboardingWizard и SettingsPage.
// Принимает HelpContent (см. onboardingHelp.ts) и рендерит секции единообразно.
// F-021 · T-126 · D-022

interface HelpInfoSheetProps {
  content: HelpContent
  onClose: () => void
}

export function HelpInfoSheet({ content, onClose }: HelpInfoSheetProps) {
  return (
    <BottomSheet title={content.title} onClose={onClose}>
      <div className="max-h-[70dvh] overflow-y-auto -mx-1 px-1">
        {content.lead && (
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{content.lead}</p>
        )}

        <div className="space-y-4">
          {content.sections.map((section, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-3.5 ${
                section.tone === 'warning'
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2 mb-1.5">
                {section.tone === 'warning' && (
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm font-semibold leading-snug ${
                    section.tone === 'warning' ? 'text-amber-800' : 'text-slate-900'
                  }`}
                >
                  {section.heading}
                </p>
              </div>

              {section.body && (
                <p
                  className={`text-sm leading-relaxed ${
                    section.tone === 'warning' ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {section.body}
                </p>
              )}

              {section.list && (
                <ul className="space-y-1.5 mt-1">
                  {section.list.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-slate-500 mt-1 shrink-0 text-xs">•</span>
                      <p
                        className={`text-sm leading-relaxed ${
                          section.tone === 'warning' ? 'text-amber-700' : 'text-slate-600'
                        }`}
                      >
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {content.footnote && (
          <p className="text-xs text-slate-500 leading-relaxed mt-4 pt-3 border-t border-slate-100">
            {content.footnote}
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
