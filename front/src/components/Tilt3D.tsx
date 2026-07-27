import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';

/** Perspectiva compartilhada: sem isso as rotações viram achatamento, não 3D. */
export const PERSPECTIVA = 1100;

/**
 * Inclina o filho conforme a posição do cursor.
 *
 * O movimento passa por motion values, não por estado: mover o mouse não
 * re-renderiza nada, só atualiza um transform no compositor.
 */
export function Tilt3D({
  children,
  intensidade = 12,
  className = '',
}: {
  children: React.ReactNode;
  intensidade?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduzirMovimento = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const mola = { stiffness: 260, damping: 26, mass: 0.5 };
  const rotX = useSpring(useTransform(py, [0, 1], [intensidade, -intensidade]), mola);
  const rotY = useSpring(useTransform(px, [0, 1], [-intensidade, intensidade]), mola);
  const brilhoX = useTransform(px, [0, 1], ['0%', '100%']);
  const brilhoY = useTransform(py, [0, 1], ['0%', '100%']);
  const brilho = useTransform(
    [brilhoX, brilhoY] as [MotionValue<string>, MotionValue<string>],
    ([x, y]: string[]) => `radial-gradient(420px circle at ${x} ${y}, rgba(255,255,255,0.14), transparent 45%)`,
  );

  function aoMover(e: React.MouseEvent<HTMLDivElement>) {
    if (reduzirMovimento) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }

  function aoSair() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div ref={ref} onMouseMove={aoMover} onMouseLeave={aoSair} style={{ perspective: PERSPECTIVA }} className={className}>
      <motion.div
        style={{
          rotateX: reduzirMovimento ? 0 : rotX,
          rotateY: reduzirMovimento ? 0 : rotY,
          transformStyle: 'preserve-3d',
        }}
        className="relative h-full w-full"
      >
        {children}
        {/* Reflexo que segue o cursor: vende a ideia de superfície física. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: reduzirMovimento ? 'none' : brilho }}
        />
      </motion.div>
    </div>
  );
}
