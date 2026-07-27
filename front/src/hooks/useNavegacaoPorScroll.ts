import { useEffect, useRef } from 'react';

interface Opcoes {
  /** Índice atual. */
  indice: number;
  /** Quantidade de itens navegáveis. */
  total: number;
  /** Chamado com o novo índice. */
  aoMudar: (novo: number) => void;
  /** Desliga o sequestro do scroll (ex.: "reduzir movimento" ligado). */
  desativado?: boolean;
}

/** Delta acumulado necessário para trocar de item — filtra trackpads sensíveis. */
const LIMIAR = 42;
/** Tempo mínimo entre trocas, em ms. */
const INTERVALO = 380;

/**
 * Navega entre itens com a roda do mouse.
 *
 * O scroll só é consumido enquanto existe próximo item naquela direção. Na
 * primeira cartela rolando para cima, ou na última rolando para baixo, o evento
 * passa direto e a página volta a rolar — ninguém fica preso na seção.
 */
export function useNavegacaoPorScroll<T extends HTMLElement>({ indice, total, aoMudar, desativado }: Opcoes) {
  const ref = useRef<T>(null);
  const acumulado = useRef(0);
  const ultimaTroca = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || desativado) return;

    function aoRolar(e: WheelEvent) {
      const descendo = e.deltaY > 0;
      const naPonta = descendo ? indice >= total - 1 : indice <= 0;

      // Deixa a página assumir quando não há mais para onde ir.
      if (naPonta) {
        acumulado.current = 0;
        return;
      }

      e.preventDefault();

      const agora = Date.now();
      if (agora - ultimaTroca.current < INTERVALO) return;

      // Zera ao inverter o sentido, senão sobra impulso da direção anterior.
      if (Math.sign(e.deltaY) !== Math.sign(acumulado.current)) acumulado.current = 0;
      acumulado.current += e.deltaY;

      if (Math.abs(acumulado.current) >= LIMIAR) {
        aoMudar(indice + (descendo ? 1 : -1));
        acumulado.current = 0;
        ultimaTroca.current = agora;
      }
    }

    // passive: false é obrigatório — sem isso preventDefault é ignorado.
    el.addEventListener('wheel', aoRolar, { passive: false });
    return () => el.removeEventListener('wheel', aoRolar);
  }, [indice, total, aoMudar, desativado]);

  return ref;
}
