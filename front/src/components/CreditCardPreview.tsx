import { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { BANDEIRAS, detectarBandeira, numeroMascarado } from './cartaoBandeiras';

interface Props {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  /** Campo em foco: 'cvc' gira o cartão para o verso. */
  foco?: 'number' | 'name' | 'expiry' | 'cvc' | '';
}

/** Transição das cores da marca: longa o bastante para ler como fusão, não como corte. */
const transicaoCor = { duration: 0.55, ease: [0.32, 0.72, 0, 1] as const };
const transicaoFlip = { type: 'spring' as const, stiffness: 220, damping: 24, mass: 1 };
/** Mola do tilt: leve, com um resquício de inércia ao soltar o mouse. */
const molaTilt = { stiffness: 180, damping: 18, mass: 0.6 };

/** Gradiente montado sobre CSS vars — assim o Motion interpola cor a cor. */
const fundoFrente = 'linear-gradient(135deg, var(--c1) 0%, var(--c2) 52%, var(--c3) 100%)';
const fundoVerso = 'linear-gradient(215deg, var(--c1) 0%, var(--c2) 55%, var(--c3) 100%)';

/** Inclinação máxima em graus nas bordas do cartão. */
const TILT_MAX = 14;

/**
 * Cartão de crédito 3D: inclina seguindo o ponteiro, tem brilho holográfico
 * e varredura especular, camadas com profundidade real (translateZ) e flip
 * para o verso enquanto o CVV está em foco. A troca de bandeira interpola as
 * cores em vez de trocar o gradiente de uma vez.
 */
export function CreditCardPreview({ numero, nome, validade, cvv, foco = '' }: Props) {
  const bandeira = detectarBandeira(numero);
  const estilo = BANDEIRAS[bandeira];
  const virado = foco === 'cvc';
  const [c1, c2, c3] = estilo.cores;

  const semMovimento = useReducedMotion();
  const areaRef = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);

  // Posição do ponteiro normalizada (-0.5 .. 0.5) e em % para os brilhos.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const luzX = useMotionValue(50);
  const luzY = useMotionValue(50);
  const brilhoX = useSpring(luzX, { stiffness: 140, damping: 20 });
  const brilhoY = useSpring(luzY, { stiffness: 140, damping: 20 });

  const tiltX = useSpring(useTransform(py, (v) => -v * TILT_MAX * 2), molaTilt);
  const tiltY = useSpring(useTransform(px, (v) => v * TILT_MAX * 2), molaTilt);

  // Sombra e brilhos acompanham a inclinação.
  const sombra = useMotionTemplate`${useTransform(tiltY, (v) => -v * 1.6)}px ${useTransform(
    tiltX,
    (v) => 18 + v * 1.2,
  )}px 45px -12px rgba(0,0,0,0.8)`;
  const holografico = useMotionTemplate`radial-gradient(120% 90% at ${brilhoX}% ${brilhoY}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 28%, transparent 62%)`;
  const arcoIris = useMotionTemplate`conic-gradient(from ${useTransform(
    px,
    (v) => v * 220,
  )}deg at ${brilhoX}% ${brilhoY}%, #ff5f6d, #ffc371, #47e5bc, #43a7ff, #b06bff, #ff5f6d)`;

  function aoMover(evt: React.PointerEvent<HTMLDivElement>) {
    if (semMovimento) return;
    const area = areaRef.current;
    if (!area) return;
    const r = area.getBoundingClientRect();
    const nx = (evt.clientX - r.left) / r.width;
    const ny = (evt.clientY - r.top) / r.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
    luzX.set(nx * 100);
    luzY.set(ny * 100);
  }

  function aoSair() {
    setAtivo(false);
    px.set(0);
    py.set(0);
    luzX.set(50);
    luzY.set(50);
  }

  const varsCor = { '--c1': c1, '--c2': c2, '--c3': c3, '--glow': estilo.brilho } as React.CSSProperties;
  const camada = (z: number) => ({ transform: `translateZ(${z}px)` });

  return (
    <div
      ref={areaRef}
      onPointerMove={aoMover}
      onPointerEnter={() => !semMovimento && setAtivo(true)}
      onPointerLeave={aoSair}
      className="w-full max-w-[22rem] [perspective:1200px]"
    >
      {/* Camada de tilt: reage ao ponteiro e flutua devagar quando ocioso. */}
      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{ rotateX: tiltX, rotateY: tiltY, ...varsCor }}
        animate={{
          '--c1': c1,
          '--c2': c2,
          '--c3': c3,
          '--glow': estilo.brilho,
          y: semMovimento || ativo ? 0 : [0, -7, 0],
          scale: ativo ? 1.03 : 1,
        }}
        transition={{
          default: transicaoCor,
          y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
          scale: { type: 'spring', stiffness: 260, damping: 22 },
        }}
      >
        {/* Camada de flip */}
        <motion.div
          className="relative h-56 w-full [transform-style:preserve-3d]"
          animate={{ rotateY: virado ? 180 : 0 }}
          transition={transicaoFlip}
        >
          {/* FRENTE */}
          <motion.div
            className="absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d] overflow-hidden rounded-2xl p-6 ring-1 ring-white/15"
            style={{ background: fundoFrente, boxShadow: sombra }}
          >
            {/* Brilho difuso na cor de destaque da bandeira */}
            <div
              className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rotate-12 rounded-full blur-3xl"
              style={{ background: 'var(--glow)' }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/10" />

            {/* Textura de linhas finas — dá material ao plástico */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 7px)',
              }}
            />

            {/* Holográfico: arco-íris que gira com o ponteiro */}
            <motion.div
              className="pointer-events-none absolute inset-0 mix-blend-color-dodge"
              style={{ backgroundImage: arcoIris }}
              animate={{ opacity: ativo ? 0.22 : 0 }}
              transition={{ duration: 0.35 }}
            />

            {/* Especular: mancha de luz que segue o mouse */}
            <motion.div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ backgroundImage: holografico }}
              animate={{ opacity: ativo ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Varredura de brilho ao entrar o ponteiro */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              animate={ativo ? { x: ['0%', '460%'] } : { x: '0%' }}
              transition={ativo ? { duration: 1.1, ease: [0.32, 0.72, 0, 1] } : { duration: 0 }}
            />

            <div className="relative flex h-full flex-col justify-between [transform-style:preserve-3d]">
              <div className="flex items-start justify-between" style={camada(28)}>
                {/* Chip com reflexo animado */}
                <div className="relative h-9 w-12 overflow-hidden rounded-md bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-700 shadow-inner">
                  <div className="mx-auto mt-1.5 h-6 w-8 rounded-sm border border-yellow-800/50">
                    <div className="h-1/2 border-b border-yellow-800/50" />
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    animate={{ x: ['-120%', '160%'] }}
                    transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
                  />
                </div>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={bandeira}
                    initial={{ opacity: 0, scale: 0.85, rotateY: -60 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.85, rotateY: 60 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="drop-shadow-lg"
                  >
                    {estilo.logo}
                  </motion.div>
                </AnimatePresence>
              </div>

              <p
                className={`font-mono text-[1.35rem] tracking-[0.12em] drop-shadow-lg transition-colors duration-300 ${
                  foco === 'number' ? 'text-white' : 'text-white/95'
                }`}
                style={camada(20)}
              >
                {numeroMascarado(numero, bandeira)}
              </p>

              <div className="flex items-end justify-between gap-4" style={camada(14)}>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-bold tracking-widest text-white/50 uppercase">Titular</p>
                  <p className="truncate text-sm font-bold tracking-wide text-white uppercase drop-shadow">
                    {nome || 'SEU NOME AQUI'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[0.6rem] font-bold tracking-widest text-white/50 uppercase">Validade</p>
                  <p className="font-mono text-sm font-bold text-white drop-shadow">{validade || 'MM/AA'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* VERSO */}
          <motion.div
            className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] [transform-style:preserve-3d] overflow-hidden rounded-2xl ring-1 ring-white/15"
            style={{ background: fundoVerso, boxShadow: sombra }}
          >
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full blur-3xl"
              style={{ background: 'var(--glow)' }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/10" />
            <motion.div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ backgroundImage: holografico }}
              animate={{ opacity: ativo ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative flex h-full flex-col [transform-style:preserve-3d]">
              <div className="mt-5 h-11 w-full bg-gradient-to-b from-black/95 to-black/70" style={camada(6)} />

              <div className="px-6 pt-5" style={camada(18)}>
                <p className="mb-1 text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
                  Código de segurança
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 flex-1 items-center justify-end rounded-md bg-white/90 px-3 shadow-inner">
                    <motion.span
                      key={cvv.length}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="font-mono text-sm font-bold tracking-[0.3em] text-zinc-900"
                    >
                      {'•'.repeat(cvv.length)}
                    </motion.span>
                  </div>
                  <span className="font-mono text-xs text-white/70">{estilo.digitosCvv} dígitos</span>
                </div>
              </div>

              <div className="mt-auto flex items-end justify-between px-6 pb-5" style={camada(12)}>
                <p className="max-w-[60%] text-[0.55rem] leading-tight text-white/40">
                  Uso exclusivo do titular. Ambiente de demonstração — nenhum dado é enviado.
                </p>
                <div className="drop-shadow">{estilo.logo}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Sombra projetada no "chão", encolhe quando o cartão sobe */}
        <motion.div
          className="pointer-events-none absolute -bottom-6 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/60 blur-xl"
          animate={{ opacity: ativo ? 0.75 : 0.45, scaleX: ativo ? 0.92 : 1 }}
          transition={{ duration: 0.3 }}
          style={{ transform: 'translateZ(-60px)' }}
        />
      </motion.div>

      <div className="mt-8 h-4 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={bandeira}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="text-xs font-bold tracking-widest text-zinc-500 uppercase"
          >
            {estilo.nome}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
