import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  FileCheck,
  Fuel,
  Shield,
  Smartphone,
  MessageCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

const SORA = 'Sora, system-ui, sans-serif'
const PRIMARY = 'oklch(52% 0.225 285)'
const PRIMARY_SOFT = 'oklch(94% 0.044 285)'
const BG = 'oklch(98.8% 0.005 80)'

// F-035 — Лендинг (v3, после двух итераций критики).
// Стратегия: широкая аудитория ИП+ООО, один H1 + сегментация в якоре-числе.
// Hero выше fold на 375px mobile: H1, Sub, скриншот, CTA, compliance-бейджи.

export function WelcomePage() {
  const navigate = useNavigate()

  const goOnboarding = () => navigate('/onboarding')

  return (
    <div className="h-full overflow-y-auto" style={{ background: BG }}>

      {/* ── 0. NAV (sticky) ── */}
      <nav
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ background: 'oklch(98.8% 0.005 80 / 0.85)', borderColor: 'oklch(92% 0.01 280)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/app-icon-source.png" alt="DriveDocs" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-slate-900 text-[15px]" style={{ fontFamily: SORA }}>
              DriveDocs
            </span>
          </div>
          <button
            onClick={goOnboarding}
            className="text-[13px] font-semibold text-white px-4 py-2 rounded-xl active:opacity-90"
            style={{ background: PRIMARY, boxShadow: '0 2px 8px oklch(52% 0.225 285 / 0.35)' }}
          >
            Попробовать бесплатно
          </button>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(94% 0.044 285 / 0.5), transparent 70%)' }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Early-access pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5 text-[12px] font-semibold"
            style={{ background: 'oklch(94% 0.08 155)', color: 'oklch(40% 0.14 155)' }}
          >
            <Sparkles size={12} />
            Ранний доступ — сейчас бесплатно
          </div>

          {/* H1 */}
          <h1
            className="text-[2rem] sm:text-[2.75rem] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4"
            style={{ fontFamily: SORA }}
          >
            Документы на&nbsp;авто для&nbsp;бизнеса —
            <span className="block sm:inline" style={{ color: PRIMARY }}>
              {' '}за&nbsp;30&nbsp;секунд
            </span>
          </h1>

          {/* Sub */}
          <p className="text-[15px] sm:text-[17px] text-slate-600 leading-relaxed max-w-xl mx-auto mb-7">
            Путевые листы, отчёт ГСМ, приказы — всегда в&nbsp;телефоне,
            без&nbsp;Excel и&nbsp;ручного заполнения.
            Соответствуют требованиям&nbsp;ФНС.
          </p>

          {/* Primary CTA — поднят выше mockup'а чтобы оставаться выше fold
              на mobile (P0 правка из UX-аудита 2026-06-22) */}
          <button
            onClick={goOnboarding}
            className="inline-flex items-center justify-center gap-2 text-white text-[15px] font-bold px-7 py-4 rounded-2xl active:scale-[0.98] transition-transform mb-3"
            style={{ background: PRIMARY, boxShadow: '0 6px 24px oklch(52% 0.225 285 / 0.45)' }}
          >
            Попробовать бесплатно
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>

          {/* Reassurances — снимают барьер регистрации */}
          <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
            Без&nbsp;карты при&nbsp;регистрации · Настройка за&nbsp;2&nbsp;минуты · Отмена в&nbsp;один&nbsp;тап
          </p>
          <p className="text-[13px] text-slate-500 mb-6">
            или задайте вопрос в{' '}
            <a
              href="https://t.me/drivedocs_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline decoration-slate-300 underline-offset-2"
              style={{ color: PRIMARY }}
            >
              @drivedocs_bot
            </a>
          </p>

          {/* Compliance badges — trust signals выше fold */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <ComplianceBadge icon={FileCheck} label="Приказ №368" />
            <ComplianceBadge icon={Fuel} label="АМ-23-р" />
            <ComplianceBadge icon={Shield} label="152-ФЗ" />
          </div>

          {/* Hero phone mockup — теперь после CTA, не блокирует action above fold */}
          <div className="flex justify-center">
            <PhoneFrame>
              <HomeScreenMockup />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* ── 2. ЯКОРЬ-ЧИСЛО (две карточки сегментации) ── */}
      <section
        className="px-4 sm:px-6 py-12 sm:py-16"
        style={{ background: 'oklch(96% 0.022 285)', borderTop: '1px solid oklch(92% 0.044 285)' }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SegmentCard
            tag="ИП на УСН"
            tagColor="emerald"
            metric="до 180 000 ₽"
            metricSuffix="/год"
            description="экономии налога с правильно оформленными расходами на транспорт"
          />
          <SegmentCard
            tag="ООО и сотрудники с авто"
            tagColor="violet"
            metric="Один клик"
            description="путевой лист, приказ, акт. Бухгалтерия не переделывает за вами."
          />
        </div>
      </section>

      {/* ── 3. КАК ЭТО РАБОТАЕТ — 3 шага ── */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            eyebrow="Как это работает"
            title="Три шага до готового PDF"
          />

          <div className="space-y-10 sm:space-y-14">
            <StepRow
              num="01"
              title="Настройте профиль за 2 минуты"
              desc="Выберите ИП или ООО — остальное подставится автоматически. Налоговый режим, тип использования авто, базовые реквизиты."
              accent={PRIMARY}
              mockup={<WizardEntityTypeMockup />}
            />
            <StepRow
              num="02"
              title="Создавайте поездки одной кнопкой"
              desc="Маршрут, расстояние, цель — на главном экране. Все поездки попадают в журнал, из которого формируется путевой лист."
              accent="oklch(60% 0.18 195)"
              reverse
              mockup={<AddTripMockup />}
            />
            <StepRow
              num="03"
              title="Скачивайте PDF-документы для ФНС"
              desc="Путевой лист за день или период, отчёт по расходу ГСМ, приказы и акты — готовые к подписи документы по форме приказа №368."
              accent="oklch(55% 0.18 305)"
              mockup={<WaybillPdfMockup />}
            />
          </div>
        </div>
      </section>

      {/* ── 4. ДОВЕРИЕ — 4 бейджа ── */}
      <section
        className="px-4 sm:px-6 py-14 sm:py-20"
        style={{ background: 'oklch(99% 0.005 80)', borderTop: '1px solid oklch(94% 0.005 80)' }}
      >
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            eyebrow="Доверие"
            title="Документы, которые принимает ФНС"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TrustBadge
              icon={FileCheck}
              title="Приказ Минтранса №368"
              desc="Путевые листы соответствуют форме от 28.09.2022. Минимальный и расширенный варианты."
            />
            <TrustBadge
              icon={Fuel}
              title="Нормы расхода ГСМ"
              desc="Расчёт по справочнику АМ-23-р НИИАТ. Нормы для большинства моделей легковых авто."
            />
            <TrustBadge
              icon={Shield}
              title="Серверы в России"
              desc="Хранение данных в соответствии с 152-ФЗ о персональных данных. Без передачи за рубеж."
            />
            <TrustBadge
              icon={Smartphone}
              title="Документы всегда в кармане"
              desc="PWA-приложение устанавливается на iPhone и Android. Создайте поездку в момент когда она нужна — не вечером дома в Excel."
            />
          </div>
        </div>
      </section>

      {/* ── 5. РАННИЙ ДОСТУП ── */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl p-6 sm:p-10 text-center"
            style={{
              background: 'linear-gradient(135deg, oklch(96% 0.05 155), oklch(94% 0.07 165))',
              border: '1px solid oklch(90% 0.06 155)',
            }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: 'oklch(90% 0.10 155)', color: 'oklch(38% 0.14 155)' }}
            >
              <Sparkles size={12} />
              Открытый бета-доступ
            </div>

            <h3
              className="text-[24px] sm:text-[28px] font-bold text-slate-900 mb-3 leading-tight"
              style={{ fontFamily: SORA }}
            >
              Сейчас приложение бесплатное
            </h3>
            <p className="text-[14px] sm:text-[15px] text-slate-700 leading-relaxed mb-6 max-w-xl mx-auto">
              Ранние пользователи получают расширенные права и&nbsp;возможность
              влиять на&nbsp;развитие продукта.
            </p>

            <div className="max-w-md mx-auto space-y-2.5 text-left mb-6">
              <Benefit text="Полный доступ ко всем функциям без ограничений" />
              <Benefit text="Установка на смартфон — путевые листы создаются за рулём, не дома в Excel" />
              <Benefit text="Приоритетная поддержка лично от разработчика" />
              <Benefit text="Влияние на функционал — что нужно, то и добавляем" />
              <Benefit text="Льготный тариф при запуске Pro (планируем)" />
            </div>

            <a
              href="https://t.me/drivedocs_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl active:opacity-80"
              style={{ background: 'white', color: 'oklch(38% 0.14 155)', border: '1px solid oklch(85% 0.08 155)' }}
            >
              <MessageCircle size={14} />
              Связь с разработчиком: @drivedocs_bot
            </a>
          </div>
        </div>
      </section>

      {/* ── 6. ФИНАЛЬНЫЙ CTA ── */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h3
            className="text-[24px] sm:text-[32px] font-bold text-slate-900 mb-4 leading-tight"
            style={{ fontFamily: SORA }}
          >
            Готовы попробовать?
          </h3>
          <p className="text-[15px] text-slate-600 mb-7 max-w-md mx-auto">
            Настройка за 2 минуты. Без карты и подписки. Отмена в один тап.
          </p>

          <button
            onClick={goOnboarding}
            className="inline-flex items-center justify-center gap-2 text-white text-[16px] font-bold px-8 py-4 rounded-2xl active:scale-[0.98] transition-transform mb-3"
            style={{ background: PRIMARY, boxShadow: '0 6px 24px oklch(52% 0.225 285 / 0.45)' }}
          >
            Начать бесплатно
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
          <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
            Без&nbsp;карты при&nbsp;регистрации · Настройка за&nbsp;2&nbsp;минуты · Отмена в&nbsp;один&nbsp;тап
          </p>
          <p className="text-[13px] text-slate-500">
            Или напишите в{' '}
            <a
              href="https://t.me/drivedocs_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline decoration-slate-300 underline-offset-2"
              style={{ color: PRIMARY }}
            >
              @drivedocs_bot
            </a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-4 sm:px-6 py-8 text-center border-t"
        style={{ borderColor: 'oklch(94% 0.005 80)' }}
      >
        <p className="text-[12px] text-slate-500">
          © 2026 DriveDocs · Москва · Поддержка{' '}
          <a
            href="https://t.me/drivedocs_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-300 underline-offset-2"
          >
            @drivedocs_bot
          </a>
        </p>
      </footer>
    </div>
  )
}

// ─── Components ──────────────────────────────────────────

function ComplianceBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
      style={{
        background: 'white',
        border: '1px solid oklch(92% 0.01 280)',
        color: 'oklch(35% 0.02 280)',
      }}
    >
      <Icon size={13} style={{ color: PRIMARY }} strokeWidth={2} />
      {label}
    </div>
  )
}

function SegmentCard({
  tag,
  tagColor,
  metric,
  metricSuffix,
  description,
}: {
  tag: string
  tagColor: 'emerald' | 'violet'
  metric: string
  metricSuffix?: string
  description: string
}) {
  const styles = {
    emerald: { tagBg: 'oklch(92% 0.08 155)', tagText: 'oklch(40% 0.14 155)', metric: 'oklch(38% 0.16 155)' },
    violet:  { tagBg: PRIMARY_SOFT, tagText: 'oklch(38% 0.20 285)', metric: PRIMARY },
  }
  const s = styles[tagColor]

  return (
    <div
      className="rounded-2xl p-6 sm:p-7 bg-white"
      style={{ boxShadow: '0 4px 20px oklch(22% 0.028 280 / 0.06)', border: '1px solid oklch(94% 0.01 280)' }}
    >
      <div
        className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider mb-3"
        style={{ background: s.tagBg, color: s.tagText }}
      >
        {tag}
      </div>
      <div
        className="text-[28px] sm:text-[32px] font-bold leading-tight mb-2"
        style={{ fontFamily: SORA, color: s.metric }}
      >
        {metric}
        {metricSuffix && (
          <span className="text-[15px] font-semibold text-slate-500 ml-1">{metricSuffix}</span>
        )}
      </div>
      <p className="text-[14px] text-slate-600 leading-relaxed">{description}</p>
    </div>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center mb-10 sm:mb-14">
      <p
        className="text-[11px] font-bold uppercase tracking-wider mb-2"
        style={{ color: PRIMARY }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-[24px] sm:text-[32px] font-bold text-slate-900 leading-tight"
        style={{ fontFamily: SORA }}
      >
        {title}
      </h2>
    </div>
  )
}

function StepRow({
  num,
  title,
  desc,
  accent,
  reverse,
  mockup,
}: {
  num: string
  title: string
  desc: string
  accent: string
  reverse?: boolean
  mockup: React.ReactNode
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'} gap-6 sm:gap-10 items-center`}>
      <div className="flex-1 sm:max-w-md text-center sm:text-left">
        <div
          className="inline-block text-[12px] font-bold mb-2 px-2 py-0.5 rounded"
          style={{ background: `${accent.replace(')', ' / 0.12)')}`, color: accent }}
        >
          {num}
        </div>
        <h3
          className="text-[20px] sm:text-[22px] font-bold text-slate-900 mb-2 leading-snug"
          style={{ fontFamily: SORA }}
        >
          {title}
        </h3>
        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed">{desc}</p>
      </div>
      <div className="flex-1 max-w-[260px]">
        <PhoneFrame>{mockup}</PhoneFrame>
      </div>
    </div>
  )
}

// ─── Phone mockups ──────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[36px] p-2"
      style={{ background: 'oklch(22% 0.028 280)', boxShadow: '0 20px 50px oklch(22% 0.028 280 / 0.25)' }}
    >
      <div className="w-[260px] h-[460px] rounded-[28px] bg-white overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}

// 1. HERO — главный экран приложения (Home)
function HomeScreenMockup() {
  return (
    <div className="h-full flex flex-col text-[9px] leading-tight" style={{ background: 'oklch(98.8% 0.005 80)' }}>
      <div className="flex-1 overflow-hidden px-3 pt-4 pb-2">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider truncate">ИП Иванов</div>
            <div className="text-[16px] font-bold text-slate-900 leading-none mt-0.5" style={{ fontFamily: SORA }}>
              Сегодня
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">Понедельник, 15 июня</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full border border-slate-400" />
            </div>
            <div
              className="h-6 px-2 rounded-lg flex items-center gap-1 text-white text-[8px] font-bold"
              style={{ background: 'linear-gradient(135deg, oklch(80% 0.16 80), oklch(72% 0.17 65))' }}
            >
              🎙 Отзыв
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          <div className="bg-white rounded-lg px-2 py-1.5 shadow-sm">
            <div className="text-[6px] font-bold uppercase tracking-wider text-slate-500">Поездок</div>
            <div className="text-[18px] font-bold text-slate-900 leading-none mt-0.5" style={{ fontFamily: SORA }}>3</div>
          </div>
          <div className="bg-white rounded-lg px-2 py-1.5 shadow-sm">
            <div className="text-[6px] font-bold uppercase tracking-wider text-slate-500">Пробег</div>
            <div className="text-[18px] font-bold text-slate-900 leading-none mt-0.5" style={{ fontFamily: SORA }}>
              42<span className="text-[9px] text-slate-500 font-medium ml-0.5">км</span>
            </div>
          </div>
        </div>

        {/* Tax benefit row */}
        <div
          className="rounded-lg px-2 py-1.5 mb-2 flex items-center gap-1.5"
          style={{ background: 'oklch(96% 0.05 155)', border: '1px solid oklch(92% 0.06 155)' }}
        >
          <div className="w-4 h-4 rounded bg-emerald-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-bold leading-tight" style={{ color: 'oklch(35% 0.12 155)' }}>
              12 480 ₽ за июнь — расходы бизнеса
            </div>
            <div className="text-[7px] mt-0.5" style={{ color: 'oklch(48% 0.10 155)' }}>
              Эти деньги уже не из вашего кармана
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div
          className="rounded-lg py-2.5 mb-1.5 flex items-center justify-center gap-1 text-white text-[10px] font-bold"
          style={{ background: PRIMARY, boxShadow: '0 4px 12px oklch(52% 0.225 285 / 0.30)', fontFamily: SORA }}
        >
          🚗 Создать поездку
        </div>

        {/* Secondary CTA */}
        <div className="bg-white rounded-lg px-2 py-1.5 mb-2 flex items-center gap-1.5 shadow-sm border border-slate-100">
          <div className="w-4 h-4 rounded bg-emerald-100 shrink-0" />
          <div className="text-[9px] font-semibold text-slate-700">Добавить расход</div>
        </div>

        {/* Section label */}
        <div className="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-1">Журнал за сегодня</div>

        {/* Trip row */}
        <div className="bg-white rounded-lg p-2 flex items-start gap-1.5 shadow-sm">
          <div className="w-5 h-5 rounded bg-violet-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-semibold text-slate-900 truncate">Офис → Клиент на Тверской</div>
            <div className="text-[7px] text-slate-500 mt-0.5">10:30 · Встреча с заказчиком</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[6px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: PRIMARY_SOFT, color: PRIMARY }}>14 км</span>
              <span className="text-[6px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">✓ Документы</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-slate-100 px-2 py-1.5 flex items-center justify-around">
        {['Сегодня', 'Поездки', 'Отчёты', 'Настройки'].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-violet-100' : 'bg-slate-100'}`} />
            <div className={`text-[6px] font-semibold ${i === 0 ? '' : 'text-slate-400'}`} style={i === 0 ? { color: PRIMARY } : {}}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 2. Wizard — выбор ИП/ООО
function WizardEntityTypeMockup() {
  return (
    <div className="h-full flex flex-col text-[9px]" style={{ background: 'white' }}>
      {/* Header with back + step dots */}
      <div className="flex items-center gap-2 px-3 pt-4 pb-2">
        <div className="w-5 h-5 rounded-lg flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-slate-400" />
        </div>
        <div className="flex items-center gap-1 flex-1 justify-center pr-5">
          <div className="w-3 h-1 rounded-full" style={{ background: PRIMARY }} />
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <div className="w-1 h-1 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3">
        <div className="h-0.5 bg-slate-100 rounded-full">
          <div className="h-full w-1/5 rounded-full" style={{ background: PRIMARY }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pt-4 overflow-hidden">
        <div className="mb-3">
          <div className="text-[7px] font-bold uppercase tracking-wider mb-1" style={{ color: PRIMARY }}>Статус</div>
          <div className="text-[13px] font-bold text-slate-900 leading-snug" style={{ fontFamily: SORA }}>
            Кто вы по юридическому статусу?
          </div>
        </div>

        <div className="space-y-2">
          {/* IP card — selected */}
          <div
            className="flex items-start gap-2 p-2.5 rounded-xl border-2"
            style={{ borderColor: 'oklch(60% 0.20 250)', background: 'oklch(96% 0.05 250)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: 'oklch(60% 0.20 250)', fontFamily: SORA }}
            >
              ИП
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-900">ИП</p>
              <p className="text-[8px] text-slate-500 mt-0.5 leading-snug">
                Индивидуальный предприниматель
              </p>
            </div>
          </div>

          {/* OOO card */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl border-2 border-slate-200 bg-white">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0"
              style={{ fontFamily: SORA }}
            >
              ООО
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-900">ООО</p>
              <p className="text-[8px] text-slate-500 mt-0.5 leading-snug">
                Общество с ограниченной ответственностью
              </p>
            </div>
          </div>

          {/* Info card */}
          <div
            className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: 'oklch(96% 0.04 250)', border: '1px solid oklch(92% 0.06 250)' }}
          >
            <div className="w-3 h-3 rounded-full bg-blue-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-blue-900">Чем отличаются ИП и ООО?</p>
              <p className="text-[7px] text-blue-700">Медосмотр, техосмотр, путевой лист</p>
            </div>
            <span className="text-[7px] font-bold text-blue-400">→</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-100">
        <div
          className="w-full py-2.5 rounded-xl text-center text-[10px] font-bold text-white"
          style={{ background: PRIMARY }}
        >
          Далее
        </div>
      </div>
    </div>
  )
}

// 3. Add Trip Sheet — создание поездки
function AddTripMockup() {
  return (
    <div className="h-full flex flex-col text-[9px]" style={{ background: 'oklch(98% 0.005 80)' }}>
      {/* Backdrop hint */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'oklch(22% 0.028 280 / 0.05)' }} />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Sheet handle */}
        <div className="bg-white rounded-t-2xl pt-2 pb-1 flex justify-center">
          <div className="w-8 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Sheet header */}
        <div className="bg-white px-3 pt-2 pb-3 flex items-center justify-between border-b border-slate-100">
          <div>
            <div className="text-[12px] font-bold text-slate-900" style={{ fontFamily: SORA }}>
              Новая поездка
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">Сегодня, 15 июня · 10:30</div>
          </div>
          <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">×</div>
        </div>

        {/* Form */}
        <div className="bg-white flex-1 px-3 py-3 space-y-2.5">
          {/* From */}
          <div>
            <div className="text-[7px] font-bold uppercase tracking-wider text-slate-500 mb-1">Откуда</div>
            <div className="bg-slate-50 rounded-lg px-2 py-2 text-[9px] text-slate-900 font-medium">
              Офис · Москва, Тверская 7
            </div>
          </div>

          {/* To */}
          <div>
            <div className="text-[7px] font-bold uppercase tracking-wider text-slate-500 mb-1">Куда</div>
            <div className="bg-slate-50 rounded-lg px-2 py-2 text-[9px] text-slate-900 font-medium">
              Клиент · Москва, Арбат 14
            </div>
          </div>

          {/* Distance + Purpose row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <div className="text-[7px] font-bold uppercase tracking-wider text-slate-500 mb-1">Км</div>
              <div className="bg-slate-50 rounded-lg px-2 py-2 text-[9px] text-slate-900 font-bold">14</div>
            </div>
            <div>
              <div className="text-[7px] font-bold uppercase tracking-wider text-slate-500 mb-1">Цель</div>
              <div className="bg-slate-50 rounded-lg px-2 py-2 text-[9px] text-slate-900 font-medium truncate">
                Встреча
              </div>
            </div>
          </div>

          {/* Info hint */}
          <div
            className="rounded-lg px-2 py-1.5 flex items-start gap-1.5"
            style={{ background: 'oklch(96% 0.05 155)' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 mt-0.5 shrink-0" />
            <div className="text-[7px] leading-tight" style={{ color: 'oklch(40% 0.14 155)' }}>
              <span className="font-bold">Документы будут готовы</span> сразу после сохранения
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white px-3 pb-3 pt-2 border-t border-slate-100">
          <div
            className="w-full py-2.5 rounded-xl text-center text-[10px] font-bold text-white"
            style={{ background: PRIMARY }}
          >
            Сохранить поездку
          </div>
        </div>
      </div>
    </div>
  )
}

// 4. PDF Waybill preview — путевой лист
function WaybillPdfMockup() {
  return (
    <div className="h-full flex flex-col text-[8px]" style={{ background: 'oklch(96% 0.005 80)' }}>
      {/* App header */}
      <div className="bg-white px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-slate-100" />
          <div className="text-[10px] font-bold text-slate-900" style={{ fontFamily: SORA }}>
            Путевой лист
          </div>
        </div>
        <div
          className="text-[8px] font-bold px-2 py-1 rounded text-white"
          style={{ background: PRIMARY }}
        >
          Скачать PDF
        </div>
      </div>

      {/* PDF doc preview */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="bg-white rounded shadow-md p-2.5 h-full text-[6px] leading-tight font-serif text-slate-900">
          {/* PDF title */}
          <div className="text-center font-bold text-[7px] mb-1.5 uppercase">Путевой лист легкового автомобиля</div>
          <div className="text-center text-[6px] mb-2">№ 47 от 15 июня 2026 г.</div>

          {/* Subject */}
          <div className="border-b border-slate-300 pb-1 mb-1.5">
            <div className="font-bold text-[6px]">Организация: ИП Иванов А.С.</div>
            <div className="text-[5.5px] text-slate-700 mt-0.5">ИНН 770000000000 · Москва</div>
          </div>

          {/* Driver + Vehicle */}
          <div className="grid grid-cols-2 gap-1.5 mb-1.5 text-[5.5px]">
            <div>
              <div className="font-bold">Водитель</div>
              <div className="text-slate-700">Иванов А.С.</div>
              <div className="text-slate-500">ВУ 77 АА 123456</div>
            </div>
            <div>
              <div className="font-bold">Автомобиль</div>
              <div className="text-slate-700">Toyota Camry</div>
              <div className="text-slate-500">А123АА777</div>
            </div>
          </div>

          {/* Trip table header */}
          <div className="grid grid-cols-[1fr_1fr_0.5fr] gap-1 text-[5px] font-bold border-b border-slate-300 pb-0.5 mb-0.5">
            <div>Откуда</div>
            <div>Куда</div>
            <div className="text-right">Км</div>
          </div>
          {/* Trip rows */}
          {[
            ['Офис', 'Клиент / Арбат', '14'],
            ['Арбат', 'Склад / МКАД', '18'],
            ['МКАД', 'Офис', '21'],
          ].map(([from, to, km], i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_0.5fr] gap-1 text-[5.5px] py-0.5 border-b border-slate-100">
              <div className="truncate">{from}</div>
              <div className="truncate">{to}</div>
              <div className="text-right">{km}</div>
            </div>
          ))}

          {/* GSM stats */}
          <div className="mt-1.5 pt-1 border-t border-slate-300 grid grid-cols-2 gap-1 text-[5.5px]">
            <div>
              <span className="font-bold">Всего:</span> 53 км
            </div>
            <div>
              <span className="font-bold">Расход:</span> 4.8 л
            </div>
          </div>

          {/* Footer compliance */}
          <div className="mt-2 text-[5px] text-slate-500 italic">
            Форма по приказу Минтранса №368 от 28.09.2022
          </div>
        </div>
      </div>
    </div>
  )
}

function TrustBadge({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div
      className="rounded-2xl p-5 bg-white flex items-start gap-4"
      style={{ boxShadow: '0 2px 12px oklch(22% 0.028 280 / 0.05)', border: '1px solid oklch(94% 0.01 280)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: PRIMARY_SOFT }}
      >
        <Icon size={20} style={{ color: PRIMARY }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-slate-900 mb-1 leading-snug" style={{ fontFamily: SORA }}>
          {title}
        </p>
        <p className="text-[12px] text-slate-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2
        size={18}
        style={{ color: 'oklch(45% 0.16 155)', marginTop: 1 }}
        className="shrink-0"
        strokeWidth={2.2}
      />
      <p className="text-[13px] sm:text-[14px] text-slate-700 leading-snug">{text}</p>
    </div>
  )
}
