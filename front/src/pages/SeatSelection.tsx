import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import api from '../services/api';
import { ChevronLeft, MapPin, Clock, Check, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { toast } from '../components/toast';
import { useLanguage } from '../contexts/languageContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Cards, { type Focused } from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

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
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix'>('cartao');
  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

  const [cardState, setCardState] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    focus: '' as Focused,
  });

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
    setIngressos(prev => ({
      ...prev,
      [tipo]: Math.max(0, valor)
    }));
  }

  const handleCardInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setCardState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setCardState((prev) => ({ ...prev, focus: evt.target.name as Focused }));
  };

  function calcularTotal() {
    const precos = sessao?.preco_ingresso;
    if (!precos) return 0;
    const totalInteira = ingressos.inteira * (precos.inteira ?? 0);
    const totalMeia = ingressos.meia * (precos.meia ?? 0);
    const totalItau = ingressos.itau_promo * (precos.itau_promo ?? 0);
    return totalInteira + totalMeia + totalItau;
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
    try {
      const response = await api.post('/api/reservas', {
        sessao_id: sessao.id,
        assentos: assentosSelecionados,
        pagamento: {
          metodo: metodoPagamento,
          ingressos: [
            { tipo: 'INTEIRA', quantidade: ingressos.inteira },
            { tipo: 'MEIA', quantidade: ingressos.meia },
            { tipo: 'ITAU_PROMO', quantidade: ingressos.itau_promo },
          ].filter(ing => ing.quantidade > 0)
        }
      });

      setMensagemSucesso(`Reserva confirmada! ID: ${response.data.reserva_id}`);
      setEtapa('sucesso');
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
      setErro(detail || 'Erro ao confirmar reserva');
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f13]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f13]">
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

  // Etapa segura para renderizar: nunca mostra ingressos/pagamento sem assentos.
  const requerAssentos = (e: Etapa) => e === 'ingressos' || e === 'pagamento';
  const etapaSegura: Etapa = requerAssentos(etapa) && assentosSelecionados.length === 0 ? 'assentos' : etapa;
  // Só permite navegar para uma etapa cujos pré-requisitos foram atendidos.
  const podeIr = (destino: Etapa) =>
    destino === 'assentos' || (destino !== 'sucesso' && assentosSelecionados.length > 0);

  return (
    <ErrorBoundary onReset={() => setEtapa('assentos')} resetLabel="Voltar para assentos">
    <div className="min-h-screen bg-[#0f0f13] text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-all"
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
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
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
                                  className={`relative flex items-center justify-center transition-colors ${isGrande ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-10 sm:h-10'} rounded-t-lg ${
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
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all"
                >
                  {t('seat.cancel')}
                </button>
                <button
                  onClick={handleAvancarParaIngressos}
                  disabled={assentosSelecionados.length === 0}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
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
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-white"
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
                        className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-500 flex items-center justify-center transition-colors font-bold text-white"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              {ingressos.inteira + ingressos.meia + ingressos.itau_promo !== assentosSelecionados.length && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-yellow-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Selecione {assentosSelecionados.length} ingresso(s) para {assentosSelecionados.length} assento(s)
                </div>
              )}

              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setEtapa('assentos')}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all"
                >
                  {t('tickets.back')}
                </button>
                <button
                  onClick={() => ingressos.inteira + ingressos.meia + ingressos.itau_promo === assentosSelecionados.length && setEtapa('pagamento')}
                  disabled={ingressos.inteira + ingressos.meia + ingressos.itau_promo !== assentosSelecionados.length}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${
                    ingressos.inteira + ingressos.meia + ingressos.itau_promo === assentosSelecionados.length
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
                      onClick={() => setMetodoPagamento(met.id)}
                      className={`w-full p-4 rounded-2xl border-2 transition-colors flex items-center gap-3 ${
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
                      <Cards
                        number={cardState.number}
                        expiry={cardState.expiry}
                        cvc={cardState.cvc}
                        name={cardState.name}
                      focused={cardState.focus || undefined}
                        placeholders={{ name: 'SEU NOME AQUI' }}
                        locale={{ valid: 'Validade' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-300">Número do Cartão</label>
                      <input
                        type="text"
                        name="number"
                        placeholder="Número do Cartão"
                        value={cardState.number}
                        onChange={handleCardInputChange}
                        onFocus={handleCardInputFocus}
                        maxLength={16}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-300">Nome no Cartão</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Nome Impresso no Cartão"
                        value={cardState.name}
                        onChange={handleCardInputChange}
                        onFocus={handleCardInputFocus}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-300">Validade</label>
                        <input
                          type="text"
                          name="expiry"
                          placeholder="MM/AA"
                          value={cardState.expiry}
                          onChange={handleCardInputChange}
                          onFocus={handleCardInputFocus}
                          maxLength={4}
                          className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-300">CVV</label>
                        <input
                          type="password"
                          name="cvc"
                          placeholder="***"
                          value={cardState.cvc}
                          onChange={handleCardInputChange}
                          onFocus={handleCardInputFocus}
                          maxLength={4}
                          className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {metodoPagamento === 'pix' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-zinc-800/50 border border-white/5 rounded-2xl p-6 text-center space-y-4 mb-4 overflow-hidden">
                    <p className="text-zinc-300 font-bold">Escaneie o QR Code para pagar via PIX</p>
                    <div className="w-40 h-40 bg-white mx-auto rounded-xl p-2 shadow-lg flex items-center justify-center">
                      <QrCode className="w-full h-full text-zinc-900" />
                    </div>
                    <p className="text-xs text-zinc-500">O pagamento será aprovado em instantes.</p>
                  </motion.div>
                )}

                <div className="flex justify-between gap-4 mt-8">
                  <button
                    onClick={() => setEtapa('ingressos')}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmarReserva}
                    disabled={processando}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
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

            <h2 className="text-4xl font-black text-white mb-2">{t('success.title')}</h2>
            <p className="text-zinc-400 mb-6">{mensagemSucesso}</p>

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
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all"
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