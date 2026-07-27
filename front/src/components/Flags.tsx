/**
 * Bandeiras em SVG inline.
 *
 * Emoji de bandeira (🇧🇷/🇺🇸) não tem glyph no Windows: Chrome e Edge caem no
 * fallback e desenham as letras "BR"/"US". Como o ícone precisa aparecer em
 * qualquer sistema, elas são desenhadas aqui.
 */

interface FlagProps {
  className?: string;
}

export function FlagBR({ className = 'w-[18px] h-[13px]' }: FlagProps) {
  return (
    <svg viewBox="0 0 28 20" className={`${className} rounded-[2px] shrink-0`} aria-hidden focusable="false">
      <rect width="28" height="20" fill="#009B3A" />
      <path d="M14 2.6 25.6 10 14 17.4 2.4 10z" fill="#FEDF00" />
      <circle cx="14" cy="10" r="4.4" fill="#002776" />
      <path d="M9.9 8.4a9.6 9.6 0 0 1 8.3 2.2" stroke="#fff" strokeWidth="1.05" fill="none" />
    </svg>
  );
}

export function FlagUS({ className = 'w-[18px] h-[13px]' }: FlagProps) {
  return (
    <svg viewBox="0 0 28 20" className={`${className} rounded-[2px] shrink-0`} aria-hidden focusable="false">
      <rect width="28" height="20" fill="#fff" />
      {/* 7 listras vermelhas de 13 faixas */}
      {[0, 2, 4, 6, 8, 10, 12].map(i => (
        <rect key={i} y={(i * 20) / 13} width="28" height={20 / 13} fill="#B22234" />
      ))}
      <rect width="12" height={(20 / 13) * 7} fill="#3C3B6E" />
      {/* Estrelas sugeridas: em 12px reais, pontos leem melhor que estrelas */}
      {[0, 1, 2, 3].map(linha =>
        [0, 1, 2, 3, 4].map(coluna => (
          <circle
            key={`${linha}-${coluna}`}
            cx={1.3 + coluna * 2.4 + (linha % 2 ? 1.2 : 0)}
            cy={1.4 + linha * 2.5}
            r="0.62"
            fill="#fff"
          />
        )),
      )}
    </svg>
  );
}

export function Flag({ code, className }: { code: 'pt' | 'en'; className?: string }) {
  return code === 'pt' ? <FlagBR className={className} /> : <FlagUS className={className} />;
}
