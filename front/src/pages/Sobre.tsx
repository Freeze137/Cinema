import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, Ticket, MapPin, Mail, Phone, Clock, ChevronDown,
  Sparkles, Armchair, Users, Projector,
} from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../contexts/languageContext';
import { LANGUAGES } from '../i18n/translations';
import { Flag } from '../components/Flags';
import { Tilt3D, PERSPECTIVA } from '../components/Tilt3D';
import { LinhaDoTempo3D } from '../components/LinhaDoTempo3D';
import { HISTORIA, VALORES, FAQ, CONTATO } from '../content/sobre';

interface Sala {
  id: number;
  numero: string;
  tipo: string;
  capacidade: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Identidade visual de cada tipo de sala: cor, rótulo e o que a diferencia. */
const SALAS_INFO: Record<string, { nome: string; cor: [string, string]; resumo: string }> = {
  STANDARD: {
    nome: 'Standard',
    cor: ['#3f3f46', '#18181b'],
    resumo: 'A sala tradicional: projeção digital, som estéreo e o preço-base da casa.',
  },
  KINO_EVOLUTION: {
    nome: 'Kino Evolution',
    cor: ['#1d4ed8', '#0b1a3d'],
    resumo: 'Projeção e som aprimorados, para quem quer sentir o filme e não só assistir.',
  },
  PLATINUM: {
    nome: 'Platinum',
    cor: ['#F5C518', '#4a3a00'],
    resumo: 'Menos poltronas, mais espaço entre elas. A sessão mais reservada da casa.',
  },
};

function Cabecalho({ onVoltar, label }: { onVoltar: () => void; label: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(13,13,18,0.92)]">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
        <button
          onClick={onVoltar}
          className="group flex cursor-pointer items-center gap-2 text-[13px] font-bold text-zinc-400 transition-colors duration-150 ease-out hover:text-accent active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
          {label}
        </button>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                title={l.nome}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-bold transition-colors duration-150 ease-out active:scale-95 ${
                  lang === l.code ? 'bg-white/[0.06] text-accent' : 'text-zinc-500 hover:text-accent'
                }`}
              >
                <Flag code={l.code} className="h-[11px] w-[16px]" />
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="h-[18px] w-[18px] text-accent" />
            <span className="text-[15px] font-black tracking-[0.16em] text-white">KINOPLEKIS</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function ItemFaq({ item, aberto, onToggle }: { item: typeof FAQ[number]; aberto: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/8">
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left transition-colors duration-150 ease-out hover:text-accent"
      >
        <span className={`text-[15px] font-bold ${aberto ? 'text-accent' : 'text-white'}`}>{item.pergunta}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ease-out ${aberto ? 'rotate-180 text-accent' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-[14.5px] leading-relaxed text-zinc-400">{item.resposta}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sobre() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const reduzirMovimento = useReducedMotion();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [faqAberta, setFaqAberta] = useState<number | null>(0);

  useEffect(() => {
    let cancelado = false;
    api.get('/api/salas')
      .then(r => { if (!cancelado) setSalas(r.data); })
      .catch(() => { if (!cancelado) setSalas([]); });
    return () => { cancelado = true; };
  }, []);

  // Âncoras vindas da topbar: /sobre#faq e /sobre#contato.
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const alvo = document.getElementById(location.hash.slice(1));
    alvo?.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth' });
  }, [location.hash, reduzirMovimento]);

  const totalPoltronas = salas.reduce((soma, s) => soma + s.capacidade, 0);
  const tiposDistintos = new Set(salas.map(s => s.tipo)).size;

  const numeros = [
    { valor: salas.length || '—', label: t('about.stats.rooms'), icone: <Projector className="h-4 w-4" /> },
    { valor: totalPoltronas || '—', label: t('about.stats.seats'), icone: <Armchair className="h-4 w-4" /> },
    { valor: tiposDistintos || '—', label: t('about.stats.experiences'), icone: <Sparkles className="h-4 w-4" /> },
    { valor: '8 × 12', label: t('about.stats.layout'), icone: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0d0d12] font-sans text-[#eaeaea]">
      <Cabecalho onVoltar={() => navigate('/')} label={t('about.back')} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.15) 0%, transparent 66%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,197,24,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.22) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
            transform: 'perspective(340px) rotateX(62deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
          }}
        />
        <div className="relative mx-auto max-w-[1180px] px-6 py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
              <Sparkles className="h-3 w-3" />
              {t('about.kicker')}
            </span>
            <h1 className="mt-5 max-w-3xl text-[clamp(32px,5.6vw,58px)] font-black uppercase italic leading-[0.96] tracking-tight text-white">
              {t('about.heroTitleA')}
              <span className="block text-accent">{t('about.heroTitleB')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-zinc-400">{t('about.heroLead')}</p>
          </motion.div>

          {/* Números da rede, vindos de /api/salas */}
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {numeros.map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i, ease: EASE }}
                className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"
              >
                <span className="flex items-center gap-2 text-accent">{n.icone}</span>
                <p className="mt-3 text-[30px] font-black leading-none text-white">{n.valor}</p>
                <p className="mt-1.5 text-[11.5px] font-bold uppercase tracking-wider text-zinc-500">{n.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="mx-auto max-w-[1180px] px-6 py-20">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">{t('about.storyKicker')}</h2>
        <p className="mt-3 max-w-2xl text-[clamp(24px,3.2vw,34px)] font-black leading-tight tracking-tight text-white">
          {t('about.storyTitle')}
        </p>

        <LinhaDoTempo3D
          marcos={HISTORIA}
          labels={{
            anterior: t('about.timelinePrev'),
            proximo: t('about.timelineNext'),
            marco: t('about.timelineStep'),
            dica: t('about.timelineHint'),
          }}
        />
      </section>

      {/* AS SALAS */}
      <section className="border-y border-white/5 bg-[#0a0a0e]">
        <div className="mx-auto max-w-[1180px] px-6 py-20" style={{ perspective: PERSPECTIVA }}>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">{t('about.roomsKicker')}</h2>
          <p className="mt-3 max-w-2xl text-[clamp(24px,3.2vw,34px)] font-black leading-tight tracking-tight text-white">
            {t('about.roomsTitle')}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Object.entries(SALAS_INFO).map(([tipo, info], i) => {
              const doTipo = salas.filter(s => s.tipo === tipo);
              const [c1, c2] = info.cor;
              return (
                <motion.div
                  key={tipo}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.3, delay: 0.06 * i, ease: EASE }}
                  className="group"
                >
                  <Tilt3D intensidade={9} className="h-full">
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#14141a] transition-colors duration-200 ease-out group-hover:border-accent/45">
                      <div
                        className="relative aspect-[16/9] w-full overflow-hidden"
                        style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 72%, #0a0a0e 100%)`, transformStyle: 'preserve-3d' }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 22px)' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(34px)' }}>
                          <span className="px-4 text-center text-[22px] font-black uppercase italic tracking-tight text-white/95 [text-shadow:0_6px_24px_rgba(0,0,0,0.5)]">
                            {info.nome}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5" style={{ transform: 'translateZ(16px)' }}>
                        <p className="flex-1 text-[13.5px] leading-relaxed text-zinc-400">{info.resumo}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          {doTipo.length > 0 ? (
                            doTipo.map(s => (
                              <span key={s.id} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-zinc-300">
                                {t('common.room')} {s.numero} · {s.capacidade} {t('about.seatsShort')}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600">{t('about.roomsLoading')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Tilt3D>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="mx-auto max-w-[1180px] px-6 py-20">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">{t('about.valuesKicker')}</h2>
        <p className="mt-3 max-w-2xl text-[clamp(24px,3.2vw,34px)] font-black leading-tight tracking-tight text-white">
          {t('about.valuesTitle')}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {VALORES.map((v, i) => (
            <motion.div
              key={v.titulo}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, delay: 0.05 * i, ease: EASE }}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-6"
            >
              <span className="text-[13px] font-black text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-[17px] font-black text-white">{v.titulo}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{v.texto}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5 bg-[#0a0a0e] scroll-mt-20">
        <div className="mx-auto max-w-[860px] px-6 py-20">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">{t('about.faqKicker')}</h2>
          <p className="mt-3 text-[clamp(24px,3.2vw,34px)] font-black leading-tight tracking-tight text-white">
            {t('about.faqTitle')}
          </p>
          <div className="mt-9">
            {FAQ.map((item, i) => (
              <ItemFaq
                key={item.pergunta}
                item={item}
                aberto={faqAberta === i}
                onToggle={() => setFaqAberta(faqAberta === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO — última seção, logo abaixo do FAQ */}
      <section id="contato" className="border-t border-white/5 scroll-mt-20">
        <div className="mx-auto max-w-[1180px] px-6 py-20">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">{t('about.contactKicker')}</h2>
          <p className="mt-3 max-w-2xl text-[clamp(24px,3.2vw,34px)] font-black leading-tight tracking-tight text-white">
            {t('about.contactTitle')}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icone: <Mail className="h-4 w-4" />, label: t('about.contactEmail'), valor: CONTATO.email, href: `mailto:${CONTATO.email}` },
              { icone: <Phone className="h-4 w-4" />, label: t('about.contactPhone'), valor: CONTATO.telefone, href: `tel:${CONTATO.telefone.replace(/\D/g, '')}` },
              { icone: <MapPin className="h-4 w-4" />, label: t('about.contactAddress'), valor: CONTATO.endereco },
              { icone: <Clock className="h-4 w-4" />, label: t('about.contactHours'), valor: CONTATO.horario },
            ].map(c => {
              const conteudo = (
                <>
                  <span className="flex items-center gap-2 text-accent">{c.icone}</span>
                  <p className="mt-3 text-[11.5px] font-bold uppercase tracking-wider text-zinc-500">{c.label}</p>
                  <p className="mt-1 text-[14px] font-semibold leading-snug text-white">{c.valor}</p>
                </>
              );
              return c.href ? (
                <a
                  key={c.label}
                  href={c.href}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors duration-150 ease-out hover:border-accent/45"
                >
                  {conteudo}
                </a>
              ) : (
                <div key={c.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  {conteudo}
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-accent/20 bg-accent/[0.05] p-6">
            <p className="text-[13.5px] leading-relaxed text-zinc-300">{t('about.disclaimer')}</p>
            <button
              onClick={() => navigate('/blog')}
              className="mt-4 cursor-pointer rounded-full bg-accent px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.06em] text-[#0d0d12] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              {t('about.readBlog')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
