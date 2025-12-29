import Link from "next/link";
import {
  Droplets,
  Wrench,
  ShieldCheck,
  Clock,
  Star,
  MapPin,
  Phone,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const WHATSAPP_NUMBER = "5514999999999"; // troque aqui (DDI+DDD+NUM)
const WHATSAPP_TEXT =
  "Olá! Vim pelo site da MSH Hidráulica e gostaria de solicitar um orçamento.";

function waUrl() {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_TEXT
  )}`;
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">
      <Icon size={16} className="text-white/70" />
      {children}
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-white/50">
        {kicker}
      </div>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">
        {desc}
      </p>
    </div>
  );
}

export default function Home() {
  const services = [
    {
      title: "Instalação e manutenção",
      desc: "Torneiras, registros, chuveiros, válvulas, caixas acopladas e mais.",
      icon: Wrench,
    },
    {
      title: "Vazamentos e reparos",
      desc: "Detecção, correção e prevenção de vazamentos em pontos críticos.",
      icon: Droplets,
    },
    {
      title: "Atendimento confiável",
      desc: "Serviço bem feito, com atenção ao acabamento e limpeza.",
      icon: ShieldCheck,
    },
    {
      title: "Agendamento inteligente",
      desc: "Escolha horários vagos e acompanhe status do serviço.",
      icon: CalendarDays,
    },
  ];

  const highlights = [
    "Orçamento rápido no WhatsApp",
    "Agendamento online por horário",
    "Ordem de serviço + histórico",
    "Emissão de notas/faturas no painel",
  ];

  const steps = [
    {
      title: "Você agenda",
      desc: "Escolha um horário disponível em poucos cliques.",
    },
    {
      title: "Confirmamos",
      desc: "A MSH confirma e você recebe as informações do atendimento.",
    },
    {
      title: "Executamos o serviço",
      desc: "Técnico no local, serviço com qualidade e transparência.",
    },
    {
      title: "Finaliza e recebe",
      desc: "OS finalizada e nota/fatura emitida quando necessário.",
    },
  ];

  const faqs = [
    {
      q: "Vocês atendem emergência?",
      a: "Sim, quando houver disponibilidade. Chame no WhatsApp para prioridade e confirmação.",
    },
    {
      q: "Consigo agendar para outro dia?",
      a: "Sim. No agendamento você escolhe a data e os horários livres aparecem automaticamente.",
    },
    {
      q: "Vocês emitem nota fiscal?",
      a: "Sim. No painel, as ordens de serviço podem gerar nota/fatura conforme sua necessidade.",
    },
    {
      q: "Como funciona a visita técnica?",
      a: "Você agenda e a equipe faz o diagnóstico no local. Se aprovado, o serviço pode ser executado na sequência (quando possível).",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070713] text-white">
      {/* Background premium */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-52 -left-52 h-[700px] w-[700px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-24 -right-56 h-[720px] w-[720px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-[-320px] left-1/3 h-[820px] w-[820px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
              <Droplets className="text-white/80" size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                MSH Hidráulica
              </div>
              <div className="text-xs text-white/50">
                Manutenção • Reparos • Instalações
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#servicos" className="hover:text-white">
              Serviços
            </a>
            <a href="#como-funciona" className="hover:text-white">
              Como funciona
            </a>
            <a href="#depoimentos" className="hover:text-white">
              Depoimentos
            </a>
            <a href="#contato" className="hover:text-white">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 md:inline-flex"
            >
              Painel
            </Link>

            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
            >
              Agendar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill icon={Sparkles}>Atendimento profissional</Pill>
                <Pill icon={Clock}>Agende em minutos</Pill>
                <Pill icon={ShieldCheck}>Transparência e garantia</Pill>
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
                Hidráulica com <span className="text-white/90">qualidade</span>{" "}
                e <span className="text-white/90">agendamento online</span>.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-white/65 md:text-lg">
                Resolva vazamentos, instalações e manutenções com atendimento
                organizado: agenda, ordem de serviço e emissão de notas — tudo
                no mesmo sistema.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/agendar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
                >
                  <CalendarDays size={18} />
                  Agendar um horário
                </Link>

                <a
                  href={waUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10"
                >
                  <MessageCircle size={18} />
                  Orçamento no WhatsApp
                </a>
              </div>

              <div className="mt-6 grid gap-2 text-sm text-white/65">
                {highlights.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-white/70" />
                    {t}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-white/70">
                <Star size={16} className="text-white/70" />
                <span className="text-sm">
                  Atendimento bem avaliado • Compromisso com o prazo
                </span>
              </div>
            </div>

            {/* Card premium */}
            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-white/60">
                      Próximo atendimento
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      Visita técnica
                    </div>
                    <div className="mt-1 text-sm text-white/60">
                      Diagnóstico e avaliação no local
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                    60 min
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Cliente</div>
                    <div className="mt-1 text-sm font-medium">
                      Nome do cliente
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      Endereço • Bairro • Cidade
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Status</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                        <CheckCircle2 size={14} />
                        Confirmado
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Horário</div>
                      <div className="mt-1 text-sm font-medium">
                        16:00 – 17:00
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        Segunda-feira
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Link
                    href="/agendar"
                    className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black hover:bg-white/90"
                  >
                    Agendar agora
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10"
                  >
                    Admin
                  </Link>
                </div>
              </div>

              <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-r from-white/10 via-transparent to-white/10 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle
            kicker="Serviços"
            title="Tudo que você precisa em hidráulica"
            desc="Da visita técnica à execução. Atendimento organizado, com registro e histórico."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-2xl backdrop-blur hover:bg-white/5"
                >
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon size={18} className="text-white/80" />
                  </div>
                  <div className="text-base font-semibold">{s.title}</div>
                  <div className="mt-2 text-sm text-white/60">{s.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/agendar"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
            >
              <CalendarDays size={18} />
              Ver horários disponíveis
            </Link>
            <a
              href={waUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10"
            >
              <MessageCircle size={18} />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle
            kicker="Como funciona"
            title="Simples, rápido e organizado"
            desc="Você agenda online e acompanha a evolução do atendimento."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, idx) => (
              <div
                key={s.title}
                className="rounded-3xl border border-white/10 bg-black/25 p-6 backdrop-blur"
              >
                <div className="text-xs text-white/50">Passo {idx + 1}</div>
                <div className="mt-2 text-base font-semibold">{s.title}</div>
                <div className="mt-2 text-sm text-white/60">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle
            kicker="Provas sociais"
            title="Clientes satisfeitos"
            desc="Um serviço bem feito vira indicação. É assim que a MSH cresce."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              {
                name: "Ana Caroline",
                text: "Atendimento pontual, resolveu rápido e ficou tudo bem acabado. Recomendo!",
              },
              {
                name: "Marcos Silva",
                text: "Ótima organização. Agendei online e me avisaram tudo certinho.",
              },
              {
                name: "Juliana Pereira",
                text: "Transparência e qualidade. Gostei de ter registro do serviço e valores.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-2xl backdrop-blur"
              >
                <div className="flex items-center gap-2 text-white/80">
                  <Star size={16} className="text-white/70" />
                  <span className="text-sm">5.0</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/65">
                  “{t.text}”
                </p>
                <div className="mt-4 text-sm font-medium">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + Contato */}
      <section id="contato" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionTitle
                kicker="Dúvidas"
                title="Perguntas frequentes"
                desc="Respostas rápidas para ajudar você a decidir."
              />

              <div className="mt-8 grid gap-3">
                {faqs.map((f) => (
                  <details
                    key={f.q}
                    className="rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur"
                  >
                    <summary className="cursor-pointer list-none text-sm font-medium text-white/85">
                      {f.q}
                    </summary>
                    <div className="mt-2 text-sm text-white/60">{f.a}</div>
                  </details>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-2xl backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Contato
              </div>
              <div className="mt-2 text-2xl font-semibold">Fale com a MSH</div>
              <p className="mt-2 text-sm text-white/60">
                Chame no WhatsApp ou agende um horário disponível.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Phone size={16} className="text-white/70" />
                    <span>(14) 99999-9999</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <MapPin size={16} className="text-white/70" />
                    <span>Agudos • Bauru e região</span>
                  </div>
                </div>

                <a
                  href={waUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
                >
                  <MessageCircle size={18} />
                  Chamar no WhatsApp
                </a>

                <Link
                  href="/agendar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10"
                >
                  <CalendarDays size={18} />
                  Agendar online
                </Link>
              </div>
            </div>
          </div>

          <footer className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-white/50">
            © {new Date().getFullYear()} MSH Hidráulica • Todos os direitos
            reservados.
          </footer>
        </div>
      </section>

      {/* WhatsApp Float */}
      <a
        href={waUrl()}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 shadow-2xl backdrop-blur hover:bg-white/15"
      >
        <MessageCircle size={18} />
        WhatsApp
      </a>
    </main>
  );
}
