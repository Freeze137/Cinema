/**
 * Categorias de meia-entrada oferecidas na bilheteria do Kinoplex.
 * Espelha CategoriaMeia no backend — os ids precisam bater.
 */
export type CategoriaMeia =
  | 'SICOOB_MASTERCARD_BLACK'
  | 'SICOOB_VISA_INFINITE'
  | 'SICOOB_PLATINUM'
  | 'SICOOB'
  | 'ESTUDANTE'
  | 'SENIOR'
  | 'PCD_AUTISTA'
  | 'ACOMPANHANTE_PCD'
  | 'PROFESSOR'
  | 'OUTRAS_LEI';

export interface OpcaoMeia {
  id: CategoriaMeia;
  /** Nome como aparece na bilheteria. */
  label: string;
  /** Resumo curto usado no seletor. */
  resumo: string;
  /** Documento exigido na entrada da sala. */
  comprovante: string;
  icone: string;
  /** Convênios ficam agrupados acima das meias legais, como no site. */
  grupo: 'convenio' | 'lei';
}

export const CATEGORIAS_MEIA: OpcaoMeia[] = [
  {
    id: 'SICOOB_MASTERCARD_BLACK',
    label: 'Meia Sicoob Mastercard Black',
    resumo: 'Cartão Sicoob Mastercard Black',
    comprovante: 'Cartão Sicoob Mastercard Black em nome do titular e documento com foto',
    icone: '💳',
    grupo: 'convenio',
  },
  {
    id: 'SICOOB_VISA_INFINITE',
    label: 'Meia Sicoob Visa Infinite',
    resumo: 'Cartão Sicoob Visa Infinite',
    comprovante: 'Cartão Sicoob Visa Infinite em nome do titular e documento com foto',
    icone: '💳',
    grupo: 'convenio',
  },
  {
    id: 'SICOOB_PLATINUM',
    label: 'Meia Sicoob Platinum',
    resumo: 'Cartão Sicoob Platinum',
    comprovante: 'Cartão Sicoob Platinum em nome do titular e documento com foto',
    icone: '💳',
    grupo: 'convenio',
  },
  {
    id: 'SICOOB',
    label: 'Meia Sicoob',
    resumo: 'Cartão Sicoob',
    comprovante: 'Cartão Sicoob em nome do titular e documento com foto',
    icone: '🏦',
    grupo: 'convenio',
  },
  {
    id: 'ESTUDANTE',
    label: 'Meia Estudante',
    resumo: 'ID Estudantil válida',
    comprovante: 'Carteira de estudante (ID Estudantil) válida e documento com foto',
    icone: '🎓',
    grupo: 'lei',
  },
  {
    id: 'SENIOR',
    label: 'Meia Senior (60+)',
    resumo: '60 anos ou mais',
    comprovante: 'Documento oficial com foto que comprove 60 anos ou mais',
    icone: '🧓',
    grupo: 'lei',
  },
  {
    id: 'PCD_AUTISTA',
    label: 'Meia PCD/Autistas',
    resumo: 'Laudo, CIPTEA ou carteira PCD',
    comprovante:
      'Laudo médico, CIPTEA ou cartão de identificação da pessoa com deficiência e documento com foto',
    icone: '♿',
    grupo: 'lei',
  },
  {
    id: 'ACOMPANHANTE_PCD',
    label: 'Meia Acomp PCD',
    resumo: 'Acompanhante de pessoa com deficiência',
    comprovante:
      'Comprovação da deficiência da pessoa acompanhada (laudo ou CIPTEA), presente na sessão, e documento com foto do acompanhante',
    icone: '🤝',
    grupo: 'lei',
  },
  {
    id: 'PROFESSOR',
    label: 'Meia Prof. Ensino',
    resumo: 'Professor da rede de ensino',
    comprovante:
      'Carteira funcional, contracheque ou declaração da instituição de ensino e documento com foto',
    icone: '📚',
    grupo: 'lei',
  },
  {
    id: 'OUTRAS_LEI',
    label: 'Outras meias por lei',
    resumo: 'Demais benefícios previstos em lei',
    comprovante:
      'Documento previsto na lei ou decreto que garante o benefício, junto de documento com foto',
    icone: '⚖️',
    grupo: 'lei',
  },
];

export const GRUPOS_MEIA: Array<{ id: OpcaoMeia['grupo']; titulo: string }> = [
  { id: 'convenio', titulo: 'Convênios' },
  { id: 'lei', titulo: 'Meias por lei' },
];

export function encontrarCategoriaMeia(id: CategoriaMeia | null) {
  return CATEGORIAS_MEIA.find(c => c.id === id) ?? null;
}
