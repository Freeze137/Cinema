// Conteúdo editorial do blog. Não há tabela de posts no backend: o blog é a
// apresentação do próprio projeto, então o texto vive junto do código que ele
// descreve — quando a regra muda, o post muda no mesmo commit.

export type PostCategoria = 'manifesto' | 'engenharia' | 'produto' | 'bastidores';

export interface PostBloco {
  tipo: 'paragrafo' | 'destaque' | 'lista' | 'codigo' | 'subtitulo';
  texto?: string;
  itens?: string[];
}

export interface Post {
  slug: string;
  titulo: string;
  subtitulo: string;
  /** Texto grande da capa. Explícito porque derivar do título gera recortes
   *  ruins ("Meia-entrada" virava "MEIA-ENTR"). */
  sigla: string;
  categoria: PostCategoria;
  data: string;
  leituraMin: number;
  destaque: boolean;
  // Par de cores do gradiente da capa 3D.
  capa: [string, string];
  corpo: PostBloco[];
}

export const CATEGORIAS: Record<PostCategoria, string> = {
  manifesto: 'Manifesto',
  engenharia: 'Engenharia',
  produto: 'Produto',
  bastidores: 'Bastidores',
};

export const POSTS: Post[] = [
  {
    slug: 'kinoplekis-reestruturacao-do-kinoplex',
    sigla: 'KINOPLEKIS',
    titulo: 'Kinoplekis: reconstruindo o Kinoplex do zero',
    subtitulo: 'Por que refazer uma rede de cinema inteira em vez de só trocar a cor dos botões.',
    categoria: 'manifesto',
    data: '2026-07-27',
    leituraMin: 4,
    destaque: true,
    capa: ['#F5C518', '#7c4b00'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'Este projeto é uma reestruturação do Kinoplex — a rede existe, o site existe, e a pergunta que deu origem a tudo isso foi simples: se fosse construído hoje, do primeiro modelo de dados até a última animação, o que mudaria?',
      },
      {
        tipo: 'destaque',
        texto:
          'O nome ainda não mudou porque a marca não é o ponto. O ponto é o que acontece entre escolher um filme e sentar na poltrona.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'A resposta virou o Kinoplekis: um sistema de reservas completo, com backend em FastAPI e SQLAlchemy, banco SQLite e uma interface em React 19 com Vite e Tailwind. Nada de mock: os assentos são reais, o preço é calculado por regra de negócio, e uma poltrona vendida some do mapa para todo mundo no mesmo instante.',
      },
      { tipo: 'subtitulo', texto: 'O que estava errado' },
      {
        tipo: 'lista',
        itens: [
          'Comprar ingresso exigia atenção demais: muitos passos, pouca confirmação do que estava acontecendo.',
          'O preço aparecia só no fim, depois de escolher tudo — o cliente descobria o valor quando já estava comprometido.',
          'A programação era uma lista, não um calendário: ninguém pensa em filme por linha de tabela, pensa por dia.',
          'A interface tratava desktop como padrão e o resto como exceção.',
        ],
      },
      { tipo: 'subtitulo', texto: 'O que este projeto faz diferente' },
      {
        tipo: 'lista',
        itens: [
          'Checkout de quatro etapas com estado explícito: assentos, ingressos, pagamento, confirmação. Você sempre sabe onde está.',
          'Preço calculado no servidor e exposto antes da decisão — a tabela de preços é pública e bate com o checkout, sempre.',
          'Calendário de verdade, com marcação nos dias que têm sessão.',
          'Meia-entrada por categoria, com o comprovante pedido na hora certa e não como letra miúda.',
        ],
      },
      {
        tipo: 'paragrafo',
        texto:
          'É um projeto de estudo, e isso é dito sem constrangimento: não há pagamento real, não há integração com adquirente, e o banco é um arquivo SQLite. O que existe de verdade é a modelagem, as regras e o cuidado com a experiência — que é justamente a parte que costuma ser tratada como detalhe.',
      },
    ],
  },
  {
    slug: 'filmes-que-trocam-a-cada-12-horas',
    sigla: '12 HORAS',
    titulo: 'Os filmes trocam a cada 12 horas. De propósito.',
    subtitulo: 'A regra de lotes que faz a home de manhã ser diferente da home da noite.',
    categoria: 'produto',
    data: '2026-07-20',
    leituraMin: 3,
    destaque: true,
    capa: ['#3b82f6', '#0b2447'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'Todo filme cadastrado pertence a um lote: 1 ou 2. O lote 1 aparece entre 00:00 e 11:59; o lote 2, das 12:00 às 23:59. O relógio do servidor decide — não há botão, não há preferência salva.',
      },
      {
        tipo: 'codigo',
        texto: 'def get_lote_filmes(hora_atual=None) -> int:\n    hora = (hora_atual or datetime.now()).hour\n    return 1 if hora < 12 else 2',
      },
      {
        tipo: 'paragrafo',
        texto:
          'A ideia é que a vitrine acompanhe o público. Quem abre o site de manhã não está procurando a mesma coisa que quem abre às onze da noite, e uma home que ignora isso mostra os mesmos vinte cartazes para os dois.',
      },
      {
        tipo: 'destaque',
        texto:
          'Quer ver o outro lote? Volte em outro horário. É a única forma — e essa rigidez é intencional.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'A exceção é a tabela de preços: ela mostra o catálogo inteiro, os dois lotes, agrupados por período de exibição. Uma tabela de preços que esconde metade dos filmes conforme a hora não serve como referência para ninguém.',
      },
    ],
  },
  {
    slug: 'como-o-preco-do-ingresso-e-calculado',
    sigla: 'PREÇO',
    titulo: 'Como o preço do seu ingresso é calculado',
    subtitulo: 'Duas multiplicações, nenhuma surpresa: da sala escolhida ao tipo de entrada.',
    categoria: 'produto',
    data: '2026-07-14',
    leituraMin: 4,
    destaque: false,
    capa: ['#22c55e', '#06371c'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'O preço nasce de um valor-base por sessão e passa por duas camadas. Primeiro o tipo de sala, depois o tipo de ingresso. Nessa ordem, sempre.',
      },
      { tipo: 'subtitulo', texto: 'Camada 1 — a sala' },
      {
        tipo: 'lista',
        itens: [
          'Standard: valor-base, multiplicador 1.0',
          'Kino Evolution: 20% acima, multiplicador 1.2',
          'Platinum: 50% acima, multiplicador 1.5',
        ],
      },
      { tipo: 'subtitulo', texto: 'Camada 2 — o ingresso' },
      {
        tipo: 'lista',
        itens: [
          'Inteira: o valor cheio da sala',
          'Meia: metade, mediante categoria e comprovante',
          'Promoção Itaú: 20% de desconto sobre a inteira',
        ],
      },
      {
        tipo: 'paragrafo',
        texto:
          'Com base de R$ 50,00, uma inteira na Platinum sai por R$ 75,00 e uma meia na Standard por R$ 25,00. Nenhum desses números fica salvo no banco: são recalculados a cada requisição, a partir da regra.',
      },
      {
        tipo: 'destaque',
        texto:
          'Preço guardado é preço que envelhece. Preço calculado é preço que nunca discorda de si mesmo.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'É por isso que a aba de preços consulta o mesmo endpoint que o checkout usa, em vez de repetir a conta no navegador. Se um multiplicador mudar amanhã, os dois mudam juntos — não existe versão da tabela que anuncia um valor enquanto o caixa cobra outro.',
      },
    ],
  },
  {
    slug: 'uma-poltrona-um-dono',
    sigla: 'POLTRONA',
    titulo: 'Uma poltrona, um dono',
    subtitulo: 'O que impede duas pessoas de comprarem a mesma cadeira no mesmo segundo.',
    categoria: 'engenharia',
    data: '2026-07-06',
    leituraMin: 5,
    destaque: true,
    capa: ['#a855f7', '#2e1065'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'Duas pessoas abrem a mesma sessão. As duas veem a poltrona F7 livre. As duas clicam em confirmar no mesmo instante. Esse é o problema mais interessante de um sistema de cinema, e quase todo tutorial resolve errado.',
      },
      { tipo: 'subtitulo', texto: 'A solução ingênua' },
      {
        tipo: 'paragrafo',
        texto:
          'Verificar se o assento está livre e, se estiver, gravar a reserva. Funciona em toda demo e falha em produção: entre a verificação e a gravação existe uma janela, e é exatamente nela que a segunda requisição entra.',
      },
      { tipo: 'subtitulo', texto: 'A solução daqui' },
      {
        tipo: 'paragrafo',
        texto:
          'A regra não vive no código, vive no banco. A tabela que liga reservas a assentos tem restrição de unicidade no assento: o mesmo lugar não pode aparecer duas vezes, aconteça o que acontecer.',
      },
      {
        tipo: 'codigo',
        texto: 'try:\n    db.commit()\nexcept IntegrityError:\n    db.rollback()\n    raise HTTPException(409, "Assento já reservado")',
      },
      {
        tipo: 'destaque',
        texto:
          'A segunda requisição não é rejeitada por educação do código. Ela é rejeitada pelo banco, que não tem como aceitar.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'Quem perdeu a corrida recebe 409 e uma mensagem clara, não um erro genérico. E há uma segunda trava no mesmo endpoint: a quantidade de ingressos precisa bater exatamente com a quantidade de assentos selecionados. Três poltronas exigem três ingressos — nem dois, nem quatro.',
      },
    ],
  },
  {
    slug: 'o-mapa-de-assentos',
    sigla: '8 × 12',
    titulo: 'Oito fileiras, doze poltronas, quatro cantos especiais',
    subtitulo: 'Como a sala é montada e por que o canto da primeira fila é diferente.',
    categoria: 'bastidores',
    data: '2026-06-28',
    leituraMin: 3,
    destaque: false,
    capa: ['#ef4444', '#450a0a'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'Toda sala nasce com o mesmo desenho: oito fileiras nomeadas de A a H, doze poltronas em cada uma. Noventa e seis lugares, gerados no momento em que a sessão é criada.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'As quatro poltronas de canto — extremos da primeira e da última fileira — são marcadas como GRANDE. As outras noventa e duas são NORMAL. É um detalhe pequeno no banco e uma diferença real na sala.',
      },
      {
        tipo: 'destaque',
        texto: 'A tela fica no topo do mapa. Fileira A é a mais próxima; H, a mais distante.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'Cada poltrona carrega um status: disponível, ocupada ou em manutenção. Manutenção existe porque cadeira quebrada é fato da vida em cinema, e fingir que não é só transfere o problema para o cliente que sentou.',
      },
    ],
  },
  {
    slug: 'meia-entrada-sem-letra-miuda',
    sigla: 'MEIA',
    titulo: 'Meia-entrada sem letra miúda',
    subtitulo: 'A categoria é escolhida antes do pagamento, não descoberta na porta da sala.',
    categoria: 'produto',
    data: '2026-06-16',
    leituraMin: 3,
    destaque: false,
    capa: ['#06b6d4', '#083344'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'Meia-entrada é direito, não favor — mas costuma ser tratada como exceção escondida no rodapé. Aqui ela é uma escolha explícita no fluxo: você seleciona a categoria e o sistema informa, na hora, qual comprovante será pedido na entrada.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'A conta é direta: metade do valor da sala escolhida. Meia na Platinum custa mais que inteira na Standard, e isso aparece na tela antes de qualquer confirmação.',
      },
      {
        tipo: 'destaque',
        texto: 'Nada de descobrir a regra na fila, com a sessão começando.',
      },
    ],
  },
  {
    slug: 'a-interface-precisa-parecer-instantanea',
    sigla: '16 MS',
    titulo: 'A interface precisa parecer instantânea',
    subtitulo: 'O que aprendemos removendo desfoques que ninguém via mas todo mundo sentia.',
    categoria: 'engenharia',
    data: '2026-06-02',
    leituraMin: 4,
    destaque: false,
    capa: ['#f97316', '#431407'],
    corpo: [
      {
        tipo: 'paragrafo',
        texto:
          'Os modais do site abriam com uma hesitação. Não era lentidão de rede: os dados já estavam ali. Era o navegador refazendo, quadro a quadro, o desfoque de tudo que estava atrás do overlay.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'Havia desfoque no fundo da tela inteira, outro no painel, outro em cada cartão da lista. Quatro camadas empilhadas. E o do painel era invisível — o fundo dele já era opaco. Custava caro e não aparecia.',
      },
      {
        tipo: 'destaque',
        texto:
          'Animação suave não é animação longa. É animação que o navegador consegue entregar em 16 milissegundos.',
      },
      {
        tipo: 'lista',
        itens: [
          'Desfoques aninhados removidos, mantendo o contraste com opacidade.',
          'Transições genéricas trocadas por propriedades específicas: só transform, só cor.',
          'Grade do calendário sem animação por célula — eram 42 ciclos recriados a cada clique.',
          'Curva ease-out curta: sai rápido, assenta suave.',
        ],
      },
      {
        tipo: 'paragrafo',
        texto:
          'O resultado não é uma interface com mais efeitos. É uma interface que responde no momento do toque — que é a única coisa que o usuário realmente percebe.',
      },
    ],
  },
];

export function getPost(slug: string | undefined): Post | undefined {
  return POSTS.find(p => p.slug === slug);
}
