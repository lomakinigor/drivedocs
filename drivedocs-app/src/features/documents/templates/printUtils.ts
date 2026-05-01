export const PRINT_CSS = `
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; margin: 15mm 20mm; color: #000; }
  .doc-body { max-width: 170mm; }
  .doc-center { text-align: center; }
  .doc-org-header { text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 8pt; }
  .doc-title { font-size: 13pt; font-weight: bold; letter-spacing: 0.05em; margin: 8pt 0 4pt; }
  .doc-meta { text-align: center; font-size: 10pt; margin-bottom: 12pt; }
  .doc-subject { text-align: center; font-size: 11pt; font-weight: bold; margin: 8pt 0 14pt; }
  .doc-p { margin: 6pt 0; text-align: justify; text-indent: 1.25cm; }
  .doc-caps { text-transform: uppercase; text-indent: 0; text-align: center; font-weight: bold; letter-spacing: 0.05em; }
  .doc-section { font-weight: bold; margin: 12pt 0 4pt; text-align: center; }
  .doc-indent { margin: 2pt 0 2pt 2.5cm; }
  .doc-basis { font-style: italic; margin-top: 14pt; }
  .doc-small { font-size: 9pt; color: #444; margin: 2pt 0; }
  .doc-sign-block { margin-top: 24pt; }
  .doc-sign-line { margin: 18pt 0 4pt; }
  .doc-sign-date { font-size: 10pt; }
  .doc-sign-secondary { margin-top: 16pt; border-top: 1px solid #ccc; padding-top: 10pt; }
  .doc-sign-header { font-weight: bold; margin-bottom: 6pt; }
  .doc-sign-row { display: flex; gap: 24pt; margin-top: 24pt; }
  .doc-sign-col { flex: 1; }
  .doc-sign-bottom { margin-top: 16pt; }
  .doc-info-table { width: 100%; margin-bottom: 10pt; border-collapse: collapse; }
  .doc-info-label { width: 35%; font-weight: normal; padding: 2pt 0; vertical-align: top; }
  .doc-info-value { padding: 2pt 0 2pt 8pt; }
  .doc-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 8pt; }
  .doc-th { border: 1px solid #000; padding: 4pt 3pt; text-align: center; font-size: 9pt; }
  .doc-th-num { width: 5%; }
  .doc-th-wide { width: 22%; }
  .doc-th-sm { width: 7%; }
  .doc-td { border: 1px solid #000; padding: 3pt 3pt; height: 16pt; }
  .doc-td-center { text-align: center; }
  .doc-tr-total td { font-weight: bold; background: #f0f0f0; }
  .doc-page-break { page-break-after: always; break-after: page; margin-bottom: 0; }
`

export function openPrintWindow(htmlContent: string, title: string) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('Разрешите всплывающие окна в браузере для печати')
    return
  }
  win.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>${htmlContent}</body>
<script>window.onload = function(){ window.focus(); window.print(); }<\/script>
</html>`)
  win.document.close()
}
