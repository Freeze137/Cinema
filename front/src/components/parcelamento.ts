/** Máximo de parcelas oferecido no crédito. */
export const MAX_PARCELAS = 12;
/** Até esta quantidade de parcelas não há juros, independente do valor. */
export const PARCELAS_SEM_JUROS = 3;
/** Juros mensais aplicados a partir da 4ª parcela. */
export const TAXA_MENSAL = 0.0299;

export interface OpcaoParcela {
  parcelas: number;
  valorParcela: number;
  total: number;
  temJuros: boolean;
}

/**
 * Calcula a parcela pela Tabela Price: PMT = PV · i / (1 − (1 + i)^−n).
 * Sem juros, é a divisão simples do total.
 */
export function calcularParcela(total: number, parcelas: number): OpcaoParcela {
  const temJuros = parcelas > PARCELAS_SEM_JUROS;

  if (!temJuros) {
    return { parcelas, valorParcela: total / parcelas, total, temJuros: false };
  }

  const fator = TAXA_MENSAL / (1 - Math.pow(1 + TAXA_MENSAL, -parcelas));
  const valorParcela = total * fator;
  return { parcelas, valorParcela, total: valorParcela * parcelas, temJuros: true };
}

/** Lista de opções de 1x até MAX_PARCELAS para um total. */
export function opcoesParcelamento(total: number): OpcaoParcela[] {
  return Array.from({ length: MAX_PARCELAS }, (_, i) => calcularParcela(total, i + 1));
}

export function formatarBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
