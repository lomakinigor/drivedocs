export interface TemplateField {
  key: string
  label: string
  value: string
  required: boolean
  multiline?: boolean
  placeholder?: string
}

export interface TemplateDefinition {
  title: string
  /** Extract pre-filled fields from merged context values */
  getFields: (ctx: TemplateValues) => TemplateField[]
  Component: React.ComponentType<{ v: TemplateValues }>
}

/** Flat string map — auto-filled from profile + user overrides */
export type TemplateValues = Record<string, string>
