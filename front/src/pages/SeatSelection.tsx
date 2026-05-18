import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { ChevronLeft, MapPin, Clock, DollarSign, Users, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState<Etapa>('assentos');

  const [assentosSelecionados, setAssentosSelecionados] = useState<number[]>([]);
  const [ingressos, setIngressos] = useState({
    inteira: 0,
    meia: 0,
    itau_promo: 0,
  });
  const [metodoPagamento, setMetodoPagamento] = useState('cartao');
  const [processando, setProcessando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erro, setErro] = useState('');

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

  function handleIngressoChange(tipo: 'inteira' | 'meia' | 'itau_promo', valor: number) {
    setIngressos(prev => ({
      ...prev,
      [tipo]: Math.max(0, valor)
    }));
  }

  function calcularTotal() {
    if (!sessao) return 0;
    const totalInteira = ingressos.inteira * sessao.preco_ingresso.inteira;
    const totalMeia = ingressos.meia * sessao.preco_ingresso.meia;
    const totalItau = ingressos.itau_promo * sessao.preco_ingresso.itau_promo;
    return totalInteira + totalMeia + totalItau;
  }

  async function handleConfirmarReserva() {
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
    } catch (error: any) {
      setErro(error.response?.data?.detail || 'Erro ao confirmar reserva');
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

  return (
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
            <h1 className="text-3xl font-black text-white">{sessao.filme.titulo}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Sala {sessao.sala.numero} ({sessao.sala.tipo})
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
                onClick={() => e !== 'sucesso' && setEtapa(e)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  (['assentos', 'ingressos', 'pagamento', 'sucesso'].indexOf(etapa) >= idx)
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

        {/* ETAPA 1: ASSENTOS */}
        {etapa === 'assentos' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 mb-8">
              <h2 className="text-2xl font-black mb-6 text-white">Escolha seus Assentos</h2>

              <div className="flex justify-center mb-8">
                <div className="w-full max-w-2xl">
                  {/* Tela do cinema */}
                  <div className="text-center mb-8">
                    <div className="inline-block px-8 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full text-white font-black text-sm mb-4">
                      TELA DO CINEMA
                    </div>
                  </div>

                  {/* Mapa de assentos */}
                  <div className="grid gap-2 max-w-2xl mx-auto">
                    {Array.from({ length: 8 }).map((_, filIdx) => {
                      const fileira = String.fromCharCode(65 + filIdx);
                      const assentosFileira = sessao.assentos.filter(a => a.fileira === fileira);

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
                                  whileHover={!isOcupado ? { scale: 1.05 } : {}}
                                  onClick={() => !isOcupado && toggleAssento(assento.id)}
                                  className={`relative transition-all ${isGrande ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg font-bold text-xs flex items-center justify-center ${
                                    isOcupado
                                      ? 'bg-zinc-700 cursor-not-allowed'
                                      : isSelected
                                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                >
                                  {isOcupado ? '✕' : isSelected ? '✓' : ''}
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
                      <div className="w-6 h-6 bg-emerald-600 rounded-lg" />
                      <span className="text-sm text-zinc-400">Disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-lg" />
                      <span className="text-sm text-zinc-400">Selecionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-700 rounded-lg" />
                      <span className="text-sm text-zinc-400">Ocupado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info assentos selecionados */}
              {assentosSelecionados.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6">
                  <p className="text-orange-400 font-bold">
                    Assentos selecionados ({assentosSelecionados.length}):
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {sessao.assentos
                      .filter(a => assentosSelecionados.includes(a.id))
                      .map(a => (
                        <span key={a.id} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-lg text-sm font-bold">
                          {a.fileira}{a.numero}
                        </span>
                      ))}
                  </div>
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
                  Cancelar
                </button>
                <button
                  onClick={() => assentosSelecionados.length > 0 && setEtapa('ingressos')}
                  disabled={assentosSelecionados.length === 0}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    assentosSelecionados.length > 0
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Próximo
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ETAPA 2: INGRESSOS */}
        {etapa === 'ingressos' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 mb-8">
              <h2 className="text-2xl font-black mb-6 text-white">Selecione os Ingressos</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { tipo: 'inteira', label: 'Inteira', preco: sessao.preco_ingresso.inteira },
                  { tipo: 'meia', label: 'Meia', preco: sessao.preco_ingresso.meia },
                  { tipo: 'itau_promo', label: 'Promoção Itaú', preco: sessao.preco_ingresso.itau_promo },
                ].map(ing => (
                  <div
                    key={ing.tipo}
                    className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 rounded-2xl p-6"
                  >
                    <p className="text-sm text-zinc-400 mb-2">{ing.label}</p>
                    <p className="text-2xl font-black text-orange-400 mb-4">R${ing.preco.toFixed(2)}</p>

                    <div className="flex items-center gap-3 bg-zinc-950 rounded-xl p-2">
                      <button
                        onClick={() =>
                          handleIngressoChange(ing.tipo as 'inteira' | 'meia' | 'itau_promo', ingressos[ing.tipo as 'inteira' | 'meia' | 'itau_promo'] - 1)
                        }
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-black text-lg">
                        {ingressos[ing.tipo as 'inteira' | 'meia' | 'itau_promo']}
                      </span>
                      <button
                        onClick={() =>
                          handleIngressoChange(
                            ing.tipo as 'inteira' | 'meia' | 'itau_promo',
                            ingressos[ing.tipo as 'inteira' | 'meia' | 'itau_promo'] + 1
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-500 flex items-center justify-center transition-all font-bold"
                      >
                        +
                      </button>
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
                  Voltar
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
                  Prosseguir para Pagamento
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ETAPA 3: PAGAMENTO */}
        {etapa === 'pagamento' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Resumo */}
              <div className="md:col-span-2 bg-zinc-900 border border-white/5 rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-6 text-white">Método de Pagamento</h2>

                <div className="space-y-4 mb-8">
                  {[
                    { id: 'cartao', label: 'Cartão de Crédito', icon: '💳' },
                    { id: 'pix', label: 'PIX', icon: '📱' },
                  ].map(met => (
                    <motion.button
                      key={met.id}
                      onClick={() => setMetodoPagamento(met.id)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-300">Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={16}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-300">Validade</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-300">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={3}
                          className="w-full px-4 py-3 bg-zinc-800 border border-white/5 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
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
                    Confirmar Pagamento
                  </button>
                </div>
              </div>

              {/* Resumo lado */}
              <div className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-3xl p-6 h-fit sticky top-6">
                <h3 className="text-lg font-black mb-6 text-white">Resumo da Reserva</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-zinc-400">Filme</p>
                    <p className="font-black text-white">{sessao.filme.titulo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Data e Hora</p>
                    <p className="font-black text-white">{sessao.data} às {sessao.horario}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Sala</p>
                    <p className="font-black text-white">Sala {sessao.sala.numero} ({sessao.sala.tipo})</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Assentos</p>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {sessao.assentos
                        .filter(a => assentosSelecionados.includes(a.id))
                        .map(a => (
                          <span key={a.id} className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-bold">
                            {a.fileira}{a.numero}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2 mb-4">
                  {ingressos.inteira > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Inteira ({ingressos.inteira})</span>
                      <span className="font-bold">R${(ingressos.inteira * sessao.preco_ingresso.inteira).toFixed(2)}</span>
                    </div>
                  )}
                  {ingressos.meia > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Meia ({ingressos.meia})</span>
                      <span className="font-bold">R${(ingressos.meia * sessao.preco_ingresso.meia).toFixed(2)}</span>
                    </div>
                  )}
                  {ingressos.itau_promo > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Promoção Itaú ({ingressos.itau_promo})</span>
                      <span className="font-bold">R${(ingressos.itau_promo * sessao.preco_ingresso.itau_promo).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                  <span className="font-black text-white">Total</span>
                  <span className="text-2xl font-black text-orange-400">R${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ETAPA 4: SUCESSO */}
        {etapa === 'sucesso' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-3xl p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-4xl font-black text-white mb-2">Reserva Confirmada!</h2>
            <p className="text-zinc-400 mb-6">{mensagemSucesso}</p>

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 my-8 text-left max-w-md mx-auto">
              <p className="text-sm text-zinc-400 mb-2">Seu Ingresso</p>
              <p className="text-2xl font-black text-white mb-4">{sessao.filme.titulo}</p>
              <div className="space-y-2 text-sm">
                <p><span className="text-zinc-400">Data:</span> <span className="font-bold">{sessao.data} às {sessao.horario}</span></p>
                <p><span className="text-zinc-400">Sala:</span> <span className="font-bold">{sessao.sala.numero}</span></p>
                <p><span className="text-zinc-400">Assentos:</span> <span className="font-bold">
                  {sessao.assentos
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
                Voltar para Home
              </button>
              <button
                onClick={() => {}}
                className="px-8 py-3 border border-white/20 hover:border-orange-500 rounded-xl font-bold transition-all"
              >
                Baixar Ingresso
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}