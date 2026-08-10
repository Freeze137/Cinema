import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import api from '../services/api';
import { ChevronLeft, MapPin, Clock, Check, AlertCircle, Loader2, QrCode, CreditCard, Ticket } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { toast } from '../components/toast';
import { useLanguage } from '../contexts/languageContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PixCopiaECola } from '../components/PixCopiaECola';
import {
  CATEGORIAS_MEIA,
  GRUPOS_MEIA,
  encontrarCategoriaMeia,
  type CategoriaMeia,
} from '../components/meiaEntrada';
import { CreditCardPreview } from '../components/CreditCardPreview';
import {
  BANDEIRAS,
  apenasDigitos,
  detectarBandeira,
  formatarNumeroCartao,
  formatarValidade,
} from '../components/cartaoBandeiras';
import {
  PARCELAS_SEM_JUROS,
  TAXA_MENSAL,
  calcularParcela,
  formatarBRL,
  opcoesParcelamento,
} from '../components/parcelamento';

type CampoCartao = 'number' | 'name' | 'expiry' | 'cvc' | '';

const appleSpring = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 };
const applePage: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 35, mass: 0.8 } },
  exit: { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] } }
};

interface Sessao {
  id: number;
  filme: {
    id: number;
    titulo: string;
    sinopse: string;
    duracao: string;
    genero: string;
    classificacao: string;
  };
  sala: {
    numero: string;
    tipo: string;
    capacidade: number;
  };
  data: string;
  horario: string;
  preco_base: number;
  preco_sala: number;
  preco_ingresso: {
    inteira: number;
    meia: number;
    itau_promo: number;
  };
  assentos: Array<{
    id: number;
    fileira: string;
    numero: number;
    tamanho: string;
    status: string;
  }>;
}

/** Confirmação escrita pelo servidor, específica por meio de pagamento. */
interface ConfirmacaoPagamento {
  titulo: string;
  resumo: string;
  detalhe: string;
  selo: string;
}

/** Parcelamento como o servidor calculou e gravou (fonte da verdade). */
interface ParcelamentoConfirmado {
  parcelas: number;
  valor_parcela: number;
  valor_primeira_parcela: number;
  valor_total_com_juros: number;
  taxa_juros_mensal: number;
  tem_juros: boolean;
}

type Etapa = 'assentos' | 'ingressos' | 'pagamento' | 'sucesso';

export function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState<Etapa>('assentos');

  const [assentosSelecionados, setAssentosSelecionados] = useState<number[]>([]);
  const [ingressos, setIngressos] = useState({
    inteira: 0,
    meia: 0,
    itau_promo: 0,
  });
  // Benefício que justifica a meia — obrigatório quando há ingresso meia.
  const [categoriaMeia, setCategoriaMeia] = useState<CategoriaMeia | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix'>('cartao');
  const [parcelas, setParcelas] = useState(1);
  const [parcelamentoConfirmado, setParcelamentoConfirmado] = useState<ParcelamentoConfirmado | null>(null);
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoPagamento | null>(null);
  const [reservaNumero, setReservaNumero] = useState<number | null>(null);
  // Comprovantes exigidos, como o servidor devolveu na confirmação.
  const [avisosMeia, setAvisosMeia] = useState<Array<{ categoria: string; comprovante: string }>>([]);
  // Congelado no envio: o cartão pode ser limpo depois, mas o comprovante não muda.
  const [cartaoUsado, setCartaoUsado] = useState<{ bandeira: string; ultimos4: string } | null>(null);
  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  const [cardState, setCardState] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    focus: '' as CampoCartao,
  });

  // Bandeira detectada pelo BIN define cores, logo e limites dos campos.
  const bandeira = detectarBandeira(cardState.number);
  const regrasBandeira = BANDEIRAS[bandeira];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchSessao() {
      try {
        const response = await api.get(`/api/sessao/${id}`);
        setSessao(response.data);
      } catch (error) {
        console.error('Erro ao buscar sessão:', error);
        setErro('Erro ao carregar sessão');
      } finally {
        setLoading(false);
      }
    }

    fetchSessao();
  }, [id, user, navigate]);

  function toggleAssento(assentoId: number) {
    if (assentosSelecionados.includes(assentoId)) {
      setAssentosSelecionados(assentosSelecionados.filter(a => a !== assentoId));
    } else {
      setAssentosSelecionados([...assentosSelecionados, assentoId]);
    }
  }

  // Função corrigida para avançar de etapa e preencher ingressos padrão
  function handleAvancarParaIngressos() {
    if (assentosSelecionados.length > 0) {
      setIngressos({
        inteira: assentosSelecionados.length,
        meia: 0,
        itau_promo: 0
      });
      setEtapa('ingressos');
    }
  }

  function handleIngressoChange(tipo: 'inteira' | 'meia' | 'itau_promo', valor: number) {
    const novoValor = Math.max(0, valor);
    // Zerou a meia: o benefício deixa de fazer sentido.
    if (tipo === 'meia' && novoValor === 0) setCategoriaMeia(null);
    setIngressos(prev => ({
      ...prev,
      [tipo]: novoValor
    }));
  }

  const handleCardInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setCardState((prev) => {
      if (name === 'number') return { ...prev, number: formatarNumeroCartao(value) };
      if (name === 'expiry') return { ...prev, expiry: formatarValidade(value) };
      if (name === 'cvc') {
        return { ...prev, cvc: apenasDigitos(value).slice(0, regrasBandeira.digitosCvv) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCardInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setCardState((prev) => ({ ...prev, focus: evt.target.name as CampoCartao }));
  };

  // Sai do foco do CVV: cartão volta para a frente.
  const handleCardInputBlur = () => {
    setCardState((prev) => ({ ...prev, focus: '' }));
  };

  function calcularTotal() {
    const precos = sessao?.preco_ingresso;
    if (!precos) return 0;
    const totalInteira = ingressos.inteira * (precos.inteira ?? 0);
    const totalMeia = ingressos.meia * (precos.meia ?? 0);
    const totalItau = ingressos.itau_promo * (precos.itau_promo ?? 0);
    return totalInteira + totalMeia + totalItau;
  }

  /** Fallback quando a resposta não traz a confirmação escrita pelo servidor. */
  function montarConfirmacaoLocal(): ConfirmacaoPagamento {
    const op = calcularParcela(calcularTotal(), metodoPagamento === 'cartao' ? parcelas : 1);
    if (metodoPagamento === 'pix') {
      return {
        titulo: 'PIX confirmado!',
        resumo: `Recebemos ${formatarBRL(op.total)} à vista.`,
        detalhe: 'Compensação instantânea — não há parcelas nem taxas.',
        selo: 'PAGO À VISTA',
      };
    }
    return {
      titulo: 'Pagamento aprovado!',
      resumo:
        op.parcelas === 1
          ? `Cobrança única de ${formatarBRL(op.total)} no crédito.`
          : `${op.parcelas}x de ${formatarBRL(op.valorParcela)} ${op.temJuros ? 'com juros' : 'sem juros'}.`,
      detalhe: 'Na fatura, a compra aparece como KINOPLEX*CINEMA.',
      selo: op.parcelas === 1 ? 'CRÉDITO À VISTA' : op.temJuros ? 'PARCELADO COM JUROS' : 'SEM JUROS',
    };
  }

  /** Idem para o aviso de meia-entrada. */
  function avisosMeiaLocais() {
    const cat = encontrarCategoriaMeia(categoriaMeia);
    if (ingressos.meia === 0 || !cat) return [];
    return [{ categoria: cat.id, comprovante: cat.comprovante }];
  }

  async function handleConfirmarReserva(e: React.FormEvent) {
    e.preventDefault(); // Impede o recarregamento da tela (bug fix de pagamento inoperante)
    
    if (!sessao || assentosSelecionados.length === 0) {
      setErro('Selecione pelo menos um assento');
      return;
    }

    const totalIngressos = ingressos.inteira + ingressos.meia + ingressos.itau_promo;
    if (totalIngressos !== assentosSelecionados.length) {
      setErro(`Selecione ${assentosSelecionados.length} ingresso(s)`);
      return;
    }

    setProcessando(true);
    setErro('');
    try {
      const response = await api.post('/api/reservas', {
        reserva: {
          sessao_id: sessao.id,
          assentos: assentosSelecionados,
        },
        pagamento: {
          metodo: metodoPagamento,
          // Só o número de parcelas vai ao servidor — juros e valores são
          // recalculados lá, que é a fonte da verdade do preço.
          parcelas: metodoPagamento === 'cartao' ? parcelas : 1,
          ingressos: [
            { tipo: 'INTEIRA', quantidade: ingressos.inteira },
            { tipo: 'MEIA', quantidade: ingressos.meia, categoria_meia: categoriaMeia },
            { tipo: 'ITAU_PROMO', quantidade: ingressos.itau_promo },
          ].filter(ing => ing.quantidade > 0)
        }
      });

      setMensagemSucesso(`Código da reserva: ${response.data.reserva_id}`);
      // O servidor é quem define o parcelamento cobrado e o texto da
      // confirmação. Se a resposta vier sem esses campos (backend em versão
      // anterior), montamos um equivalente local para nunca cair em tela muda.
      const detalhes = response.data.detalhes ?? {};
      setParcelamentoConfirmado(detalhes.parcelamento ?? null);
      setConfirmacao(detalhes.confirmacao ?? montarConfirmacaoLocal());
      setReservaNumero(response.data.reserva_numero ?? null);
      setAvisosMeia(detalhes.meia_entrada ?? avisosMeiaLocais());
      setCartaoUsado(
        metodoPagamento === 'cartao'
          ? {
              bandeira: BANDEIRAS[detectarBandeira(cardState.number)].nome,
              ultimos4: apenasDigitos(cardState.number).slice(-4),
            }
          : null,
      );
      setEtapa('sucesso');
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      // detail pode vir como string (HTTPException) ou lista (validação Pydantic).
      const mensagem =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ')
            : 'Erro ao confirmar reserva. Verifique se o servidor está rodando.';
      setErro(mensagem);
      toast(mensagem);
      console.error('Falha ao confirmar reserva:', error);
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-fundo">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="flex items-center justify-center h-screen bg-fundo">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-400">{erro || 'Sessão não encontrada'}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-orange-400 hover:text-orange-300">
            Voltar para home
          </button>
        </div>
      </div>
    );
  }

  // Pagamento só libera com ingressos batendo com assentos e, havendo meia,
  // com o benefício escolhido (é ele que define o documento na entrada).
  const podeIrParaPagamento =
    ingressos.inteira + ingressos.meia + ingressos.itau_promo === assentosSelecionados.length &&
    (ingressos.meia === 0 || categoriaMeia !== null);

  // Etapa segura para renderizar: nunca mostra ingressos/pagamento sem assentos.
  const requerAssentos = (e: Etapa) => e === 'ingressos' || e === 'pagamento';
  const etapaSegura: Etapa = requerAssentos(etapa) && assentosSelecionados.length === 0 ? 'assentos' : etapa;
  // Só permite navegar para uma etapa cujos pré-requisitos foram atendidos.
  const podeIr = (destino: Etapa) =>
    destino === 'assentos' || (destino !== 'sucesso' && assentosSelecionados.length > 0);

  return (
    <ErrorBoundary onReset={() => setEtapa('assentos')} resetLabel="Voltar para assentos">
    <div className="min-h-screen bg-fundo text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-all duration-150 ease-out"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white">{sessao.filme?.titulo ?? 'Sessão'}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Sala {sessao.sala?.numero ?? '—'} <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ml-1 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">{sessao.sala?.tipo ?? 'STD'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {sessao.horario}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex items-center gap-4 mb-8">
          {(['assentos', 'ingressos', 'pagamento', 'sucesso'] as Etapa[]).map((e, idx) => (
            <React.Fragment key={e}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                layout
                onClick={() => podeIr(e) && setEtapa(e)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-150 ease-out ${
                  (['assentos', 'ingressos', 'pagamento', 'sucesso'].indexOf(etapaSegura) >= idx)
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                {idx + 1}
              </motion.button>
              {idx < 3 && <div className="flex-1 h-1 bg-zinc-800" />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
        {/* ETAPA 1: ASSENTOS */}
        {etapaSegura === 'assentos' && (
          <motion.div key="etapa-assentos" variants={applePage} initial="hidden" animate="visible" exit="exit" className="origin-top">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 mb-8">
              <h2 className="text-2xl font-black mb-6 text-white">{t('seat.title')}</h2>

              <div className="flex justify-center mb-8">
                <div className="w-full max-w-2xl">
                  {/* Tela do cinema */}
                  <div className="text-center mb-8">
                    <div className="inline-block px-8 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full text-white font-black text-sm mb-4">
                      {t('seat.screen')}
                    </div>
                  </div>

                  {/* Mapa de assentos */}
                  <div className="grid gap-2 max-w-2xl mx-auto">
                    {Array.from({ length: 8 }).map((_, filIdx) => {
                      const fileira = String.fromCharCode(65 + filIdx);
                      const assentosFileira = (sessao.assentos ?? []).filter(a => a.fileira === fileira);

                      return (
                        <div key={fileira} className="flex items-center gap-2">
                          <span className="w-6 text-center font-bold text-zinc-500 text-sm">{fileira}</span>
                          <div className="flex gap-2 flex-wrap justify-center">
                            {assentosFileira.map(assento => {
                              const isSelected = assentosSelecionados.includes(assento.id);
                              const isOcupado = assento.status === 'OCUPADO';
                              const isGrande = assento.tamanho === 'GRANDE';

                              return (
                                <motion.button
                                  key={assento.id}
                                  layout
                                  transition={appleSpring}
                                  whileHover={!isOcupado ? { scale: 1.15, y: -4 } : {}}
                                  whileTap={!isOcupado ? { scale: 0.85 } : {}}
                                  onClick={() => !isOcupado && toggleAssento(assento.id)}
                                  className={`relative flex items-center justify-center transition-colors duration-150 ease-out ${isGrande ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-10 sm:h-10'} rounded-t-lg ${
                                    isOcupado
                                      ? 'bg-zinc-700 opacity-60 cursor-not-allowed'
                                      : isSelected
                                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-md shadow-orange-500/30'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                  }`}
                                >
                                  <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-md tracking-tighter">
                                    {assento.fileira}{assento.numero}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex gap-8 justify-center mt-8 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-600 rounded-t-lg flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">A1</span>
                      </div>
                      <span className="text-sm text-zinc-400">{t('seat.available')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-t-lg flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">A2</span>
                      </div>
                      <span className="text-sm text-zinc-400">{t('seat.selected')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-700 opacity-60 rounded-t-lg flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">A3</span>
                      </div>
                      <span className="text-sm text-zinc-400">{t('seat.occupied')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info assentos selecionados */}
              {assentosSelecionados.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6">
                  <p className="text-orange-400 font-bold">
                    {t('seat.selectedLabel')} ({assentosSelecionados.length}):
                  </p>
                  <motion.div layout className="flex gap-2 flex-wrap mt-2">
                    <AnimatePresence>
                    {(sessao.assentos ?? [])
                      .filter(a => assentosSelecionados.includes(a.id))
                      .map(a => (
                        <motion.span
                          layout
                          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }} transition={appleSpring}
                          key={a.id} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-lg text-sm font-bold"
                        >
                          {a.fileira}{a.numero}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {erro && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {erro}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all duration-150 ease-out"
                >
                  {t('seat.cancel')}
                </button>
                <button
                  onClick={handleAvancarParaIngressos}
                  disabled={assentosSelecionados.length === 0}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-150 ease-out flex items-center gap-2 ${
                    assentosSelecionados.length > 0
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {t('seat.next')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ETAPA 2: INGRESSOS */}
        {etapaSegura === 'ingressos' && (
          <motion.div key="etapa-ingressos" variants={applePage} initial="hidden" animate="visible" exit="exit" className="origin-top">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 mb-8">
              <h2 className="text-2xl font-black mb-6 text-white">{t('tickets.title')}</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { tipo: 'inteira', label: t('tickets.full'), preco: sessao.preco_ingresso?.inteira ?? 0 },
                  { tipo: 'meia', label: t('tickets.half'), preco: sessao.preco_ingresso?.meia ?? 0 },
                  { tipo: 'itau_promo', label: t('tickets.itau'), preco: sessao.preco_ingresso?.itau_promo ?? 0 },
                ].map(ing => (
                  <div
                    key={ing.tipo}
                    className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 rounded-2xl p-6"
                  >
                    <p className="text-sm text-zinc-400 mb-2">{ing.label}</p>
                    <p className="text-2xl font-black text-orange-400 mb-4">R${ing.preco.toFixed(2)}</p>

                    <div className="flex items-center gap-3 bg-zinc-950 rounded-xl p-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() =>
                          handleIngressoChange(ing.tipo as 'inteira' | 'meia' | 'itau_promo', ingressos[ing.tipo as 'inteira' | 'meia' | 'itau_promo'] - 1)
                        }
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors duration-150 ease-out text-white"
                      >
                        −
                      </motion.button>
                      <span className="flex-1 text-center font-black text-lg">
                        {ingressos[ing.tipo as 'inteira' | 'meia' | 'itau_promo']}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() =>
                          handleIngressoChange(
                            ing.tipo as 'inteira' | 'meia' | 'itau_promo',
                            ingressos[ing.tipo as 'inteira' | 'meia' | 'itau_promo'] + 1
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-500 flex items-center justify-center transition-colors duration-150 ease-out font-bold text-white"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              {/* CATEGORIA DA MEIA — some junto com o ingresso meia */}
              <AnimatePresence>
                {ingressos.meia > 0 && (
                  <motion.div
                    key="categoria-meia"
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={appleSpring}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-5">
                      <p className="text-sm font-bold text-zinc-300">
                        Qual benefício dá direito à meia?
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 mb-4">
                        {ingressos.meia} ingresso(s) meia — escolha uma opção para continuar.
                      </p>

                      <div className="space-y-4">
                        {GRUPOS_MEIA.map(grupo => (
                          <div key={grupo.id}>
                            <p className="text-[0.65rem] font-black uppercase tracking-widest text-zinc-600 mb-2">
                              {grupo.titulo}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {CATEGORIAS_MEIA.filter(c => c.grupo === grupo.id).map(cat => (
                                <motion.button
                                  key={cat.id}
                                  type="button"
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setCategoriaMeia(cat.id)}
                                  className={`rounded-xl border-2 px-3 py-2.5 text-left transition-colors duration-150 ease-out ${
                                    categoriaMeia === cat.id
                                      ? 'border-orange-500 bg-orange-500/10'
                                      : 'border-white/5 bg-zinc-800 hover:border-orange-500/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-base shrink-0">{cat.icone}</span>
                                    <span className="font-bold text-xs text-white leading-tight">{cat.label}</span>
                                    {categoriaMeia === cat.id && (
                                      <Check className="w-4 h-4 text-orange-400 ml-auto shrink-0" />
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-[0.7rem] text-zinc-500 leading-snug">{cat.resumo}</p>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {categoriaMeia && (
                        <p className="mt-4 text-xs text-amber-300/90 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                          Na entrada da sala será exigido: {encontrarCategoriaMeia(categoriaMeia)?.comprovante}.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {ingressos.meia > 0 && !categoriaMeia && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-yellow-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Escolha o benefício da meia-entrada para prosseguir
                </div>
              )}

              {ingressos.inteira + ingressos.meia + ingressos.itau_promo !== assentosSelecionados.length && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-yellow-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Selecione {assentosSelecionados.length} ingresso(s) para {assentosSelecionados.length} assento(s)
                </div>
              )}

              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setEtapa('assentos')}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all duration-150 ease-out"
                >
                  {t('tickets.back')}
                </button>
                <button
                  onClick={() => podeIrParaPagamento && setEtapa('pagamento')}
                  disabled={!podeIrParaPagamento}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-150 ease-out ${
                    podeIrParaPagamento
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {t('tickets.proceed')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ETAPA 3: PAGAMENTO */}
        {etapaSegura === 'pagamento' && (
          <motion.div key="etapa-pagamento" variants={applePage} initial="hidden" animate="visible" exit="exit" className="origin-top">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Resumo */}
              <div className="md:col-span-2 bg-zinc-900 border border-white/5 rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-6 text-white">{t('pay.title')}</h2>

                <div className="space-y-4 mb-8">
                  {([
                    { id: 'cartao', label: t('pay.card'), icon: '💳' },
                    { id: 'pix', label: t('pay.pix'), icon: '📱' },
                  ] as const).map(met => (
                    <motion.button
                      key={met.id}
                      layout
                      transition={appleSpring}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setMetodoPagamento(met.id);
                        if (met.id === 'pix') setParcelas(1); // PIX é sempre à vista
                      }}
                      className={`w-full p-4 rounded-2xl border-2 transition-colors duration-150 ease-out flex items-center gap-3 ${
                        metodoPagamento === met.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-white/5 bg-zinc-800 hover:border-orange-500/30'
                      }`}
                    >
                      <span className="text-2xl">{met.icon}</span>
                      <span className="font-bold">{met.label}</span>
                      {metodoPagamento === met.id && (
                        <Check className="w-5 h-5 text-orange-400 ml-auto" />
                      )}
                    </motion.button>
                  ))}
                </div>

                {metodoPagamento === 'cartao' && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <CreditCardPreview
                        numero={cardState.number}
                        nome={cardState.name}
                        validade={cardState.expiry}
                        cvv={cardState.cvc}
                        foco={cardState.focus}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-300">Número do Cartão</label>
                      <input
                        type="text"
                        name="number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        value={cardState.number}
                        onChange={handleCardInputChange}
                        onFocus={handleCardInputFocus}
                        onBlur={handleCardInputBlur}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white font-mono tracking-wider placeholder:text-zinc-600 placeholder:font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-300">Nome no Cartão</label>
                      <input
                        type="text"
                        name="name"
                        autoComplete="cc-name"
                        placeholder="Nome Impresso no Cartão"
                        value={cardState.name}
                        onChange={handleCardInputChange}
                        onFocus={handleCardInputFocus}
                        onBlur={handleCardInputBlur}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-300">Validade</label>
                        <input
                          type="text"
                          name="expiry"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/AA"
                          value={cardState.expiry}
                          onChange={handleCardInputChange}
                          onFocus={handleCardInputFocus}
                          onBlur={handleCardInputBlur}
                          maxLength={5}
                          className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-300">
                          CVV <span className="text-zinc-500 font-normal">({regrasBandeira.digitosCvv} dígitos)</span>
                        </label>
                        <input
                          type="password"
                          name="cvc"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder={'•'.repeat(regrasBandeira.digitosCvv)}
                          value={cardState.cvc}
                          onChange={handleCardInputChange}
                          onFocus={handleCardInputFocus}
                          onBlur={handleCardInputBlur}
                          maxLength={regrasBandeira.digitosCvv}
                          className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* PARCELAMENTO — até 3x sem juros, acima disso com juros */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-300">Parcelamento</label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {opcoesParcelamento(calcularTotal()).map(op => (
                          <motion.button
                            key={op.parcelas}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setParcelas(op.parcelas)}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ease-out ${
                              parcelas === op.parcelas
                                ? 'border-orange-500 bg-orange-500/10'
                                : 'border-white/5 bg-zinc-800 hover:border-orange-500/30'
                            }`}
                          >
                            <span className="text-sm font-bold text-white">
                              {op.parcelas}x de {formatarBRL(op.valorParcela)}
                            </span>
                            <span
                              className={`text-[0.65rem] font-bold uppercase tracking-wider ${
                                op.temJuros ? 'text-zinc-500' : 'text-emerald-400'
                              }`}
                            >
                              {op.temJuros ? `total ${formatarBRL(op.total)}` : 'sem juros'}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        Até {PARCELAS_SEM_JUROS}x sem juros em qualquer valor. A partir de {PARCELAS_SEM_JUROS + 1}x,
                        juros de {(TAXA_MENSAL * 100).toFixed(2).replace('.', ',')}% ao mês.
                      </p>
                    </div>
                  </div>
                )}

                {metodoPagamento === 'pix' && (
                  <PixCopiaECola
                    sessaoId={sessao.id}
                    ingressos={[
                      { tipo: 'INTEIRA', quantidade: ingressos.inteira },
                      { tipo: 'MEIA', quantidade: ingressos.meia },
                      { tipo: 'ITAU_PROMO', quantidade: ingressos.itau_promo },
                    ].filter(ing => ing.quantidade > 0)}
                  />
                )}

                {/* Falha na confirmação precisa aparecer aqui — é onde o
                    usuário está quando o POST /api/reservas quebra. */}
                {erro && (
                  <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-px" />
                    <span>{erro}</span>
                  </div>
                )}

                <div className="flex justify-between gap-4 mt-8">
                  <button
                    onClick={() => setEtapa('ingressos')}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all duration-150 ease-out"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmarReserva}
                    disabled={processando}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all duration-150 ease-out flex items-center gap-2 disabled:opacity-50"
                  >
                    {processando && <Loader2 className="w-5 h-5 animate-spin" />}
                    {t('pay.confirm')}
                  </button>
                </div>
              </div>

              {/* Resumo lado */}
              <motion.div layout transition={appleSpring} className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-3xl p-6 h-fit sticky top-6">
                <h3 className="text-lg font-black mb-6 text-white">{t('pay.summary')}</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-zinc-400">Filme</p>
                    <p className="font-black text-white">{sessao.filme?.titulo ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Data e Hora</p>
                    <p className="font-black text-white">{sessao.data} às {sessao.horario}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Sala</p>
                    <p className="font-black text-white">Sala {sessao.sala?.numero ?? '—'} ({sessao.sala?.tipo ?? 'STD'})</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Assentos</p>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {(sessao.assentos ?? [])
                        .filter(a => assentosSelecionados.includes(a.id))
                        .map(a => (
                          <span key={a.id} className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-bold">
                            {a.fileira}{a.numero}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <motion.div layout className="border-t border-white/5 pt-4 space-y-2 mb-4">
                  <AnimatePresence>
                    {ingressos.inteira > 0 && (
                      <motion.div key="resumo-inteira" layout initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={appleSpring} className="flex justify-between text-sm overflow-hidden">
                        <span>Inteira ({ingressos.inteira})</span>
                        <span className="font-bold">R${(ingressos.inteira * (sessao.preco_ingresso?.inteira ?? 0)).toFixed(2)}</span>
                      </motion.div>
                    )}
                    {ingressos.meia > 0 && (
                      <motion.div key="resumo-meia" layout initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={appleSpring} className="flex justify-between text-sm overflow-hidden">
                        <span>Meia ({ingressos.meia})</span>
                        <span className="font-bold">R${(ingressos.meia * (sessao.preco_ingresso?.meia ?? 0)).toFixed(2)}</span>
                      </motion.div>
                    )}
                    {ingressos.itau_promo > 0 && (
                      <motion.div key="resumo-itau_promo" layout initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={appleSpring} className="flex justify-between text-sm overflow-hidden">
                        <span>Promoção Itaú ({ingressos.itau_promo})</span>
                        <span className="font-bold">R${(ingressos.itau_promo * (sessao.preco_ingresso?.itau_promo ?? 0)).toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div layout className="border-t border-white/5 pt-4 flex justify-between items-center">
                  <span className="font-black text-white">{t('pay.total')}</span>
                  <span className="text-2xl font-black text-orange-400">R${calcularTotal().toFixed(2)}</span>
                </motion.div>

                {/* Meia exige comprovação na portaria — avisa antes de pagar. */}
                <AnimatePresence>
                  {ingressos.meia > 0 && categoriaMeia && (
                    <motion.div
                      key="aviso-meia"
                      layout
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={appleSpring}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                          <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                            Meia-entrada · {encontrarCategoriaMeia(categoriaMeia)?.label}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed text-amber-100/80">
                          {ingressos.meia === 1
                            ? 'O portador do ingresso meia deverá apresentar '
                            : `Os portadores dos ${ingressos.meia} ingressos meia deverão apresentar `}
                          <span className="font-bold text-amber-200">
                            {encontrarCategoriaMeia(categoriaMeia)?.comprovante}
                          </span>{' '}
                          na entrada da sala. Sem a comprovação, será cobrada a diferença para o
                          valor da inteira.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Com juros, o total cobrado difere do total dos ingressos. */}
                {metodoPagamento === 'cartao' && (() => {
                  const op = calcularParcela(calcularTotal(), parcelas);
                  return (
                    <motion.div layout className="mt-3 text-right">
                      <p className="text-sm text-zinc-300">
                        {op.parcelas}x de <span className="font-black text-white">{formatarBRL(op.valorParcela)}</span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        {op.temJuros ? `com juros — total ${formatarBRL(op.total)}` : 'sem juros'}
                      </p>
                    </motion.div>
                  );
                })()}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ETAPA 4: SUCESSO */}
        {etapaSegura === 'sucesso' && (
          <motion.div
            key="etapa-sucesso" variants={applePage} initial="hidden" animate="visible" exit="exit"
            className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-3xl p-12 text-center origin-top"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-4xl font-black text-white mb-2">
              {confirmacao?.titulo ?? t('success.title')}
            </h2>
            <p className="text-zinc-400 mb-6">{mensagemSucesso}</p>

            {/* CONFIRMAÇÃO DO PAGAMENTO — texto vindo do servidor, visual por método */}
            {confirmacao && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className={`max-w-md mx-auto rounded-2xl border p-5 text-left ${
                  metodoPagamento === 'pix'
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5'
                    : 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-purple-500/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                      metodoPagamento === 'pix'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-orange-500/20 text-orange-300'
                    }`}
                  >
                    {metodoPagamento === 'pix' ? <QrCode className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          metodoPagamento === 'pix'
                            ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                            : 'text-orange-300 border-orange-500/40 bg-orange-500/10'
                        }`}
                      >
                        {confirmacao.selo}
                      </span>
                      {/* Bandeira e últimos 4 só existem aqui — nunca vão ao servidor. */}
                      {cartaoUsado && cartaoUsado.ultimos4.length === 4 && (
                        <span className="text-xs font-mono text-zinc-400">
                          {cartaoUsado.bandeira} •••• {cartaoUsado.ultimos4}
                        </span>
                      )}
                    </div>

                    <p className="font-black text-white">{confirmacao.resumo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{confirmacao.detalhe}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 my-8 text-left max-w-md mx-auto">
              <p className="text-sm text-zinc-400 mb-2">Seu Ingresso</p>
              <p className="text-2xl font-black text-white mb-4">{sessao.filme?.titulo ?? '—'}</p>
              <div className="space-y-2 text-sm">
                <p><span className="text-zinc-400">Data:</span> <span className="font-bold">{sessao.data} às {sessao.horario}</span></p>
                <p><span className="text-zinc-400">Sala:</span> <span className="font-bold">{sessao.sala?.numero ?? '—'}</span></p>
                <p><span className="text-zinc-400">Assentos:</span> <span className="font-bold">
                  {(sessao.assentos ?? [])
                    .filter(a => assentosSelecionados.includes(a.id))
                    .map(a => `${a.fileira}${a.numero}`)
                    .join(', ')}
                </span></p>
                <p><span className="text-zinc-400">Total:</span> <span className="font-black text-orange-400">R${calcularTotal().toFixed(2)}</span></p>
                {parcelamentoConfirmado && (
                  <p>
                    <span className="text-zinc-400">Pagamento:</span>{' '}
                    <span className="font-bold">
                      {parcelamentoConfirmado.parcelas}x de {formatarBRL(parcelamentoConfirmado.valor_parcela)}
                    </span>{' '}
                    <span className={parcelamentoConfirmado.tem_juros ? 'text-zinc-500' : 'text-emerald-400'}>
                      {parcelamentoConfirmado.tem_juros
                        ? `(com juros — total ${formatarBRL(parcelamentoConfirmado.valor_total_com_juros)})`
                        : '(sem juros)'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Reforça a comprovação da meia — é onde o cliente ainda está atento. */}
            {avisosMeia.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="max-w-md mx-auto mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left"
              >
                <p className="text-xs font-black uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Leve o comprovante da meia
                </p>
                {avisosMeia.map(aviso => (
                  <p key={aviso.categoria} className="text-xs leading-relaxed text-amber-100/80">
                    <span className="font-bold text-amber-200">
                      {encontrarCategoriaMeia(aviso.categoria as CategoriaMeia)?.label ?? aviso.categoria}:
                    </span>{' '}
                    {aviso.comprovante}.
                  </p>
                ))}
                <p className="mt-2 text-[0.7rem] text-amber-100/60">
                  Sem a comprovação na entrada, será cobrada a diferença para a inteira.
                </p>
              </motion.div>
            )}

            {/* Leva direto ao histórico, com esta reserva em destaque. */}
            <p className="text-sm text-zinc-400 mb-4">
              Seus ingressos já estão em <span className="font-bold text-white">Minhas Reservas</span>, com filme,
              sala, horário e cadeiras.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/', { state: { abrirReservas: true, reservaId: reservaNumero } })}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all duration-150 ease-out active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                Ver minha reserva
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 border border-white/20 hover:border-orange-500 rounded-xl font-bold transition-all duration-150 ease-out active:scale-[0.98]"
              >
                {t('success.home')}
              </button>
              <button
                onClick={() => toast(`Gerando PDF do ingresso de "${sessao.filme?.titulo ?? 'sessão'}" (mock — endpoint de download ainda não implementado)`)}
                className="px-8 py-3 border border-white/20 hover:border-orange-500 rounded-xl font-bold transition-all duration-150 ease-out active:scale-[0.98]"
              >
                {t('success.download')}
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
    </ErrorBoundary>
  );
}