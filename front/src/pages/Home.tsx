import { useEffect, useState, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Ticket, CalendarDays, Search, Globe, ChevronDown, ChevronLeft, ChevronRight,
  Play, Star, ThumbsUp, Calendar as CalendarIcon, Clock, MonitorPlay, DownloadCloud,
  X, MapPin, CheckCircle, Check,
} from 'lucide-react';

// Ícones sociais (removidos do lucide-react) — SVGs inline do design Movflx
const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-9h3l.5-3.5H13V7.3c0-1 .3-1.7 1.8-1.7H17V2.4C16.6 2.4 15.4 2.3 14 2.3c-2.9 0-4.9 1.8-4.9 5v2.2H6V13h3.1v9H13z" /></svg>
);
const Twitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.9 3.7A11.3 11.3 0 0 1 3.8 4.5a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 17.9a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2z" /></svg>
);
const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2.7 0-3.1 0-4.1.1-1.1 0-1.8.2-2.4.4a4.9 4.9 0 0 0-1.8 1.2A4.9 4.9 0 0 0 2.5 5.5c-.2.6-.4 1.3-.4 2.4C2 8.9 2 9.3 2 12s0 3.1.1 4.1c0 1.1.2 1.8.4 2.4a4.9 4.9 0 0 0 1.2 1.8 4.9 4.9 0 0 0 1.8 1.2c.6.2 1.3.4 2.4.4 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1 0 1.8-.2 2.4-.4a5.2 5.2 0 0 0 3-3c.2-.6.4-1.3.4-2.4.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c0-1.1-.2-1.8-.4-2.4a4.9 4.9 0 0 0-1.2-1.8 4.9 4.9 0 0 0-1.8-1.2c-.6-.2-1.3-.4-2.4-.4C15.1 2 14.7 2 12 2zm0 5.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zm0 7.6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5.8-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" /></svg>
);
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { toast } from '../components/toast';
import { useLanguage } from '../contexts/languageContext';
import { LANGUAGES } from '../i18n/translations';
import { encontrarCategoriaMeia, type CategoriaMeia } from '../components/meiaEntrada';

interface Sessao {
  id: number;
  data: string;
  horario: string;
  sala: string;
  tipo_sala: string;
  preco_base: number;
}

interface Filme {
  id: number;
  titulo: string;
  sinopse: string;
  duracao?: string;
  genero?: string;
  classificacao?: string;
  elenco?: string;
  lote?: number;
  sessoes: Sessao[];
}

interface Reserva {
  id: number;
  filme: string;
  data: string;
  horario: string;
  sala: string;
  assentos: string[];
  data_reserva: string;
  ingressos: Array<{
    tipo: string;
    valor: number;
    categoria_meia: string | null;
    comprovante_meia: string | null;
  }>;
  pagamento: {
    metodo: string;
    valor_total: number;
    parcelas: number;
    valor_parcela: number | null;
    valor_total_com_juros: number | null;
    taxa_juros_mensal: number;
    status: string | null;
  } | null;
}

interface CalendarSessao {
  filme_id: number;
  filme_titulo: string;
  horario: string;
  sala: string;
}

type ModalType = 'reservas' | 'calendario' | 'detalhes' | null;
type NavId = 'home' | 'movie' | 'reserva' | 'programacao' | 'pricing' | 'blog' | 'contacts';
type TabId = 'tv' | 'movies' | 'anime';

// Token de cor do design Movflx usado em estilo inline (radial glow do hero)
const ACCENT_GLOW = 'rgba(245,197,24,0.10)';

// Gradientes-placeholder dos cartazes (handoff: arte real entra via <img> depois)
const POSTER_GRADIENTS: Array<[string, string]> = [
  ['#3a1414', '#0e0707'],
  ['#142a4a', '#070d18'],
  ['#3a230d', '#150d06'],
  ['#241040', '#0d0618'],
  ['#3a0d22', '#16060e'],
];

// Animações rápidas/responsivas: durações curtas + easing dinâmico (ease-out).
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, type: 'tween', ease: 'easeOut' } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, type: 'tween', ease: 'easeOut' } },
};

export function Home() {
  const location = useLocation();
  // Estado enviado pelo checkout ao clicar em "Ver minha reserva".
  const navState = location.state as { abrirReservas?: boolean; reservaId?: number } | null;
  const chegouDoCheckout = Boolean(navState?.abrirReservas);

  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [activeDate] = useState<Date>(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(chegouDoCheckout ? 'reservas' : null);
  const [selectedMovie, setSelectedMovie] = useState<Filme | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState<number>(new Date().getDate());
  const [sessionesCalendarData, setSessionesCalendarData] = useState<Record<number, CalendarSessao[]>>({});
  const [activeNav, setActiveNav] = useState<NavId>(chegouDoCheckout ? 'reserva' : 'home');
  const [activeTab, setActiveTab] = useState<TabId>('tv');
  const [query, setQuery] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  // Reserva recém-criada: fica destacada no histórico por alguns segundos.
  const [reservaDestacada, setReservaDestacada] = useState<number | null>(
    chegouDoCheckout ? navState?.reservaId ?? null : null,
  );

  useEffect(() => {
    async function fetchFilmes() {
      setLoading(true);
      try {
        const isToday = activeDate.toDateString() === new Date().toDateString();
        const endpoint = isToday ? '/api/filmes' : `/api/filmes/cartaz/${activeDate.toISOString().split('T')[0]}`;
        const response = await api.get(endpoint);
        setFilmes(response.data);
      } catch (error) {
        console.error('Erro ao buscar filmes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFilmes();
  }, [activeDate]);

  useEffect(() => {
    if (activeModal === 'reservas' && user) {
      api.get('/api/minhas-reservas')
        .then(r => setReservas(r.data))
        .catch(() => setReservas([]));
    }
  }, [activeModal, user]);

  // Chegou do checkout ("Ver minha reserva"): o modal já abre montado (estado
  // inicial), aqui só limpamos o state para o F5 não reabrir sozinho.
  useEffect(() => {
    if (!chegouDoCheckout) return;
    if (!user) navigate('/login');
    else navigate('/', { replace: true, state: null });
  }, [chegouDoCheckout, user, navigate]);

  // O destaque é temporário: some sozinho depois que o usuário se localiza.
  useEffect(() => {
    if (reservaDestacada === null) return;
    const timer = setTimeout(() => setReservaDestacada(null), 6000);
    return () => clearTimeout(timer);
  }, [reservaDestacada]);

  useEffect(() => {
    if (activeModal === 'calendario') {
      async function fetchCalendarData() {
        try {
          const response = await api.get(
            `/api/calendario/${calendarViewDate.getFullYear()}/${calendarViewDate.getMonth() + 1}`
          );
          setSessionesCalendarData(response.data.dias_com_sessoes || {});
        } catch (error) {
          console.error('Erro ao buscar dados do calendário:', error);
        }
      }
      fetchCalendarData();
    }
  }, [activeModal, calendarViewDate]);

  const featuredMovie = filmes.length > 0 ? filmes[0] : null;

  // Busca filtra a grade por título ou gênero (case-insensitive)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filmes;
    return filmes.filter(f =>
      f.titulo.toLowerCase().includes(q) || (f.genero ?? '').toLowerCase().includes(q)
    );
  }, [filmes, query]);

  function handleNav(id: NavId) {
    setActiveNav(id);
    if (id === 'reserva') {
      if (user) {
        setActiveModal('reservas');
      } else {
        navigate('/login');
      }
    } else if (id === 'programacao') {
      setActiveModal('calendario');
    } else if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'movie') {
      document.getElementById('releases')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Rotas ainda não implementadas no backend — feedback mock.
      const labels: Record<string, string> = {
        pricing: 'Planos e Preços',
        blog: 'Blog Movflx',
        contacts: 'Contato',
      };
      toast(`${labels[id] ?? id}: rota ainda não conectada (mock)`);
    }
  }

  // Calendário
  const today = new Date();
  const monthName = calendarViewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const firstDay = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate();
  const calCells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  function getSessionsForDay(day: number) {
    return sessionesCalendarData[day] || [];
  }

  const navItems: Array<{ id: NavId; label: string; icon?: React.ReactNode }> = [
    { id: 'home', label: t('nav.home') },
    { id: 'movie', label: t('nav.movie') },
    { id: 'reserva', label: t('nav.reserva'), icon: <Ticket className="w-[15px] h-[15px]" /> },
    { id: 'programacao', label: t('nav.programacao'), icon: <CalendarDays className="w-[15px] h-[15px]" /> },
    { id: 'pricing', label: t('nav.pricing') },
    { id: 'blog', label: t('nav.blog') },
    { id: 'contacts', label: t('nav.contacts') },
  ];

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'tv', label: t('tab.tv') },
    { id: 'movies', label: t('tab.movies') },
    { id: 'anime', label: t('tab.anime') },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0d0d12] text-[#eaeaea] font-sans">

      {/* UTILITY BAR */}
      <div className="bg-[#08080b] border-b border-white/5">
        <div className="max-w-[1280px] mx-auto px-8 py-[9px] flex items-center justify-between text-xs">
          <p className="text-[#9a9aa2] m-0">
            {t('topbar.promo')} <span className="text-accent font-semibold">{t('topbar.promoAccent')}</span>
          </p>
          <div className="flex items-center gap-[18px] text-[#9a9aa2]">
            <button onClick={() => toast('Sobre nós — página institucional (em breve)')} className="cursor-pointer transition-colors duration-150 ease-out hover:text-accent">{t('topbar.about')}</button>
            <button onClick={() => toast('FAQS — central de ajuda (em breve)')} className="cursor-pointer transition-colors duration-150 ease-out hover:text-accent">{t('topbar.faqs')}</button>
            <span className="w-px h-[13px] bg-white/12" />
            <div className="flex gap-[13px]">
              <button onClick={() => toast('Abrir Facebook do Movflx (mock)')} className="flex cursor-pointer transition-colors duration-150 ease-out hover:text-accent"><Facebook className="w-[14px] h-[14px]" /></button>
              <button onClick={() => toast('Abrir Twitter/X do Movflx (mock)')} className="flex cursor-pointer transition-colors duration-150 ease-out hover:text-accent"><Twitter className="w-[14px] h-[14px]" /></button>
              <button onClick={() => toast('Abrir Instagram do Movflx (mock)')} className="flex cursor-pointer transition-colors duration-150 ease-out hover:text-accent"><Instagram className="w-[14px] h-[14px]" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-[rgba(13,13,18,0.92)] backdrop-blur-[14px] border-b border-white/5">
        <nav className="max-w-[1280px] mx-auto px-8 py-[18px] flex items-center gap-10">
          {/* Logo */}
          <div className="flex items-center gap-[11px] shrink-0">
            <span className="w-[38px] h-[38px] rounded-full bg-accent flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d0d12" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="2.4" fill="#0d0d12" />
                <circle cx="12" cy="6" r="1.4" fill="#0d0d12" />
                <circle cx="12" cy="18" r="1.4" fill="#0d0d12" />
                <circle cx="6" cy="12" r="1.4" fill="#0d0d12" />
                <circle cx="18" cy="12" r="1.4" fill="#0d0d12" />
              </svg>
            </span>
            <span className="font-extrabold text-[22px] tracking-[-0.02em] text-white">Movflx</span>
          </div>

          {/* Links */}
          <div className="hidden lg:flex items-center gap-[22px] text-[13.5px] font-semibold tracking-[0.02em]">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors duration-150 ease-out hover:text-accent ${
                  activeNav === item.id ? 'text-accent' : 'text-[#cfcfd6]'
                }`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </div>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-[18px]">
            <div className="relative hidden sm:block">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="bg-[#16161d] border border-white/[0.06] rounded-full py-2.5 pl-[18px] pr-10 text-[12.5px] text-[#e8e8e8] placeholder:text-[#7a7a84] w-[200px] outline-none transition-[width,border-color] duration-200 ease-out focus:w-[240px] focus:border-[rgba(245,197,24,0.45)]"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <Search className="w-[13px] h-[13px] text-[#0d0d12]" strokeWidth={2.4} />
              </span>
            </div>
            {/* Seletor de idioma (i18n): dropdown PT/EN, mostra o ativo, sem reload */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setLangMenuOpen(o => !o)}
                onBlur={() => setTimeout(() => setLangMenuOpen(false), 120)}
                className="flex items-center gap-1.5 text-[#bdbdc4] text-[12.5px] font-semibold cursor-pointer transition-colors duration-150 ease-out hover:text-accent"
              >
                <Globe className="w-[15px] h-[15px]" />
                {LANGUAGES.find(l => l.code === lang)?.label}
                <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ease-out ${langMenuOpen ? 'rotate-180' : ''}`} strokeWidth={2.4} />
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-[calc(100%+10px)] z-50 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#14141a] shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
                  >
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onMouseDown={() => { setLang(l.code); setLangMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-semibold text-left transition-colors duration-150 ease-out hover:bg-white/5 ${
                          lang === l.code ? 'text-accent' : 'text-[#bdbdc4]'
                        }`}
                      >
                        <span className="text-sm leading-none">{l.flag}</span>
                        {l.code === 'pt' ? 'Português' : 'English'}
                        {lang === l.code && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="border-[1.5px] border-accent text-accent bg-transparent px-[22px] py-[9px] rounded-full text-[12.5px] font-bold tracking-[0.06em] cursor-pointer transition-all duration-200 ease-out hover:bg-accent hover:text-[#0d0d12] hover:shadow-[0_8px_22px_rgba(245,197,24,0.45)]"
            >
              {user ? (user.nome ?? t('nav.account')).toUpperCase() : t('nav.signin')}
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#0d0d12]">
          <div
            className="absolute inset-0 opacity-60"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 132px), repeating-linear-gradient(rgba(255,255,255,0.03) 0 1px, transparent 1px 188px)' }}
          />
          <div
            className="absolute -top-[10%] -right-[5%] w-[620px] h-[620px] pointer-events-none"
            style={{ background: `radial-gradient(circle, ${ACCENT_GLOW}, transparent 65%)` }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d0d12 6%, transparent 60%)' }} />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-8 pt-[92px] pb-[110px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.p variants={fadeUp} className="text-accent font-bold text-base m-0 mb-3.5">Movflx</motion.p>
            <motion.h1 variants={fadeUp} className="text-[44px] sm:text-[62px] leading-[1.06] font-extrabold tracking-[-0.02em] text-white m-0 mb-[26px]">
              {t('hero.titleA')}<span className="text-accent">{t('hero.titleAccent')}</span>{t('hero.titleB')}
            </motion.h1>
            <motion.div variants={fadeUp} className="flex items-center flex-wrap gap-3.5 mb-[38px]">
              <span className="bg-[#1c1c24] text-[#cfcfd6] text-[11px] font-bold px-2.5 py-[5px] rounded-[5px] tracking-[0.04em]">
                {featuredMovie?.classificacao ?? 'PG 18'}
              </span>
              <span className="bg-[#1c1c24] text-[#cfcfd6] text-[11px] font-bold px-2.5 py-[5px] rounded-[5px]">HD</span>
              <span className="text-[#bdbdc4] text-[13.5px] font-medium">{featuredMovie?.genero ?? t('hero.genre')}</span>
              <span className="flex items-center gap-1.5 text-[#bdbdc4] text-[13.5px] font-medium">
                <CalendarIcon className="w-3.5 h-3.5 text-accent" />{new Date().getFullYear()}
              </span>
              <span className="flex items-center gap-1.5 text-[#bdbdc4] text-[13.5px] font-medium">
                <Clock className="w-3.5 h-3.5 text-accent" />{featuredMovie?.duracao ?? t('hero.duration')}
              </span>
            </motion.div>
            <motion.button
              variants={fadeUp}
              onClick={() => featuredMovie?.sessoes?.[0] && navigate(`/sessao/${featuredMovie.sessoes[0].id}`)}
              className="group inline-flex items-center gap-3.5 bg-transparent border-none text-white font-bold text-[13px] tracking-[0.08em] cursor-pointer p-0 transition-colors duration-150 ease-out hover:text-accent"
            >
              <span className="w-[54px] h-[54px] rounded-full border-[1.5px] border-accent flex items-center justify-center transition-all duration-200 ease-out">
                <Play className="w-4 h-4 fill-accent text-accent" />
              </span>
              {t('hero.watch')}
            </motion.button>
          </motion.div>

          {/* Frame / placeholder */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative border-[3px] border-accent rounded-lg p-2.5 shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
              <div className="aspect-[4/3] rounded relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #2a2230, #14141a)' }}>
                <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 10px, transparent 10px 20px)' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6a6a74" strokeWidth="1.4">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.8" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="font-mono text-[11px] text-[#7a7a84] tracking-[0.05em]">FOTO EM DESTAQUE</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* NEW RELEASE MOVIES */}
      <section id="releases" className="max-w-[1280px] mx-auto px-8 pt-2 pb-20">
        <div className="flex items-end justify-between mb-[30px] flex-wrap gap-[18px]">
          <div>
            <p className="text-accent text-xs font-bold tracking-[0.22em] uppercase m-0 mb-2">{t('releases.eyebrow')}</p>
            <h2 className="text-[32px] font-extrabold tracking-[-0.01em] text-white m-0">{t('releases.title')}</h2>
            <span className="block w-12 h-[3px] bg-accent rounded-[3px] mt-3" />
          </div>
          <div className="flex items-center gap-2.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); toast(`Filtrar por "${tab.label}" (categoria mock — backend ainda não separa por tipo)`); }}
                className={`px-5 py-[9px] rounded-full text-[12.5px] font-semibold cursor-pointer transition-all duration-150 ease-out border ${
                  activeTab === tab.id
                    ? 'bg-accent text-[#0d0d12] border-accent'
                    : 'bg-transparent text-[#bdbdc4] border-white/[0.14] hover:border-[rgba(245,197,24,0.45)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="w-px h-7 bg-white/10 mx-1" />
            <button onClick={() => toast('Carrossel: filmes anteriores (mock)')} className="w-[38px] h-[38px] rounded-full border border-white/12 bg-transparent text-[#bdbdc4] cursor-pointer flex items-center justify-center transition-all duration-150 ease-out hover:border-accent hover:text-accent active:scale-90">
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <button onClick={() => toast('Carrossel: próximos filmes (mock)')} className="w-[38px] h-[38px] rounded-full border border-accent bg-accent text-[#0d0d12] cursor-pointer flex items-center justify-center transition-all duration-150 ease-out hover:shadow-[0_8px_20px_rgba(245,197,24,0.45)] active:scale-90">
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[22px]">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-[#14141a] border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-[50px]">
            <p className="text-[#666] text-[15px] font-medium m-0">{t('grid.empty')}</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[22px]"
          >
            {filtered.map((filme, i) => {
              const [c1, c2] = POSTER_GRADIENTS[i % POSTER_GRADIENTS.length];
              const tag = filme.titulo.split(' ')[0].toUpperCase();
              return (
                <motion.article
                  key={filme.id}
                  variants={cardVariant}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
                  onClick={() => { setSelectedMovie(filme); setActiveModal('detalhes'); }}
                  className="bg-[#14141a] border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-[rgba(245,197,24,0.45)] hover:shadow-[0_22px_44px_rgba(0,0,0,0.5)] transition-[border-color,box-shadow] duration-200 ease-out"
                >
                  <div
                    className="relative w-full aspect-[3/4] overflow-hidden"
                    style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 70%, #0e0e13 100%)` }}
                  >
                    <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 26px)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-3.5">
                      <span className="font-extrabold text-[26px] tracking-[0.02em] text-white leading-none [text-shadow:0_3px_14px_rgba(0,0,0,0.5)] truncate max-w-full">
                        {tag}
                      </span>
                    </div>
                  </div>
                  <div className="px-3.5 pt-4 pb-1.5 text-center">
                    <div className="flex justify-center gap-[3px] mb-2.5 text-accent">
                      {[0, 1, 2, 3, 4].map(s => <Star key={s} className="w-3 h-3 fill-accent" />)}
                    </div>
                    <h3 className="text-white font-bold text-[15px] m-0 mb-[3px] truncate">{filme.titulo}</h3>
                    <p className="text-[#8a8a92] text-[12.5px] m-0 mb-3.5">{filme.genero ?? t('card.genre')}</p>
                  </div>
                  <div className="border-t border-white/5 px-3.5 py-[11px] flex items-center justify-center gap-3 text-[11.5px] text-[#9a9aa2] bg-[#101015]">
                    <span className="font-bold text-[#cfcfd6]">HD</span>
                    <span className="w-px h-[11px] bg-white/12" />
                    <span>{t('card.lang')}</span>
                    <span className="w-px h-[11px] bg-white/12" />
                    <span className="flex items-center gap-1.5"><ThumbsUp className="w-[13px] h-[13px] fill-accent text-accent" />3.5</span>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* OUR SERVICES / DOWNLOAD */}
      <section className="bg-[#0a0a0e] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto px-8 py-[74px] grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-16 items-center">
          <div className="relative bg-accent rounded-md p-[26px]">
            <span className="absolute top-[18px] right-[18px] bg-[#0d0d12] text-white text-xs font-bold px-3 py-[5px] rounded-[5px]">{t('services.price')}</span>
            <div className="bg-white rounded aspect-square flex flex-col items-center justify-end p-[30px]">
              <div className="flex-1 flex items-center justify-center">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#0d0d12" strokeWidth="1.4">
                  <circle cx="8" cy="12" r="3.4" />
                  <circle cx="16" cy="12" r="3.4" />
                  <path d="M11.4 12h1.2M2 11l2-2M22 11l-2-2" />
                </svg>
              </div>
              <p className="m-0 font-semibold text-[18px] text-[#0d0d12] self-start">{t('services.resLabel')}</p>
              <p className="m-0 font-extrabold text-[36px] text-[#0d0d12] self-start tracking-[-0.02em]">{t('services.resTitle')}</p>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2.5 text-accent text-xs font-bold tracking-[0.22em] uppercase m-0 mb-3.5">
              <span className="w-[22px] h-0.5 bg-accent" />{t('services.eyebrow')}
            </p>
            <h2 className="text-[34px] font-extrabold leading-[1.15] text-white m-0 mb-[18px] whitespace-pre-line">{t('services.title')}</h2>
            <p className="text-[#9a9aa2] text-sm leading-[1.7] max-w-[520px] m-0 mb-[30px]">
              {t('services.desc')}
            </p>
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <span className="w-[46px] h-[46px] rounded-full border border-[rgba(245,197,24,0.45)] flex items-center justify-center shrink-0">
                  <MonitorPlay className="w-5 h-5 text-accent" strokeWidth={1.7} />
                </span>
                <div>
                  <h4 className="m-0 mb-[5px] text-white text-base font-bold">{t('services.feature1.title')}</h4>
                  <p className="m-0 text-[#9a9aa2] text-[13px] leading-[1.6] max-w-[480px]">{t('services.feature1.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-[46px] h-[46px] rounded-full border border-[rgba(245,197,24,0.45)] flex items-center justify-center shrink-0">
                  <DownloadCloud className="w-5 h-5 text-accent" strokeWidth={1.7} />
                </span>
                <div>
                  <h4 className="m-0 mb-[5px] text-white text-base font-bold">{t('services.feature2.title')}</h4>
                  <p className="m-0 text-[#9a9aa2] text-[13px] leading-[1.6] max-w-[480px]">{t('services.feature2.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            {/* Entrada estilo Netflix: expande (scale 0.95→1) e sobe (y 32→0) com ease-out. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 32 }}
              transition={{ duration: 0.3, type: 'tween', ease: 'easeOut' }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(145deg, rgba(22,20,15,0.98) 0%, rgba(13,13,18,0.99) 100%)',
                backdropFilter: 'blur(48px)',
                border: '1px solid rgba(245,197,24,0.18)',
                boxShadow: '0 0 100px rgba(245,197,24,0.07), 0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(245,197,24,0.5),transparent)', zIndex: 1, pointerEvents: 'none' }} />

              {/* MODAL MINHAS RESERVAS */}
              {activeModal === 'reservas' && (
                <>
                  <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-accent">{t('modal.account')}</p>
                      <h2 className="text-2xl font-black text-white">{t('modal.bookings')}</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all duration-150 ease-out hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6 max-h-[60vh] overflow-y-auto">
                    {!user ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2 font-semibold">{t('bookings.loginPrompt')}</p>
                        <button onClick={() => { setActiveModal(null); navigate('/login'); }} className="bg-accent text-[#0d0d12] px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all duration-150 ease-out">
                          {t('bookings.login')}
                        </button>
                      </div>
                    ) : reservas.length === 0 ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2 font-semibold">{t('bookings.empty')}</p>
                      </div>
                    ) : (
                      <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
                        {reservas.map(r => {
                          const nova = r.id === reservaDestacada;
                          return (
                          <motion.div
                            key={r.id}
                            variants={fadeUp}
                            animate={nova ? { scale: [1, 1.02, 1] } : undefined}
                            transition={nova ? { duration: 0.5, ease: 'easeOut' } : undefined}
                            ref={nova ? (el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : undefined}
                            className={`flex items-start gap-4 rounded-2xl p-4 transition-all duration-150 ease-out hover:scale-[1.01] ${
                              nova ? 'ring-2 ring-emerald-400/70 shadow-[0_0_30px_-6px_rgba(52,211,153,0.45)]' : ''
                            }`}
                            style={{ background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(245,197,24,0.15)' }}
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.25)' }}>
                              <Ticket className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white font-bold text-sm">{r.filme}</p>
                                {nova && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/40">
                                    Nova
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{t('common.room')} {r.sala} • {r.assentos.length > 1 ? t('common.seats') : t('common.seat')} <span className="text-accent font-bold">{r.assentos.join(', ')}</span>
                              </p>
                              <p className="text-zinc-600 text-xs mt-1">{r.data} às {r.horario}</p>
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {r.ingressos.map((ing, idx) => (
                                  <span key={idx} className="text-[9px] px-2 py-1 rounded bg-accent/10 text-accent border border-accent/30">
                                    {ing.categoria_meia
                                      ? encontrarCategoriaMeia(ing.categoria_meia as CategoriaMeia)?.label ?? ing.tipo
                                      : ing.tipo}{' '}
                                    - R${ing.valor.toFixed(2)}
                                  </span>
                                ))}
                              </div>
                              {/* Meia só vale mediante comprovação na portaria. */}
                              {(() => {
                                const comprovantes = [...new Set(
                                  r.ingressos.map(i => i.comprovante_meia).filter((c): c is string => !!c)
                                )];
                                if (comprovantes.length === 0) return null;
                                return (
                                  <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2">
                                    {comprovantes.map(c => (
                                      <p key={c} className="text-[10px] leading-relaxed text-amber-200/85">
                                        Meia-entrada: apresente {c} na entrada.
                                      </p>
                                    ))}
                                  </div>
                                );
                              })()}
                              {/* Como foi pago — parcelamento vem calculado do servidor. */}
                              {r.pagamento && (
                                <p className="text-zinc-500 text-xs mt-2">
                                  {r.pagamento.metodo === 'pix' ? 'PIX à vista' : `Crédito ${r.pagamento.parcelas}x`}
                                  {' · '}
                                  <span className="text-zinc-300 font-bold">
                                    R${(r.pagamento.valor_total_com_juros ?? r.pagamento.valor_total).toFixed(2)}
                                  </span>
                                  {r.pagamento.parcelas > 1 && r.pagamento.valor_parcela != null && (
                                    <span className={r.pagamento.taxa_juros_mensal > 0 ? 'text-zinc-600' : 'text-emerald-400/80'}>
                                      {' '}({r.pagamento.parcelas}x de R${r.pagamento.valor_parcela.toFixed(2)}
                                      {r.pagamento.taxa_juros_mensal > 0 ? ' c/ juros' : ' s/ juros'})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-green-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                              <CheckCircle className="w-3 h-3" />OK
                            </div>
                          </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {/* MODAL CALENDÁRIO */}
              {activeModal === 'calendario' && (
                <>
                  <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-accent">{t('modal.schedule')}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors duration-150 ease-out text-zinc-400 hover:text-white"
                        ><ChevronLeft className="w-5 h-5" /></button>
                        <h2 className="text-xl sm:text-2xl font-black text-white capitalize min-w-[140px] text-center">{monthName}</h2>
                        <button
                          onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors duration-150 ease-out text-zinc-400 hover:text-white"
                        ><ChevronRight className="w-5 h-5" /></button>
                      </div>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all duration-150 ease-out hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6" style={{ overflowX: 'hidden' }}>
                    <div className="grid grid-cols-7 mb-2">
                      {[0, 1, 2, 3, 4, 5, 6].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-wider py-2">{t(`cal.${d}`)}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calCells.map((day, i) => {
                        if (!day) return <div key={i} />;
                        const currentCellDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
                        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isToday = currentCellDate.getTime() === todayDateOnly.getTime();
                        const isPast = currentCellDate < todayDateOnly;
                        const isSelected = day === selectedCalDay;
                        const hasSessao = sessionesCalendarData[day] && sessionesCalendarData[day].length > 0;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.005, type: 'tween', ease: 'easeOut' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              // Filtra client-side: só atualiza o estado e re-renderiza a grade
                              // abaixo. Sem troca de rota, sem refetch, sem fechar o modal.
                              if (!isPast) setSelectedCalDay(day);
                            }}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all duration-150 ease-out ${isSelected && !isPast
                              ? 'bg-accent text-[#0d0d12] shadow-lg shadow-accent/30'
                              : isToday
                                ? 'text-white shadow-xl ring-2 ring-accent/50'
                                : isPast
                                  ? 'text-zinc-700 cursor-default'
                                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer'
                            }`}
                          >
                            {day}
                            {hasSessao && !isPast && !isSelected && (
                              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {(() => {
                      const sessoesDoDia = getSessionsForDay(selectedCalDay);
                      const labelDia = selectedCalDay === today.getDate() ? t('schedule.today') : t('schedule.day', { day: selectedCalDay });
                      return (
                        <div className="mt-6 border-t border-white/5 pt-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-bold">{labelDia}</h4>
                            {sessoesDoDia.length > 0 && (
                              <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/30 px-2.5 py-1 rounded-full">
                                {sessoesDoDia.length} {sessoesDoDia.length === 1 ? t('schedule.session') : t('schedule.sessions')}
                              </span>
                            )}
                          </div>
                          {/* Grade re-renderizada dinamicamente conforme o dia selecionado (client-side) */}
                          <AnimatePresence mode="popLayout">
                            {sessoesDoDia.length > 0 ? (
                              <motion.div
                                key={selectedCalDay}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="flex flex-col gap-2 max-h-[34vh] overflow-y-auto pr-1"
                              >
                                {sessoesDoDia.map((s, idx) => (
                                  <motion.button
                                    key={`${s.filme_id}-${s.horario}-${idx}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03, duration: 0.18, ease: 'easeOut' }}
                                    whileHover={{ x: 3 }}
                                    onClick={() => toast(`Reservar "${s.filme_titulo}" às ${s.horario} — Sala ${s.sala} (mock: rota de sessão não disponível na programação)`)}
                                    className="flex items-center gap-3 text-left rounded-xl p-3 bg-white/[0.03] border border-white/5 hover:border-accent/40 transition-colors duration-150 ease-out cursor-pointer"
                                  >
                                    <span className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex flex-col items-center justify-center shrink-0">
                                      <Clock className="w-3.5 h-3.5 text-accent" />
                                      <span className="text-[10px] font-black text-accent mt-0.5">{s.horario}</span>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-white font-bold text-sm truncate">{s.filme_titulo}</p>
                                      <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3" />{t('common.room')} {s.sala}
                                      </p>
                                    </div>
                                    <Play className="w-4 h-4 text-zinc-600 shrink-0" />
                                  </motion.button>
                                ))}
                              </motion.div>
                            ) : (
                              <motion.p
                                key="vazio"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-sm text-zinc-500 italic text-center py-6"
                              >
                                {t('schedule.empty')}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* MODAL DETALHES DO FILME */}
              {activeModal === 'detalhes' && selectedMovie && (
                <>
                  <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-accent">{t('modal.about')}</p>
                      <h2 className="text-2xl font-black text-white">{selectedMovie.titulo}</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all duration-150 ease-out hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6 max-h-[60vh] overflow-y-auto space-y-6">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{t('details.synopsis')}</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">{selectedMovie.sinopse}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <h3 className="text-zinc-500 text-xs font-bold uppercase mb-1">{t('details.genre')}</h3>
                        <p className="text-zinc-200 text-sm font-medium">{selectedMovie.genero || t('details.notInformed')}</p>
                      </div>
                      <div>
                        <h3 className="text-zinc-500 text-xs font-bold uppercase mb-1">{t('details.duration')}</h3>
                        <p className="text-zinc-200 text-sm font-medium flex items-center gap-1"><Clock className="w-3 h-3 text-accent" /> {selectedMovie.duracao || t('details.notInformed')}</p>
                      </div>
                      <div>
                        <h3 className="text-zinc-500 text-xs font-bold uppercase mb-1">{t('details.rating')}</h3>
                        <span className="inline-block border border-zinc-500 text-white px-2 py-0.5 rounded text-xs font-bold bg-black/40">
                          {selectedMovie.classificacao || t('details.free')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-zinc-500 text-xs font-bold uppercase mb-1">{t('details.cast')}</h3>
                        <p className="text-zinc-200 text-sm font-medium italic">
                          {selectedMovie.elenco || t('details.unavailable')}
                        </p>
                      </div>
                    </div>
                    {selectedMovie.sessoes?.length > 0 && (
                      <button
                        onClick={() => { setActiveModal(null); navigate(`/sessao/${selectedMovie.sessoes[0].id}`); }}
                        className="w-full bg-accent text-[#0d0d12] font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-150 ease-out"
                      >
                        <Play className="w-4 h-4 fill-current" />{t('details.buy')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
