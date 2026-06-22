import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  FileCheck,
  Fuel,
  Shield,
  UserCheck,
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
            Путевые листы, отчёт ГСМ, приказы — без&nbsp;Excel
            и&nbsp;ручного заполнения. Соответствуют требованиям&nbsp;ФНС.
          </p>

          {/* Screenshot placeholder — iPhone-style frame */}
          <div className="flex justify-center mb-7">
            <div
              className="rounded-[36px] p-2"
              style={{ background: 'oklch(22% 0.028 280)', boxShadow: '0 20px 50px oklch(22% 0.028 280 / 0.25)' }}
            >
              <div
                className="w-[260px] h-[400px] rounded-[28px] bg-white flex flex-col items-center justify-center px-4 text-center overflow-hidden relative"
              >
                <img src="/app-icon-source.png" alt="" className="w-16 h-16 rounded-2xl mb-3" />
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Главный экран</div>
                <div className="text-[13px] font-bold text-slate-900 mb-3" style={{ fontFamily: SORA }}>
                  Сегодня
                </div>
                <div className="w-full space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 rounded-lg bg-slate-100" />
                    <div className="h-10 rounded-lg bg-slate-100" />
                  </div>
                  <div className="h-8 rounded-lg" style={{ background: 'oklch(94% 0.05 155)' }} />
                  <div
                    className="h-11 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: PRIMARY }}
                  >
                    Создать поездку
                  </div>
                  <div className="h-8 rounded-lg border border-slate-200" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 h-6 rounded-lg bg-slate-50 flex items-center justify-around">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-4 h-4 rounded bg-slate-200" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={goOnboarding}
            className="inline-flex items-center justify-center gap-2 text-white text-[15px] font-bold px-7 py-4 rounded-2xl active:scale-[0.98] transition-transform mb-3"
            style={{ background: PRIMARY, boxShadow: '0 6px 24px oklch(52% 0.225 285 / 0.45)' }}
          >
            Попробовать бесплатно
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
          <p className="text-[13px] text-slate-500 mb-7">
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

          {/* Compliance badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <ComplianceBadge icon={FileCheck} label="Приказ №368" />
            <ComplianceBadge icon={Fuel} label="АМ-23-р" />
            <ComplianceBadge icon={Shield} label="152-ФЗ" />
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
              screenshotLabel="Wizard настройки"
              accent={PRIMARY}
            />
            <StepRow
              num="02"
              title="Создавайте поездки одной кнопкой"
              desc="Маршрут, расстояние, цель — на главном экране. Все поездки попадают в журнал, из которого формируется путевой лист."
              screenshotLabel="Главный экран"
              accent="oklch(60% 0.18 195)"
              reverse
            />
            <StepRow
              num="03"
              title="Скачивайте PDF-документы для ФНС"
              desc="Путевой лист за день или период, отчёт по расходу ГСМ, приказы и акты — готовые к подписи документы по форме приказа №368."
              screenshotLabel="PDF превью"
              accent="oklch(55% 0.18 305)"
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
              icon={UserCheck}
              title="Сделано ИП — для ИП и ООО"
              desc="Не «универсальный таск-трекер», а инструмент под конкретные требования ФНС и Минтранса."
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
            className="inline-flex items-center justify-center gap-2 text-white text-[16px] font-bold px-8 py-4 rounded-2xl active:scale-[0.98] transition-transform mb-4"
            style={{ background: PRIMARY, boxShadow: '0 6px 24px oklch(52% 0.225 285 / 0.45)' }}
          >
            Начать бесплатно
            <ArrowRight size={18} strokeWidth={2.2} />
          </button>
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
  screenshotLabel,
  accent,
  reverse,
}: {
  num: string
  title: string
  desc: string
  screenshotLabel: string
  accent: string
  reverse?: boolean
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
        <div
          className="rounded-[28px] p-1.5"
          style={{ background: 'oklch(22% 0.028 280)', boxShadow: '0 12px 30px oklch(22% 0.028 280 / 0.18)' }}
        >
          <div className="w-full aspect-[9/16] rounded-[22px] bg-white flex items-center justify-center p-4 text-center">
            <div>
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-3"
                style={{ background: accent, opacity: 0.15 }}
              />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {screenshotLabel}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Скриншот будет здесь</p>
            </div>
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
