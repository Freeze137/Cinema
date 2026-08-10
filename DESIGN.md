---
name: Kinoplekis
description: Sistema visual de uma rede de cinema simulada por inteiro — escuro, alto contraste, amarelo de marquise.
colors:
  accent: "#F5C518"
  accent-tinta: "#0d0d12"
  fundo: "#0d0d12"
  fundo-profundo: "#0a0a0e"
  superficie: "#14141a"
  superficie-alta: "#1c1c24"
  tinta: "#eaeaea"
  tinta-suave: "#bdbdc4"
  tinta-fraca: "#9a9aa2"
typography:
  display:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 3.875rem)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  chip: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  card: "24px"
  full: "9999px"
spacing:
  gutter: "32px"
  secao: "72px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-tinta}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-tinta}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.full}"
    padding: "0"
    size: "38px"
  button-ghost-hover:
    textColor: "{colors.accent}"
  chip:
    backgroundColor: "{colors.superficie-alta}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.chip}"
    padding: "5px 10px"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.full}"
    padding: "10px 40px 10px 20px"
    typography: "{typography.body}"
  dialog:
    backgroundColor: "{colors.fundo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Kinoplekis

## 1. Overview

**Creative North Star: "A Marquise Acesa"**

Kinoplekis é a fachada de um multiplex de shopping vista à noite: o saguão está
escuro, e o que ilumina tudo é o amarelo da marquise. O sistema inteiro sai daí.
O fundo é quase preto e não pede atenção; o amarelo `#F5C518` carrega a marca
sozinho, sem cor secundária dividindo o palco. Não existe modo claro, e isso não
é omissão — cinema se vê no escuro.

A densidade é de rede grande, não de cinema de rua com curadoria. A grade de
cartazes é cheia, os horários aparecem todos, o preço fica visível antes do
clique. O peso tipográfico é alto por padrão — `font-bold` e `font-black`
respondem por mais de 180 usos contra 1 de `font-normal` —, o que dá a voz
enérgica que o produto quer e torna o texto em peso normal um evento raro,
reservado a corpo de leitura longa.

O que este sistema rejeita, na linguagem do `PRODUCT.md`: **template genérico de
cinema**, onde trocar a logo bastaria para virar outra rede; e **cara de projeto
de curso**, com card de sombra padrão, botão azul e estado de erro inexistente.
A defesa contra o primeiro é o tratamento — cor, peso e movimento autorais dentro
de uma estrutura que a pessoa reconhece. A defesa contra o segundo é acabamento:
foco visível, movimento reduzido respeitado, estado vazio escrito.

**Key Characteristics:**

- Escuro por definição, sem variante clara
- Um único acento, sem cor secundária
- Peso tipográfico alto como padrão, não como ênfase
- Densidade de rede grande: informação à mostra, não escondida atrás de clique
- Movimento presente e curto — 150ms, sempre desacelerando
- Estrutura de cinema convencional, tratamento autoral

## 2. Colors

Paleta de duas famílias apenas: uma rampa de quase-pretos que constrói
profundidade por camadas, e um amarelo que faz todo o trabalho de marca.

### Primary

- **Amarelo Marquise** (`#F5C518`): o acento único. Aparece em ação primária,
  preço, marcação de seleção, ícone ativo e no filete de destaque sob títulos de
  seção. É a única cor saturada do sistema — não existe azul de link, não existe
  verde de sucesso competindo por atenção.
- **Tinta sobre Marquise** (`#0d0d12`): o quase-preto usado como texto e ícone
  **em cima** do amarelo. Mesmo valor do fundo da página, papel oposto — por isso
  token próprio. Nunca use branco sobre o amarelo.

### Neutral

- **Preto de Sala** (`#0d0d12`): fundo padrão de toda página. O chão do sistema.
- **Preto de Fosso** (`#0a0a0e`): faixa de seção mais funda e término dos
  gradientes de cartaz. Separa blocos sem precisar de borda.
- **Grafite de Poltrona** (`#14141a`): superfície de card, modal e campo de
  entrada. O primeiro degrau acima do fundo.
- **Grafite Alto** (`#1c1c24`): chip, selo e superfície sobre superfície. O
  segundo e último degrau — não existe terceiro.
- **Tinta** (`#eaeaea`): texto corrido. Contraste 16.1:1 sobre o fundo.
- **Tinta Suave** (`#bdbdc4`): texto secundário, legenda, item de navegação em
  repouso. 10.4:1.
- **Tinta Fraca** (`#9a9aa2`): metadado, placeholder, rótulo desligado. 6.6:1 —
  o piso do sistema, e ainda acima do mínimo AA.

### Named Rules

**A Regra da Voz Única.** O amarelo é a única cor saturada do sistema.
Adicionar um segundo acento — verde de sucesso, vermelho de erro, azul de link —
é proibido; estado se comunica por peso, opacidade e ícone. Exceção fechada:
cores de marca de terceiros (bandeiras de cartão em `cartaoBandeiras.tsx`,
bandeiras de país em `Flags.tsx`) e as paletas de arte dos gradientes de cartaz.

**A Regra dos Dois Degraus.** Existem exatamente dois níveis acima do fundo:
`superficie` e `superficie-alta`. Precisar de um terceiro é sinal de hierarquia
mal resolvida, não de token faltando. Card dentro de card é sempre erro.

**A Regra do Hex Proibido.** Nenhum valor de cor neutro literal no `.tsx`. Todo
neutro vem de token do `front/src/index.css`, como classe (`bg-superficie`) ou
como variável (`var(--color-superficie)`) quando o valor entra em `style` inline.
Uma exceção documentada existe: o QR do PIX em `PixCopiaECola.tsx`, porque a lib
gera o PNG fora do DOM e não resolve `var()`.

## 3. Typography

**Display Font:** Poppins (com `system-ui`, `sans-serif`)
**Body Font:** Poppins — família única, em pesos extremos
**Label/Mono Font:** nenhuma; o sistema não usa monoespaçada

**Character:** Uma geométrica só, empurrada até as pontas da escala de peso. A
personalidade não vem de emparelhar duas famílias, vem do contraste entre 900 e
400 na mesma. Poppins tem o "o" perfeitamente circular que dá a leitura moderna e
de rede grande — e não a leitura editorial ou nostálgica que o projeto recusa.

### Hierarchy

- **Display** (800, `clamp(2.75rem, 6vw, 3.875rem)`, 1.06, `-0.02em`): só o
  título do herói. Um por página, nunca dois.
- **Headline** (900, 24px, 1.2): título de seção e cabeçalho de modal.
- **Title** (700, 16px, 1.4): nome de filme no card, rótulo de botão, item de
  navegação.
- **Body** (400, 14px, 1.65): sinopse, texto de blog, corpo de FAQ. Coluna
  limitada a `max-w-leitura` (760px), que fica em torno de 70ch nesse tamanho.
- **Label** (900, 10px, `0.1em`, caixa alta): selo, categoria, indicador de
  período. A caixa alta pertence a este papel e só a ele.

### Named Rules

**A Regra do Peso Extremo.** Contraste tipográfico se faz com 900 contra 400,
nunca com 600 contra 500. Peso intermediário em bloco é sintoma de hierarquia
indecisa. Corolário: `font-normal` é raro por desenho — aparece em texto de
leitura longa e em nada mais.

**A Regra do Piso de 10px.** Nenhum texto abaixo de 10px, em nenhum lugar.
Existem hoje seis usos de 9px em chips (`Home.tsx:758`, `769`, `1006`) — são
dívida conhecida, não precedente. No totem, o piso sobe para 14px: quiosque se lê
em pé, a um braço de distância.

**A Regra da Escala Fechada.** Os cinco papéis acima são a escala inteira. O
código hoje contém 22 tamanhos arbitrários diferentes (`text-[11.5px]`,
`text-[13.5px]`, `text-[12.5px]`…) — herança de handoff, em migração. Tela nova
usa os cinco papéis; introduzir um sexto tamanho exige justificar por que nenhum
dos cinco serve.

## 4. Elevation

Sistema **tonal em primeiro lugar, sombra em segundo**. A profundidade normal se
constrói empilhando `fundo` → `superficie` → `superficie-alta`, mais bordas de
1px em branco translúcido (`border-white/5` a `border-white/12`) que funcionam
como filete de luz em vez de traço. Sombra não separa camadas — sombra responde a
estado.

Duas famílias de sombra, e nenhuma terceira:

### Shadow Vocabulary

- **Elevação de cartaz** (`box-shadow: 0 30px 70px rgba(0,0,0,0.55)`): card de
  filme em destaque ou selecionado. É queda longa e muito difusa, imitando
  spot alto de saguão.
- **Elevação de painel** (`box-shadow: 0 22px 44px rgba(0,0,0,0.5)`): superfície
  flutuante de porte médio.
- **Brilho de marquise** (`box-shadow: 0 8px 20px rgba(245,197,24,0.45)`):
  exclusivo de ação primária em `:hover`. É o amarelo vazando para fora do botão.
  Nunca aplique em superfície neutra.

### Named Rules

**A Regra do Repouso Plano.** Superfície em repouso não tem sombra. Sombra é
resposta a estado — hover, seleção, sobreposição. Se um card nasce com sombra
sem interação, ele está imitando material de 2014.

**A Regra do Vidro Vetado.** `backdrop-filter` em área grande é proibido. Já foi
testado e removido dos modais: filtro em tela cheia re-rasteriza a página a cada
frame do fade, e com fundo a 98% de opacidade o efeito nem aparecia. Isolamento
visual se faz com opacidade, não com blur.

## 5. Components

### Buttons

- **Shape:** cantos suaves (`8px`) na ação retangular; círculo pleno
  (`9999px`) na ação só-ícone.
- **Primary:** fundo `accent`, texto `accent-tinta`, `10px 24px`, peso 700. É o
  único elemento que pode ocupar uma área sólida de amarelo.
- **Hover / Focus:** hover acende o brilho de marquise e reduz opacidade a 90%;
  `:active` comprime para `scale(0.95)`. O foco de teclado é global — anel de 2px
  em `accent` com `2px` de offset, definido em `index.css` sobre `:focus-visible`,
  nunca por componente.
- **Ghost:** círculo de 38px, borda `white/12`, ícone em `tinta-suave`. No hover,
  borda e ícone viram `accent`. É o botão de carrossel e de fechar.

### Chips

- **Style:** fundo `superficie-alta`, texto `tinta-suave`, raio `chip` (4px),
  `5px 10px`, tipografia de Label.
- **State:** selecionado inverte para fundo `accent` + texto `accent-tinta`.
  Não-selecionado nunca ganha borda colorida — a diferença é de preenchimento.

### Cards / Containers

- **Corner Style:** `16px` no card de filme, `24px` no diálogo.
- **Background:** `superficie` sobre `fundo`; `superficie-alta` só quando o card
  já está sobre `superficie`.
- **Shadow Strategy:** plano em repouso; elevação de cartaz quando destacado
  (ver Elevation).
- **Border:** 1px `white/5` a `white/12`. A borda é filete de luz, não contorno.
- **Internal Padding:** `16px` no card, `24px` no diálogo.

### Inputs / Fields

- **Style:** pílula (`9999px`), fundo `superficie`, borda `white/[0.06]`, texto
  `tinta`, placeholder `tinta-fraca`.
- **Focus:** anel global de `:focus-visible`. Sem glow próprio — glow amarelo
  pertence à ação primária.
- **Error / Disabled:** erro se marca por texto auxiliar e ícone, jamais por
  borda vermelha; ver A Regra da Voz Única.

### Navigation

- **Style:** barra fixa no topo, fundo `fundo/92` — token com opacidade, não hex
  translúcido —, `backdrop-blur` de 14px numa faixa fina (a única exceção
  tolerada à Regra do Vidro Vetado, porque a área é pequena), borda inferior
  `white/5`. Itens em Title, `tinta-suave` em repouso, `accent` no hover, com
  transição de 150ms.
- **Mobile:** o container colapsa dentro de `max-w-pagina px-gutter`; nenhuma
  página inventa largura própria.

### Diálogo (componente de assinatura)

O modal do Kinoplekis não é caixa cinza. Sobre o gradiente de fundo há três
camadas de assinatura: um filete horizontal de 1px que nasce transparente, passa
por `accent` a 50% e some (a marquise vista de perfil); um halo radial amarelo
saindo do canto superior esquerdo; e uma borda de `accent` a 18%. A entrada é
`scale 0.97→1` com `y 20→0` em 220ms `ease-out`. Fecha por X, clique no backdrop
ou `Escape`, e carrega `role="dialog"` com `aria-modal`.

## 6. Do's and Don'ts

### Do:

- **Do** tirar todo neutro de token: `bg-superficie`, `text-tinta-suave`,
  `max-w-pagina`, `px-gutter`, `rounded-chip`.
- **Do** usar `bg-fundo/92` quando precisar de translucidez — token com
  modificador de opacidade, que só existe porque a cor é token.
- **Do** manter a grade de cartazes. Ela é a cara de cinema e sustenta o
  realismo; a autoria entra no tratamento, nunca em demolir a estrutura.
- **Do** desacelerar sempre: `ease-out` em 150ms para estado, 220ms para
  entrada de camada. São os valores que o sistema já usa 78 e 61 vezes.
- **Do** dar nome acessível a todo elemento só-ícone, via chave `a11y.*` nos dois
  idiomas.
- **Do** tratar `prefers-reduced-motion` como parte do trabalho, não como extra:
  `MotionConfig reducedMotion="user"` cobre o framer-motion, o bloco `@media` do
  `index.css` cobre as transições CSS.
- **Do** manter contraste de corpo em 4.5:1 no mínimo. O par mais apertado do
  sistema é `tinta-fraca` sobre `superficie-alta`, a 6.06:1.

### Don't:

- **Don't** escrever hex neutro literal no `.tsx`. Regressão direta.
- **Don't** introduzir segundo acento. Sem verde de sucesso, sem vermelho de
  erro, sem azul de link.
- **Don't** parecer **template genérico de cinema** — se trocar a logo e ninguém
  notar a diferença, a tela falhou.
- **Don't** parecer **projeto de curso**: card com sombra padrão em repouso,
  botão azul, espaçamento largado, estado de erro ausente, dado de mentira
  óbvio.
- **Don't** copiar o Kinoplex real. É releitura, não reprodução — decidido para o
  totem e válido para o site inteiro.
- **Don't** cair em slop de IA: gradiente roxo sobre branco, todas as seções com a
  mesma forma, eyebrow em caixa alta acima de cada título, fonte de sistema.
- **Don't** usar `backdrop-filter` em área grande. Já custou frame nos modais e
  foi removido.
- **Don't** empilhar card dentro de card, nem inventar um terceiro degrau de
  superfície.
- **Don't** depender de hover para qualquer informação que o totem precise —
  quiosque é touch e não tem estado de hover.
- **Don't** deixar retângulo de gradiente onde deveria haver cartaz. Os
  `POSTER_GRADIENTS` de `Home.tsx` são dívida assumida, não padrão a replicar:
  num site de cinema, o cartaz é a imagem.
