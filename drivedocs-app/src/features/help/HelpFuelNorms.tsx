import { X, FileText } from 'lucide-react'
import {
  CITY_BONUS,
  WINTER_BONUS,
  AGE_BONUS,
  HIGHWAY_DISCOUNT_PCT,
  AC_BONUS_PCT,
  LEGAL_REFS,
} from '@/entities/config/fuelNorms'

// F-027c — Справка по нормам расхода топлива (АМ-23-р)

const SORA = 'Sora, system-ui, sans-serif'
const INDIGO = 'oklch(52% 0.225 285)'
const INDIGO_SOFT = 'oklch(94% 0.044 285)'

export function HelpFuelNormsSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-start justify-between px-5 pt-2 pb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-slate-900" style={{ fontFamily: SORA }}>
              Нормы расхода топлива
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              По распоряжению Минтранса РФ № АМ-23-р. Норма нужна для подтверждения расходов на ГСМ в налоговой.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {/* Formula */}
          <Block title="Формула">
            <div
              className="rounded-[14px] px-4 py-3 font-mono text-[13px]"
              style={{ background: INDIGO_SOFT, color: INDIGO }}
            >
              Qн = 0.01 × Hs × S × (1 + 0.01 × D)
            </div>
            <Var name="Qн" desc="норма расхода для этой поездки (л)" />
            <Var name="Hs" desc="базовая норма авто (л/100 км)" />
            <Var name="S" desc="пробег (км)" />
            <Var name="D" desc="суммарная надбавка (%) — сумма всех коэффициентов ниже" />
          </Block>

          {/* Trip mode */}
          <Block title="Режим поездки">
            <Row title="Загородняя дорога (I–III кат.)" pct={HIGHWAY_DISCOUNT_PCT} note="Скидка к норме" />
            <div className="text-[12px] text-slate-500 mt-2 mb-1">Город (надбавка по численности):</div>
            {Object.values(CITY_BONUS).map((b) => (
              <Row key={b.label} title={b.label} pct={b.pct} />
            ))}
          </Block>

          {/* Winter */}
          <Block title="Зимний период">
            {Object.values(WINTER_BONUS).map((w) => (
              <Row key={w.label} title={w.label} pct={w.pct} />
            ))}
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Применяется автоматически по дате поездки. Период зимы зависит от региона (от 3 до 7 месяцев).
            </p>
          </Block>

          {/* AC + age */}
          <Block title="Прочие надбавки">
            <Row title="Кондиционер / климат-контроль" pct={AC_BONUS_PCT} note="Только в тёплый сезон (апр–окт)" />
            <Row title={AGE_BONUS.age5.label} pct={AGE_BONUS.age5.pct} />
            <Row title={AGE_BONUS.age8.label} pct={AGE_BONUS.age8.pct} />
          </Block>

          {/* Examples */}
          <Block title="Примеры">
            <Example desc="Москва, зима, авто 3 года" calc="× (1 + 0.35 + 0.10) = ×1.45" />
            <Example desc="Трасса, лето, авто 2 года" calc="× (1 − 0.15) = ×0.85" />
            <Example desc="Город 1–5 млн + кондиционер" calc="× (1 + 0.25 + 0.07) = ×1.32" />
          </Block>

          {/* Legal */}
          <Block title="Нормативные документы">
            <Legal text={LEGAL_REFS.AM23R} />
            <Legal text={LEGAL_REFS.ORDER368} />
            <Legal text={LEGAL_REFS.FZ259} />
            <Legal text={LEGAL_REFS.NK_264} />
          </Block>

          {/* FAQ */}
          <Block title="Частые вопросы">
            <Faq
              q="Можно ли писать «поездка по городу» как цель?"
              a="Можно, но для налоговой лучше уточнить — «переговоры с партнёром», «банк», «закупка»."
            />
            <Faq
              q="Нужен ли путевой лист ИП на своём авто?"
              a="Да, если хотите подтвердить расход на ГСМ как расход бизнеса."
            />
            <Faq
              q="Как подтвердить расход ГСМ для налоговой?"
              a="Путевой лист + чеки с НДС + соответствие норме АМ-23-р."
            />
          </Block>
        </div>
      </div>
    </>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3
        className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mx-1"
        style={{ fontFamily: SORA, letterSpacing: '0.06em' }}
      >
        {title}
      </h3>
      <div className="bg-white rounded-[14px] border border-slate-100 px-3 py-2 space-y-1.5">
        {children}
      </div>
    </section>
  )
}

function Row({ title, pct, note }: { title: string; pct: number; note?: string }) {
  const sign = pct > 0 ? '+' : ''
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-slate-800">{title}</div>
        {note && <div className="text-[11px] text-slate-500 mt-0.5">{note}</div>}
      </div>
      <span
        className="text-[13px] font-semibold tabular-nums shrink-0 ml-3"
        style={{ color: pct < 0 ? 'oklch(45% 0.13 155)' : INDIGO, fontFamily: SORA }}
      >
        {sign}
        {pct}%
      </span>
    </div>
  )
}

function Var({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3 py-1">
      <span className="font-mono text-[13px] font-semibold shrink-0" style={{ color: INDIGO }}>
        {name}
      </span>
      <span className="text-[12px] text-slate-600">— {desc}</span>
    </div>
  )
}

function Example({ desc, calc }: { desc: string; calc: string }) {
  return (
    <div className="py-1.5">
      <div className="text-[12px] text-slate-700">{desc}</div>
      <div className="font-mono text-[12px] mt-0.5" style={{ color: INDIGO }}>
        {calc}
      </div>
    </div>
  )
}

function Legal({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <FileText size={14} className="text-slate-500 shrink-0 mt-0.5" />
      <span className="text-[12px] text-slate-700 leading-relaxed">{text}</span>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="py-1.5">
      <div className="text-[12px] font-semibold text-slate-800">{q}</div>
      <div className="text-[12px] text-slate-600 mt-1 leading-relaxed">{a}</div>
    </div>
  )
}

