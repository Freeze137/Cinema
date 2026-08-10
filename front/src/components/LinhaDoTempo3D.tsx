import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MarcoHistoria } from '../content/sobre';
import { useNavegacaoPorScroll } from '../hooks/useNavegacaoPorScroll';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Distância entre cartelas vizinhas, em px, no eixo horizontal. */
const PASSO_X = 300;
/** Quanto cada passo afunda no eixo Z. */
const PASSO_Z = 190;
/** Giro por passo, em graus. */
const PASSO_ROT = 26;
/** Cartelas visíveis de cada lado do marco ativo. */
const VIZINHOS = 2;

interface Props {
  marcos: MarcoHistoria[];
  labels: { anterior: string; proximo: string; marco: string; dica: string };
}

/**
 * Linha do tempo em profundidade: as cartelas ficam num trilho 3D e o marco
 * ativo vem à frente. Navegação por clique, arraste, teclado e marcadores.
 *
 * Com "reduzir movimento" ativo, vira uma lista vertical simples — o conteúdo
 * é o mesmo, sem o trilho.
 */
export function LinhaDoTempo3D({ marcos, labels }: Props) {
  const [ativo, setAtivo] = useState(0);
  const reduzirMovimento = useReducedMotion();
  const trilhoRef = useRef<HTMLDivElement>(null);

  const ir = useCallback(
    (destino: number) => setAtivo(Math.min(Math.max(destino, 0), marcos.length - 1)),
    [marcos.length],
  );

  // Roda do mouse avança os marcos; ao chegar na ponta, a página volta a rolar.
  const scrollRef = useNavegacaoPorScroll<HTMLDivElement>({
    indice: ativo,
    total: marcos.length,
    aoMudar: ir,
    desativado: reduzirMovimento ?? false,
  });

  // Setas só agem quando o trilho está em foco: não sequestra a navegação da página.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(ativo - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(ativo + 1); }
    }
    el.addEventListener('keydown', aoTeclar);
    return () => el.removeEventListener('keydown', aoTeclar);
  }, [ativo, ir]);

  if (reduzirMovimento) {
    return (
      <div className="mt-12 flex flex-col gap-8 border-l border-white/10 pl-6">
        {marcos.map(marco => (
          <div key={marco.titulo}>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-accent">{marco.ano}</p>
            <h3 className="mt-1.5 text-[19px] font-black text-white">{marco.titulo}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-400">{marco.texto}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-12" ref={scrollRef}>
      <div
        ref={trilhoRef}
        tabIndex={0}
        role="group"
        aria-label={labels.marco}
        className="relative h-[380px] w-full outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-3xl"
        style={{ perspective: 1400 }}
      >
        {/* Trilho luminoso ao fundo, sugerindo continuidade */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.35), transparent)' }}
        />

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) ir(ativo + 1);
            if (info.offset.x > 60) ir(ativo - 1);
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {marcos.map((marco, i) => {
            const offset = i - ativo;
            const distancia = Math.abs(offset);
            const visivel = distancia <= VIZINHOS;
            const eAtivo = offset === 0;

            return (
              <motion.button
                key={marco.titulo}
                onClick={() => (eAtivo ? undefined : ir(i))}
                aria-current={eAtivo}
                aria-hidden={!visivel}
                tabIndex={visivel ? 0 : -1}
                animate={{
                  x: offset * PASSO_X,
                  z: -distancia * PASSO_Z,
                  rotateY: offset * -PASSO_ROT,
                  opacity: visivel ? 1 - distancia * 0.34 : 0,
                  scale: 1 - distancia * 0.06,
                }}
                transition={{ duration: 0.42, ease: EASE }}
                className={`absolute left-1/2 top-1/2 w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 text-left ${
                  eAtivo
                    ? 'border-accent/40 bg-superficie shadow-[0_30px_70px_rgba(0,0,0,0.55)]'
                    : 'border-white/8 bg-fundo cursor-pointer'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex: marcos.length - distancia,
                  pointerEvents: visivel ? 'auto' : 'none',
                }}
              >
                <span className="text-[46px] font-black leading-none text-white/[0.06]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="-mt-6 text-[11px] font-black uppercase tracking-[0.16em] text-accent">{marco.ano}</p>
                <h3 className="mt-2 text-[19px] font-black leading-snug text-white">{marco.titulo}</h3>
                <AnimatePresence initial={false}>
                  {eAtivo && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.24, ease: EASE }}
                      className="mt-3 text-[14px] leading-relaxed text-zinc-400"
                    >
                      {marco.texto}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Controles */}
      <div className="mt-6 flex items-center justify-center gap-5">
        <button
          onClick={() => ir(ativo - 1)}
          disabled={ativo === 0}
          aria-label={labels.anterior}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/12 text-zinc-400 transition-colors duration-150 ease-out hover:border-accent hover:text-accent active:scale-90 disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/12 disabled:hover:text-zinc-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {marcos.map((marco, i) => (
            <button
              key={marco.titulo}
              onClick={() => ir(i)}
              aria-label={`${labels.marco} ${i + 1}`}
              aria-current={i === ativo}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-250 ease-out ${
                i === ativo ? 'w-7 bg-accent' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => ir(ativo + 1)}
          disabled={ativo === marcos.length - 1}
          aria-label={labels.proximo}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/12 text-zinc-400 transition-colors duration-150 ease-out hover:border-accent hover:text-accent active:scale-90 disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/12 disabled:hover:text-zinc-400"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-zinc-600">{labels.dica}</p>
    </div>
  );
}
