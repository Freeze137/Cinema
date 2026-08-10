import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import { ArrowLeft, Clock, Film, Ticket, Sparkles, ChevronRight } from 'lucide-react';
import { POSTS, CATEGORIAS, getPost, type Post, type PostCategoria } from '../blog/posts';
import { useLanguage } from '../contexts/languageContext';
import { LANGUAGES } from '../i18n/translations';
import { Flag } from '../components/Flags';
import { Tilt3D, PERSPECTIVA } from '../components/Tilt3D';
import { useNavegacaoPorScroll } from '../hooks/useNavegacaoPorScroll';

function formatarData(iso: string, locale: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Capa "cartaz": camadas empilhadas no eixo Z para dar profundidade real. */
function CapaPoster({ post, alto = false }: { post: Post; alto?: boolean }) {
  const [c1, c2] = post.capa;
  const sigla = post.sigla.toUpperCase();

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${alto ? 'aspect-[3/4]' : 'aspect-[16/10]'}`}
      style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 68%, var(--color-fundo-profundo) 100%)`, transformStyle: 'preserve-3d' }}
    >
      {/* Ranhuras verticais: textura de cartaz impresso */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 22px)' }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent 62%)' }} />

      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateZ(38px)' }}>
        <span className="px-4 text-center font-black leading-none tracking-tight text-white/95 [text-shadow:0_6px_26px_rgba(0,0,0,0.55)] text-[clamp(20px,4.2vw,40px)]">
          {sigla}
        </span>
      </div>

      <div className="absolute left-4 top-4" style={{ transform: 'translateZ(56px)' }}>
        <span className="rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/90">
          {CATEGORIAS[post.categoria]}
        </span>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2" style={{ transform: 'translateZ(46px)' }}>
        <Film className="h-3.5 w-3.5 text-white/80" />
        <span className="text-[11px] font-bold text-white/85">{post.leituraMin} min</span>
      </div>
    </div>
  );
}

function Cabecalho({ onVoltar, label }: { onVoltar: () => void; label: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(13,13,18,0.92)]">
      <div className="mx-auto flex max-w-pagina items-center justify-between px-gutter py-4">
        <button
          onClick={onVoltar}
          className="group flex cursor-pointer items-center gap-2 text-[13px] font-bold text-zinc-400 transition-colors duration-150 ease-out hover:text-accent active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
          {label}
        </button>

        <div className="flex items-center gap-5">
          {/* Mesmo padrão do site: bandeira à esquerda, sigla do país à direita. */}
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

/** Listagem: hero em profundidade + grade de cartazes inclináveis. */
function BlogIndex() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'pt-BR';
  const reduzirMovimento = useReducedMotion();
  const [filtro, setFiltro] = useState<PostCategoria | 'todos'>('todos');

  // Parallax do hero conforme o cursor.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const mola = { stiffness: 120, damping: 22, mass: 0.6 };
  const heroRotX = useSpring(useTransform(my, [0, 1], [7, -7]), mola);
  const heroRotY = useSpring(useTransform(mx, [0, 1], [-9, 9]), mola);
  const camadaFundo = useSpring(useTransform(mx, [0, 1], [22, -22]), mola);
  const camadaMeio = useSpring(useTransform(mx, [0, 1], [-16, 16]), mola);

  const destaques = useMemo(() => POSTS.filter(p => p.destaque), []);
  const listados = useMemo(
    () => (filtro === 'todos' ? POSTS : POSTS.filter(p => p.categoria === filtro)),
    [filtro],
  );

  const [destaqueAtivo, setDestaqueAtivo] = useState(0);
  const irParaDestaque = useCallback(
    (i: number) => setDestaqueAtivo(Math.min(Math.max(i, 0), destaques.length - 1)),
    [destaques.length],
  );
  // A roda do mouse troca o cartaz enquanto houver próximo; nas pontas, a
  // página volta a rolar normalmente.
  const pilhaRef = useNavegacaoPorScroll<HTMLDivElement>({
    indice: destaqueAtivo,
    total: destaques.length,
    aoMudar: irParaDestaque,
    desativado: reduzirMovimento ?? false,
  });

  function aoMoverHero(e: React.MouseEvent<HTMLDivElement>) {
    if (reduzirMovimento) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }

  const filtros: Array<{ id: PostCategoria | 'todos'; label: string }> = [
    { id: 'todos', label: t('blog.all') },
    ...(Object.keys(CATEGORIAS) as PostCategoria[]).map(c => ({ id: c, label: CATEGORIAS[c] })),
  ];

  return (
    <div className="min-h-screen w-full bg-fundo font-sans text-tinta">
      <Cabecalho onVoltar={() => navigate('/')} label={t('blog.back')} />

      {/* HERO */}
      <section
        onMouseMove={aoMoverHero}
        onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
        className="relative overflow-hidden border-b border-white/5"
        style={{ perspective: PERSPECTIVA }}
      >
        {/* Halos de fundo com parallax */}
        <motion.div
          aria-hidden
          style={{ x: reduzirMovimento ? 0 : camadaFundo }}
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full"
        >
          <div className="h-full w-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.16) 0%, transparent 66%)' }} />
        </motion.div>
        <motion.div
          aria-hidden
          style={{ x: reduzirMovimento ? 0 : camadaMeio }}
          className="pointer-events-none absolute -bottom-32 right-0 h-[380px] w-[380px] rounded-full"
        >
          <div className="h-full w-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.13) 0%, transparent 66%)' }} />
        </motion.div>
        {/* Piso em fuga: dá horizonte ao 3D */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-25"
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

        <div className="relative mx-auto grid max-w-pagina grid-cols-1 items-center gap-12 px-gutter py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent">
              <Sparkles className="h-3 w-3" />
              {t('blog.kicker')}
            </span>
            <h1 className="mt-5 text-[clamp(34px,6vw,64px)] font-black uppercase italic leading-[0.94] tracking-tight text-white">
              {t('blog.heroTitleA')}
              <span className="block text-accent">{t('blog.heroTitleB')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">{t('blog.heroLead')}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(`/blog/${destaques[0]?.slug ?? POSTS[0].slug}`)}
                className="cursor-pointer rounded-full bg-accent px-6 py-3 text-[12.5px] font-black uppercase tracking-[0.06em] text-accent-tinta transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {t('blog.readManifesto')}
              </button>
              <span className="text-[12px] font-medium text-zinc-600">
                {POSTS.length} {t('blog.postsCount')}
              </span>
            </div>
          </motion.div>

          {/* Pilha de cartazes em 3D — a roda do mouse troca o destaque */}
          <div ref={pilhaRef} className="relative mx-auto hidden w-full max-w-[420px] lg:block">
          <motion.div
            style={{
              rotateX: reduzirMovimento ? 0 : heroRotX,
              rotateY: reduzirMovimento ? 0 : heroRotY,
              transformStyle: 'preserve-3d',
            }}
            className="relative h-[420px] w-full"
          >
            {destaques.map((post, i) => {
              const offset = i - destaqueAtivo;
              const distancia = Math.abs(offset);
              const eAtivo = offset === 0;
              return (
                <motion.button
                  key={post.slug}
                  onClick={() => (eAtivo ? navigate(`/blog/${post.slug}`) : setDestaqueAtivo(i))}
                  aria-current={eAtivo}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: distancia > 2 ? 0 : 1 - distancia * 0.28,
                    x: offset * 104,
                    y: 0,
                    z: -distancia * 120,
                    rotateY: offset * -15,
                    scale: 1 - distancia * 0.07,
                  }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={eAtivo ? { y: -14 } : {}}
                  className="absolute left-1/2 top-1/2 w-[236px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-2xl border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.6)]"
                  style={{
                    transformStyle: 'preserve-3d',
                    zIndex: destaques.length - distancia,
                    pointerEvents: distancia > 2 ? 'none' : 'auto',
                  }}
                >
                  <CapaPoster post={post} alto />
                </motion.button>
              );
            })}
          </motion.div>

          {/* Marcadores: também dizem que a pilha é navegável */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {destaques.map((post, i) => (
              <button
                key={post.slug}
                onClick={() => irParaDestaque(i)}
                aria-label={post.titulo}
                aria-current={i === destaqueAtivo}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-200 ease-out ${
                  i === destaqueAtivo ? 'w-7 bg-accent' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] font-medium text-zinc-600">{t('blog.scrollHint')}</p>
          </div>
        </div>
      </section>

      {/* FILTROS + GRADE */}
      <section className="mx-auto max-w-pagina px-gutter py-14">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {filtros.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-[12px] font-bold transition-colors duration-150 ease-out active:scale-95 ${
                filtro === f.id
                  ? 'border-accent bg-accent text-accent-tinta'
                  : 'border-white/12 text-zinc-400 hover:border-accent/50 hover:text-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {listados.map(post => (
              <motion.article
                key={post.slug}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="group cursor-pointer"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <Tilt3D className="h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-superficie transition-colors duration-200 ease-out group-hover:border-accent/45">
                    <div style={{ transform: 'translateZ(26px)' }}>
                      <CapaPoster post={post} />
                    </div>
                    <div className="flex flex-1 flex-col p-5" style={{ transform: 'translateZ(18px)' }}>
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                        {CATEGORIAS[post.categoria]}
                        <span className="h-px w-4 bg-accent/40" />
                        <span className="font-bold text-zinc-600">{formatarData(post.data, locale)}</span>
                      </div>
                      <h2 className="text-[17px] font-black leading-snug text-white">{post.titulo}</h2>
                      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-500">{post.subtitulo}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-400 transition-colors duration-150 ease-out group-hover:text-accent">
                        {t('blog.read')}
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Tilt3D>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}

/** Leitura de um post: capa em profundidade + barra de progresso. */
function BlogPost({ post }: { post: Post }) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'pt-BR';
  const { scrollYProgress } = useScroll();
  const progresso = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [post.slug]);

  const relacionados = POSTS.filter(p => p.slug !== post.slug).slice(0, 3);
  const [c1] = post.capa;

  return (
    <div className="min-h-screen w-full bg-fundo font-sans text-tinta">
      <motion.div
        aria-hidden
        style={{ scaleX: progresso, transformOrigin: '0%' }}
        className="fixed inset-x-0 top-0 z-50 h-[3px] bg-accent"
      />
      <Cabecalho onVoltar={() => navigate('/blog')} label={t('blog.backToBlog')} />

      <article className="mx-auto max-w-leitura px-gutter pb-24 pt-12">
        <div className="mb-3 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">
          <span className="text-accent">{CATEGORIAS[post.categoria]}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">{formatarData(post.data, locale)}</span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1 text-zinc-500">
            <Clock className="h-3 w-3" />
            {post.leituraMin} min
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(28px,4.6vw,46px)] font-black leading-[1.05] tracking-tight text-white"
        >
          {post.titulo}
        </motion.h1>
        <p className="mt-4 text-[16px] leading-relaxed text-zinc-400">{post.subtitulo}</p>

        <div className="my-10" style={{ perspective: PERSPECTIVA }}>
          <Tilt3D intensidade={7} className="group">
            <CapaPoster post={post} />
          </Tilt3D>
        </div>

        <div className="space-y-6">
          {post.corpo.map((bloco, i) => {
            if (bloco.tipo === 'subtitulo') {
              return (
                <h2 key={i} className="pt-4 text-[22px] font-black tracking-tight text-white">
                  {bloco.texto}
                </h2>
              );
            }
            if (bloco.tipo === 'destaque') {
              return (
                <blockquote
                  key={i}
                  className="rounded-r-xl border-l-[3px] py-4 pl-5 pr-4 text-[17px] font-semibold italic leading-relaxed text-white"
                  style={{ borderColor: c1, background: 'rgba(255,255,255,0.035)' }}
                >
                  {bloco.texto}
                </blockquote>
              );
            }
            if (bloco.tipo === 'lista') {
              return (
                <ul key={i} className="space-y-2.5">
                  {bloco.itens?.map((item, j) => (
                    <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-zinc-300">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            if (bloco.tipo === 'codigo') {
              return (
                <pre
                  key={i}
                  className="no-scrollbar overflow-x-auto rounded-xl border border-white/8 bg-fundo-profundo p-4 text-[13px] leading-relaxed text-zinc-300"
                >
                  <code>{bloco.texto}</code>
                </pre>
              );
            }
            return (
              <p key={i} className="text-[16px] leading-[1.75] text-zinc-300">
                {bloco.texto}
              </p>
            );
          })}
        </div>

        <div className="mt-16 border-t border-white/8 pt-8">
          <h3 className="mb-5 text-[12px] font-black uppercase tracking-widest text-zinc-500">{t('blog.related')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {relacionados.map(p => (
              <button
                key={p.slug}
                onClick={() => navigate(`/blog/${p.slug}`)}
                className="group cursor-pointer text-left"
              >
                <Tilt3D intensidade={9}>
                  <div className="overflow-hidden rounded-xl border border-white/8 bg-superficie transition-colors duration-200 ease-out group-hover:border-accent/45">
                    <CapaPoster post={p} />
                    <p className="p-3.5 text-[13px] font-bold leading-snug text-white">{p.titulo}</p>
                  </div>
                </Tilt3D>
              </button>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

export function Blog() {
  const { slug } = useParams();
  const post = getPost(slug);

  if (slug && !post) {
    return <BlogIndex />;
  }
  return post ? <BlogPost post={post} /> : <BlogIndex />;
}
