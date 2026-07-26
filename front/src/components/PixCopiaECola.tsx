import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Check, Copy, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import api from '../services/api';

interface IngressoQtd {
  tipo: string;
  quantidade: number;
}

interface Props {
  sessaoId: number;
  ingressos: IngressoQtd[];
}

interface Cobranca {
  txid: string;
  valor: number;
  payload: string;
  recebedor: string;
  chave: string;
  expira_em_segundos: number;
}

function formatarBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mmss(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Área de pagamento PIX: busca o BR Code no servidor (que recalcula o valor),
 * renderiza o QR real a partir do payload e oferece o copia-e-cola.
 */
export function PixCopiaECola({ sessaoId, ingressos }: Props) {
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState(0);

  // O array de ingressos é recriado a cada render do pai; a chave serializada
  // é o que realmente identifica a cobrança e evita refetch em loop.
  const chaveIngressos = JSON.stringify(ingressos);

  // Cada incremento força a geração de um novo código (retry / expirado).
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const { data } = await api.post<Cobranca>('/api/pix/cobranca', {
          sessao_id: sessaoId,
          ingressos: JSON.parse(chaveIngressos) as IngressoQtd[],
        });
        const dataUrl = await QRCode.toDataURL(data.payload, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f0f13', light: '#ffffff' },
        });
        if (!ativo) return;
        setCobranca(data);
        setRestante(data.expira_em_segundos);
        setQrDataUrl(dataUrl);
        setErro('');
      } catch {
        if (ativo) setErro('Não foi possível gerar o código PIX. Tente novamente.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [sessaoId, chaveIngressos, tentativa]);

  function gerarNovamente() {
    setCarregando(true);
    setErro('');
    setCopiado(false);
    setTentativa((n) => n + 1);
  }

  // Contagem regressiva até a expiração do código.
  useEffect(() => {
    if (!cobranca || restante <= 0) return;
    const timer = setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cobranca, restante]);

  async function copiar() {
    if (!cobranca) return;
    try {
      await navigator.clipboard.writeText(cobranca.payload);
    } catch {
      // Contexto sem permissão de clipboard (http, iframe): seleciona via textarea.
      const area = document.createElement('textarea');
      area.value = cobranca.payload;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  }

  const expirado = restante === 0 && !!cobranca;

  if (carregando) {
    return (
      <div className="bg-zinc-800/50 border border-white/5 rounded-2xl p-10 mb-4 flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
        <p className="text-sm text-zinc-400">Gerando código PIX...</p>
      </div>
    );
  }

  if (erro || !cobranca) {
    return (
      <div className="bg-zinc-800/50 border border-red-500/30 rounded-2xl p-8 mb-4 text-center space-y-4">
        <TriangleAlert className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm text-zinc-300">{erro || 'Código indisponível.'}</p>
        <button
          onClick={gerarNovamente}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 hover:border-emerald-500/40 font-bold text-sm transition-colors duration-150 ease-out"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-2xl p-6 mb-4 space-y-5"
    >
      <div className="text-center">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-emerald-300">Pagamento via PIX</p>
        <p className="mt-1 text-2xl font-black text-white">{formatarBRL(cobranca.valor)}</p>
        <p className="text-xs text-zinc-500">{cobranca.recebedor}</p>
      </div>

      {/* QR gerado a partir do próprio payload — o que se lê é o que se copia. */}
      <div className="flex justify-center">
        <div className={`relative rounded-2xl bg-white p-3 shadow-lg transition-opacity ${expirado ? 'opacity-30' : ''}`}>
          <img src={qrDataUrl} alt="QR Code do pagamento PIX" className="w-44 h-44" />
          {expirado && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/70">
              <span className="text-xs font-black uppercase tracking-widest text-white">Expirado</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-400 mb-2">PIX copia e cola</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={cobranca.payload}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-300 truncate focus:outline-none focus:border-emerald-500"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={copiar}
            disabled={expirado}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors duration-150 ease-out ${
              copiado
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 disabled:opacity-40 disabled:hover:bg-emerald-500/15'
            }`}
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'Copiado!' : 'Copiar'}
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        {expirado ? (
          <button
            onClick={gerarNovamente}
            className="inline-flex items-center gap-2 font-bold text-emerald-300 hover:text-emerald-200 transition-colors duration-150"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Gerar novo código
          </button>
        ) : (
          <span className="text-zinc-500">
            Válido por <span className="font-mono font-bold text-zinc-300">{mmss(restante)}</span>
          </span>
        )}
        <span className="text-zinc-600 font-mono">{cobranca.txid.slice(0, 8)}</span>
      </div>

      <p className="text-[0.65rem] leading-relaxed text-zinc-500 border-t border-white/5 pt-3">
        Abra o app do banco, escolha PIX › Pagar com QR Code ou cole o código acima. Ambiente de
        demonstração: a chave é fictícia e nenhuma cobrança real é feita — a reserva é confirmada ao
        clicar em Confirmar Pagamento.
      </p>
    </motion.div>
  );
}
