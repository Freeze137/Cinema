import type { ReactNode } from 'react';

/** Bandeiras suportadas na detecção pelo BIN (primeiros dígitos). */
export type Bandeira =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'elo'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'jcb'
  | 'desconhecida';

export interface EstiloBandeira {
  nome: string;
  /** Três paradas do gradiente do cartão, nas cores da marca. */
  cores: [string, string, string];
  /** Cor do brilho difuso sobre o cartão (aceita alpha). */
  brilho: string;
  /** Quantidade de dígitos do código de segurança. */
  digitosCvv: number;
  /** Quantidade de dígitos do número (Amex e Diners são mais curtos). */
  digitosNumero: number;
  /** Agrupamento visual do número (soma = digitosNumero). */
  grupos: number[];
  logo: ReactNode;
}

/* ---------- Logos (SVG inline — sem requisição externa) ---------- */

// Marca atual (rebrand 2021): wordmark sólido, sem o swoosh dourado.
// Sobre fundo colorido a marca é aplicada em branco.
const logoVisa = (
  <svg viewBox="0 0 60 20" className="h-5 w-auto" aria-label="Visa">
    <text
      x="0"
      y="16"
      fill="#ffffff"
      fontFamily="'Helvetica Neue', Arial, sans-serif"
      fontSize="18"
      fontWeight="700"
      letterSpacing="-0.5"
    >
      VISA
    </text>
  </svg>
);

// Símbolo isolado (padrão desde 2019): dois círculos com sobreposição laranja.
const logoMastercard = (
  <svg viewBox="0 0 48 30" className="h-7 w-auto" aria-label="Mastercard">
    <circle cx="18" cy="15" r="11" fill="#eb001b" />
    <circle cx="30" cy="15" r="11" fill="#f79e1b" />
    <path d="M24 6.6a11 11 0 0 0 0 16.8 11 11 0 0 0 0-16.8Z" fill="#ff5f00" />
  </svg>
);

// Caixa azul (#006FCF) com o nome em duas linhas, como na arte atual do cartão.
const logoAmex = (
  <svg viewBox="0 0 46 26" className="h-7 w-auto" aria-label="American Express">
    <rect width="46" height="26" rx="2" fill="#006fcf" />
    <text
      x="23"
      y="12"
      fill="#ffffff"
      fontFamily="'Helvetica Neue', Arial, sans-serif"
      fontSize="7"
      fontWeight="700"
      textAnchor="middle"
      letterSpacing="0.2"
    >
      AMERICAN
    </text>
    <text
      x="23"
      y="21"
      fill="#ffffff"
      fontFamily="'Helvetica Neue', Arial, sans-serif"
      fontSize="7"
      fontWeight="700"
      textAnchor="middle"
      letterSpacing="0.2"
    >
      EXPRESS
    </text>
  </svg>
);

// Círculo tricolor (amarelo/vermelho/azul) + wordmark minúsculo.
const logoElo = (
  <svg viewBox="0 0 52 22" className="h-6 w-auto" aria-label="Elo">
    <g transform="translate(11 11)">
      <path d="M-8 0a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4Z" fill="#ffcb05" />
      <path d="M0-8a8 8 0 0 1 8 8h-4a4 4 0 0 0-4-4Z" fill="#00a4e0" />
      <path d="M8 0a8 8 0 0 1-8 8V4a4 4 0 0 0 4-4Z" fill="#ef4123" />
      <path d="M0 8a8 8 0 0 1-8-8h4a4 4 0 0 0 4 4Z" fill="#ffffff" fillOpacity="0.85" />
    </g>
    <text x="24" y="17" fill="#ffffff" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="14" fontWeight="700">
      elo
    </text>
  </svg>
);

// Wordmark branco sobre o vermelho da marca, como no cartão atual.
const logoHipercard = (
  <svg viewBox="0 0 76 16" className="h-4 w-auto" aria-label="Hipercard">
    <text
      x="0"
      y="12.5"
      fill="#ffffff"
      fontFamily="'Helvetica Neue', Arial, sans-serif"
      fontSize="13"
      fontWeight="700"
      letterSpacing="-0.4"
    >
      Hipercard
    </text>
  </svg>
);

const logoDiners = (
  <svg viewBox="0 0 74 20" className="h-5 w-auto" aria-label="Diners Club International">
    <circle cx="10" cy="10" r="9" fill="#ffffff" />
    <path d="M10 3a7 7 0 0 1 0 14Z" fill="#0079be" />
    <path d="M10 3a7 7 0 0 0 0 14Z" fill="#004a94" />
    <circle cx="10" cy="10" r="3.4" fill="#ffffff" />
    <text x="24" y="13.5" fill="#ffffff" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="8.5" fontWeight="700" letterSpacing="0.2">
      Diners Club
    </text>
  </svg>
);

// Wordmark com o arco laranja sob as letras (identidade atual).
const logoDiscover = (
  <svg viewBox="0 0 86 20" className="h-5 w-auto" aria-label="Discover">
    <text
      x="0"
      y="12"
      fill="#ffffff"
      fontFamily="'Helvetica Neue', Arial, sans-serif"
      fontSize="12"
      fontWeight="700"
      letterSpacing="-0.3"
    >
      DISC
    </text>
    <circle cx="34.5" cy="8" r="5" fill="#f58220" />
    <text
      x="41"
      y="12"
      fill="#ffffff"
      fontFamily="'Helvetica Neue', Arial, sans-serif"
      fontSize="12"
      fontWeight="700"
      letterSpacing="-0.3"
    >
      VER
    </text>
    <path d="M0 17c26 4 58 1 84-6v4c-26 6-58 8-84 4Z" fill="#f58220" />
  </svg>
);

// Três blocos J / C / B nas cores oficiais (azul, vermelho, verde).
const logoJcb = (
  <svg viewBox="0 0 56 20" className="h-6 w-auto" aria-label="JCB">
    <rect x="0" y="0" width="17" height="20" rx="2.5" fill="#0f4c9c" />
    <rect x="19.5" y="0" width="17" height="20" rx="2.5" fill="#c8102e" />
    <rect x="39" y="0" width="17" height="20" rx="2.5" fill="#009b3a" />
    <text x="8.5" y="14" fill="#ffffff" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
      J
    </text>
    <text x="28" y="14" fill="#ffffff" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
      C
    </text>
    <text x="47.5" y="14" fill="#ffffff" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
      B
    </text>
  </svg>
);

const logoGenerico = (
  <svg viewBox="0 0 40 16" className="h-4 w-auto" aria-label="Cartão">
    <rect x="0.5" y="0.5" width="39" height="15" rx="3" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
    <rect x="4" y="5" width="14" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.5" />
    <rect x="4" y="9.5" width="8" height="2" rx="1" fill="#ffffff" fillOpacity="0.3" />
  </svg>
);

/* ---------- Catálogo de bandeiras ---------- */

export const BANDEIRAS: Record<Bandeira, EstiloBandeira> = {
  visa: {
    nome: 'Visa',
    cores: ['#0c1046', '#1434cb', '#4b7bec'],
    brilho: 'rgba(255,255,255,0.20)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoVisa,
  },
  mastercard: {
    nome: 'Mastercard',
    cores: ['#1c0d0a', '#a4141f', '#f79e1b'],
    brilho: 'rgba(247,158,27,0.28)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoMastercard,
  },
  amex: {
    nome: 'American Express',
    cores: ['#00263a', '#006fcf', '#5fd0f5'],
    brilho: 'rgba(255,255,255,0.24)',
    digitosCvv: 4,
    digitosNumero: 15,
    grupos: [4, 6, 5],
    logo: logoAmex,
  },
  elo: {
    nome: 'Elo',
    cores: ['#050505', '#262626', '#6b5600'],
    brilho: 'rgba(255,203,5,0.26)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoElo,
  },
  hipercard: {
    nome: 'Hipercard',
    cores: ['#3d060c', '#a30c1c', '#f0454f'],
    brilho: 'rgba(255,210,0,0.22)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoHipercard,
  },
  diners: {
    nome: 'Diners Club',
    cores: ['#001a2c', '#0079be', '#7ad0f5'],
    brilho: 'rgba(255,255,255,0.22)',
    digitosCvv: 3,
    digitosNumero: 14,
    grupos: [4, 6, 4],
    logo: logoDiners,
  },
  discover: {
    nome: 'Discover',
    cores: ['#2b1400', '#d3630a', '#ffb35c'],
    brilho: 'rgba(245,130,32,0.30)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoDiscover,
  },
  jcb: {
    nome: 'JCB',
    cores: ['#08192e', '#0f4c9c', '#00b445'],
    brilho: 'rgba(255,255,255,0.18)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoJcb,
  },
  desconhecida: {
    nome: 'Cartão',
    cores: ['#111113', '#27272a', '#52525b'],
    brilho: 'rgba(249,115,22,0.22)',
    digitosCvv: 3,
    digitosNumero: 16,
    grupos: [4, 4, 4, 4],
    logo: logoGenerico,
  },
};

/* ---------- Helpers de máscara e detecção ---------- */

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, '');
}

/**
 * Detecta a bandeira pelos primeiros dígitos (BIN). Elo e Hipercard vêm antes
 * de Visa/Mastercard porque compartilham prefixos com elas.
 */
export function detectarBandeira(numero: string): Bandeira {
  const d = apenasDigitos(numero);
  if (!d) return 'desconhecida';

  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|651|655)/.test(d)) return 'elo';
  if (/^(38|60)/.test(d)) return 'hipercard';
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  if (/^3(0[0-5]|[68])/.test(d)) return 'diners';
  if (/^(6011|64[4-9]|65)/.test(d)) return 'discover';
  if (/^35/.test(d)) return 'jcb';
  return 'desconhecida';
}

/** Agrupa dígitos conforme o padrão da bandeira (Amex: 4-6-5). */
function agrupar(digitos: string, grupos: number[]) {
  const partes: string[] = [];
  let inicio = 0;
  for (const tamanho of grupos) {
    if (inicio >= digitos.length) break;
    partes.push(digitos.slice(inicio, inicio + tamanho));
    inicio += tamanho;
  }
  return partes.join(' ');
}

/** Formata o número digitado no input, respeitando o limite da bandeira. */
export function formatarNumeroCartao(valor: string, bandeira: Bandeira = detectarBandeira(valor)) {
  const { grupos, digitosNumero } = BANDEIRAS[bandeira];
  return agrupar(apenasDigitos(valor).slice(0, digitosNumero), grupos);
}

/** Número exibido na frente do cartão: dígitos faltantes viram •. */
export function numeroMascarado(valor: string, bandeira: Bandeira = detectarBandeira(valor)) {
  const { grupos, digitosNumero } = BANDEIRAS[bandeira];
  const d = apenasDigitos(valor).slice(0, digitosNumero).padEnd(digitosNumero, '•');
  return agrupar(d, grupos);
}

/** Formata validade como MM/AA, normalizando mês de um dígito (9 → 09). */
export function formatarValidade(valor: string) {
  const d = apenasDigitos(valor).slice(0, 4);
  if (d.length === 0) return '';
  if (d.length === 1) return Number(d) > 1 ? `0${d}/` : d;
  if (d.length === 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
