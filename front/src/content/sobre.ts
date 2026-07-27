/**
 * Conteúdo institucional.
 *
 * O Kinoplekis é a marca deste projeto — uma reestruturação de estudo. A
 * história abaixo é a da marca e do projeto, e não afirma fatos sobre a rede
 * Kinoplex, que existe de verdade e não tem relação com este código.
 */

export interface MarcoHistoria {
  ano: string;
  titulo: string;
  texto: string;
}

export interface Valor {
  titulo: string;
  texto: string;
}

export interface Pergunta {
  pergunta: string;
  resposta: string;
}

export const HISTORIA: MarcoHistoria[] = [
  {
    ano: 'O começo',
    titulo: 'Uma fila que não andava',
    texto:
      'A ideia nasceu de uma cena banal: uma fila de bilheteria parada porque o sistema não conseguia dizer se a poltrona F7 estava livre. Todo mundo esperando uma resposta que um banco de dados deveria dar em milissegundos.',
  },
  {
    ano: 'A decisão',
    titulo: 'Refazer, não remendar',
    texto:
      'A escolha foi reconstruir do modelo de dados para cima, em vez de trocar a cor dos botões. Salas, sessões, assentos, reservas e pagamentos foram modelados do zero, cada um com suas regras explícitas.',
  },
  {
    ano: 'A fundação',
    titulo: 'O banco como guardião',
    texto:
      'A primeira regra escrita foi a mais importante: uma poltrona não pode ter dois donos. Isso virou restrição de unicidade no banco, não uma checagem no código — porque código pode ser contornado por uma corrida entre dois cliques simultâneos.',
  },
  {
    ano: 'A vitrine',
    titulo: 'O catálogo que acompanha o dia',
    texto:
      'Veio então a rotação de 12 horas: o cartaz da manhã não é o cartaz da noite. Uma vitrine que ignora a hora do dia mostra os mesmos cartazes para quem acorda cedo e para quem chega da meia-noite.',
  },
  {
    ano: 'O preço',
    titulo: 'Transparência antes da decisão',
    texto:
      'A tabela de preços virou pública e passou a consumir exatamente o mesmo cálculo do checkout. Não existe versão do preço que aparece na vitrine e outra que aparece no caixa.',
  },
  {
    ano: 'Hoje',
    titulo: 'Uma sala de cada vez',
    texto:
      'Quatro salas, três experiências, noventa e seis poltronas em cada uma. O sistema inteiro existe para resolver um único momento bem: o instante entre escolher o filme e sentar na cadeira.',
  },
];

export const VALORES: Valor[] = [
  {
    titulo: 'O preço é dito antes',
    texto:
      'Valor cheio, meia e promoção aparecem antes de qualquer confirmação. Ninguém descobre quanto custa depois de já ter escolhido tudo.',
  },
  {
    titulo: 'A poltrona é sua no instante do clique',
    texto:
      'Sem reserva provisória que expira em silêncio. Confirmou, é sua — e some do mapa de todo mundo no mesmo momento.',
  },
  {
    titulo: 'Meia-entrada não é exceção',
    texto:
      'É uma opção de primeira classe no fluxo, com a categoria escolhida na hora e o comprovante informado antes, não na porta da sala.',
  },
  {
    titulo: 'A interface responde na hora',
    texto:
      'Animação existe para explicar o que aconteceu, não para enfeitar. Se atrasa o toque, é peso — e peso a gente corta.',
  },
];

export const FAQ: Pergunta[] = [
  {
    pergunta: 'Por que os filmes mudam durante o dia?',
    resposta:
      'O catálogo é dividido em dois lotes. O primeiro fica em cartaz das 00:00 às 11:59 e o segundo das 12:00 às 23:59, seguindo o relógio do servidor. A tabela de preços é a única tela que mostra os dois lotes ao mesmo tempo, porque ali a função é servir de referência.',
  },
  {
    pergunta: 'Como o preço do ingresso é formado?',
    resposta:
      'Em duas camadas. Primeiro o tipo de sala multiplica o valor-base: Standard mantém, Kino Evolution soma 20% e Platinum soma 50%. Depois entra o tipo de entrada: inteira integral, meia pela metade e promoção Itaú com 20% de desconto. Com base de R$ 50,00, uma inteira na Platinum fica em R$ 75,00.',
  },
  {
    pergunta: 'Qual a diferença entre as salas?',
    resposta:
      'Standard é a sala tradicional. Kino Evolution traz projeção e som aprimorados. Platinum é a mais reservada, com menos poltronas e mais espaço entre elas. Todas seguem o mesmo mapa de oito fileiras, de A a H, com doze lugares por fileira.',
  },
  {
    pergunta: 'Posso comprar assentos separados na mesma compra?',
    resposta:
      'Pode. A única exigência é que a quantidade de ingressos seja exatamente igual à quantidade de poltronas escolhidas: três lugares pedem três ingressos, em qualquer combinação de inteira, meia e promoção.',
  },
  {
    pergunta: 'E se alguém escolher a mesma poltrona ao mesmo tempo que eu?',
    resposta:
      'Quem confirmar primeiro fica com o lugar. O segundo recebe um aviso claro de que a poltrona acabou de ser ocupada e volta para o mapa atualizado. A garantia é do banco de dados, que simplesmente não aceita o mesmo assento duas vezes.',
  },
  {
    pergunta: 'Preciso de conta para reservar?',
    resposta:
      'Sim. A reserva fica vinculada ao seu cadastro para que você consiga consultá-la depois em Minhas Reservas, com filme, sala, poltronas e o comprovante de pagamento.',
  },
  {
    pergunta: 'Quais formas de pagamento existem?',
    resposta:
      'Cartão de crédito, com opção de parcelamento, e PIX com código copia e cola. Este é um projeto de estudo: nenhuma cobrança real é feita e nenhum dado de cartão é enviado para adquirente.',
  },
  {
    pergunta: 'O que é o Kinoplekis, afinal?',
    resposta:
      'Uma reestruturação completa de um sistema de cinema, criada como projeto de estudo: backend em FastAPI com SQLAlchemy, banco SQLite e interface em React com Vite e Tailwind. O blog conta em detalhe cada decisão técnica por trás dele.',
  },
];

export const CONTATO = {
  email: 'contato@kinoplekis.com.br',
  telefone: '+55 (11) 4000-0000',
  endereco: 'Av. das Sessões, 1200 — São Paulo, SP',
  horario: 'Bilheteria aberta das 13h às 23h, todos os dias',
};
