# Product

## Register

brand

> **Regra dupla, deliberada.** O padrão é `brand`: a vitrine (`/`, `/blog`, `/sobre`) é
> julgada por impacto, autoria e memorabilidade. Mas `/sessao/:id`, `/login` e `/totem`
> são superfícies de **produto** e devem ser avaliadas por clareza de tarefa, densidade
> adequada e ausência de fricção. Ao trabalhar numa dessas rotas, use a régua de produto
> e leia `reference/product.md` em vez de `reference/brand.md`.

## Users

Três públicos, todos avaliando o autor através do produto — ninguém aqui vai realmente
comprar um ingresso:

- **Recrutador / tech lead.** Dá cerca de 90 segundos, julga acabamento e decide se
  chama. A primeira dobra precisa se explicar sozinha; polimento pesa mais que
  profundidade.
- **Outros desenvolvedores.** Clicam em tudo, abrem o DevTools, leem o código junto com
  a UI. Recompensam complexidade real exposta (rotação de lote a cada 12h, camadas de
  preço por tipo de sala, meia-entrada por categoria, assento em tempo real) e reparam
  em estado de erro, estado vazio e acessibilidade.
- **Cliente de freela.** Avalia se o autor entrega site que parece de verdade. Precisa
  sentir produto real, não demonstração.

O trabalho a ser feito por todos é o mesmo: **decidir se o autor sabe entregar produto
inteiro e acabado.**

## Product Purpose

Kinoplekis é uma simulação completa de rede de cinema — catálogo, sessões, mapa de
assentos, checkout com cartão/PIX/parcelamento, meia-entrada por categoria, blog,
institucional, e um totem de autoatendimento em `/totem`. Não é exercício nem maquete:
é peça de portfólio tratada como produto, com link ao vivo.

Sucesso é o visitante percorrer o fluxo inteiro sem esbarrar em ponta solta, e sair com
a impressão de ter usado um sistema real e não uma demonstração.

## Brand Personality

**Moderno, energético, completo.**

Rede grande de shopping, tecnológica — não cinema de rua com curadoria. Contraste alto,
o amarelo `#F5C518` usado com coragem em vez de parcimônia, movimento presente,
densidade de informação maior que a do minimalismo padrão. Impacto acima de sutileza.

Tom do texto: direto e confiante, em pt-BR. Sem jargão de marketing, sem exclamação.
Fala como cinema fala com quem já sabe o que quer assistir.

## Anti-references

- **Template genérico de cinema.** Layout que serve pra qualquer rede — troca a logo e
  ninguém nota. A estrutura pode ser convencional (ver Princípio 1); o tratamento, nunca.
- **Cara de projeto de curso.** Card com sombra padrão, botão azul, espaçamento largado,
  dado de mentira óbvio, estado de erro inexistente. Esse é o inimigo principal: o
  projeto é sobre provar o contrário disso.
- **Cópia do Kinoplex real.** Já decidido para o totem; vale para o site inteiro. É
  releitura, não reprodução.
- **Slop de IA.** Gradiente roxo sobre branco, seções todas com a mesma forma, eyebrow
  em maiúscula acima de cada título, fontes de sistema.

## Design Principles

1. **Estrutura reconhecível, tratamento autoral.** A grade de cards de filme fica — é a
   cara de cinema e sustenta o realismo, que é a espinha do projeto. A autoria entra na
   tipografia, na cor, no movimento e no detalhe, dentro da forma que a pessoa já
   reconhece. Nunca destrua a convenção estrutural em nome de originalidade.

2. **Domínio técnico se prova por escopo, não por ornamento.** O que impressiona é o
   fluxo funcionar inteiro — rotação de lote, camadas de preço, categorias de meia,
   assento sem dupla marcação, PIX, parcelamento, totem. Nada de tela bonita apoiada em
   dado falso.

3. **Vocabulário antes de pixel.** Toda cor, largura de container e raio vem de token
   declarado em `front/src/index.css`. Hex solto e medida arbitrária são regressão. Só
   duas exceções: cor de marca de terceiro (bandeiras de cartão e de país) e paleta de
   arte dos gradientes de pôster.

4. **Um sistema, dois modos de entrega.** Site e totem compartilham tokens, regras de
   preço e disponibilidade de assento, mas não compartilham telas. O totem é quiosque
   touch: nada de hover como única affordance, nada de cartão 3D, nada de PIX
   copia-e-cola. Lógica comum, apresentação separada.

5. **Acabamento é o argumento.** O projeto existe para provar que o autor termina o que
   começa. Estado de erro, estado vazio, estado de carregamento e comportamento
   responsivo não são extras — são a tese.

## Accessibility & Inclusion

Alvo **WCAG 2.2 AA**. Assumido, não levantado com o usuário — revisar se houver
requisito específico.

- Texto corrido ≥ 4.5:1 contra o fundo; texto grande ≥ 3:1. Atenção especial ao
  `--color-tinta-fraca` sobre `--color-superficie`, e a qualquer texto sobre o amarelo.
- A personalidade pede movimento presente, o que torna `prefers-reduced-motion`
  obrigatório, não opcional. Toda animação precisa de alternativa.
- O totem é touch e usado em pé, em saguão iluminado: alvos generosos, sem dependência
  de hover, contraste calculado para ambiente claro.
- Interface em pt-BR com seletor de idioma já presente no site.
