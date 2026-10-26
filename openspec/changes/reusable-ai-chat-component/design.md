# Design

## Context

O projeto é uma aplicação Next.js 16.4.2 com App Router, React/React DOM 19.3.0, TypeScript 5.9.3, Tailwind CSS 4.3.3 e npm 11.19.0; o Node instalado é 24.21.0. O chat atual usa aliases locais, componentes UI da aplicação, `motion/react`, `next-themes` e `next/image`; guarda conversas em `localStorage` e apresenta uma resposta simulada quando não recebe um callback. Não há fornecedor de IA configurado, executor de testes no `package.json`, licença na raiz nem remoto Git.

O Next.js exige Node.js 20.9 ou superior e TypeScript 5.1 ou superior; Node 24 é a linha LTS atual consultada. React 19.3 foi publicado como versão estável. A proposta usa as versões presentes no projeto como linha de integração e não as confunde com dependências do pacote.

## Goals / Non-Goals

**Goals:** fornecer um pacote React independente com um painel incorporável e uma opção flutuante; manter o serviço configurável pela aplicação; publicar testes, estilos, tipos, comandos e README dentro do pacote.

**Non-Goals:** implementar um fornecedor específico ou guardar credenciais; suportar frameworks que não sejam React; persistir automaticamente conversas entre sessões; implementar anexos, comandos, seleção de modelos/esforço ou streaming na primeira versão.

## Decisions

### Estrutura e fronteira do pacote

Criar `packages/ai-chat/` como raiz completa da distribuição:

```text
packages/ai-chat/
  src/
    index.ts
    chat-panel.tsx
    chat-widget.tsx
    message-list.tsx
    message-composer.tsx
    transport.ts
    types.ts
    styles.css
  tests/
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
  .gitignore
  LICENSE (apenas depois de escolhida a licença)
```

O painel não recebe nem redimensiona `children` da aplicação anfitriã. Os estilos pertencem ao pacote e usam propriedades CSS/tokens públicos. Componentes e ícones necessários ficam dentro do pacote; não importar `@/components/*`, `@/lib/*`, `next/image`, `next-themes`, Tailwind ou `motion` no runtime publicado. A compilação pode usar `tsc` e um pequeno script Node para copiar o CSS, evitando adicionar uma ferramenta de bundle apenas para isso.

O cabeçalho horizontal do chat deve consumir `--header-height`, o mesmo token usado pelo `SiteHeader`. Como a aplicação atual define esse token no `SidebarProvider`, a integração deve expô-lo também ao chat através de um ancestral comum ou de uma propriedade de altura equivalente. Se o consumidor não definir o token, o pacote usa um valor padrão de 3rem, igual ao padrão atual do anfitrião; o teste de integração compara as alturas calculadas.

### Interface do serviço de IA

Expor um contrato tipado para enviar o histórico da sessão e `AbortSignal`, recebendo uma mensagem do assistente. A interface consome esse contrato e não conhece fornecedores, chaves ou SDKs. Incluir um transporte HTTP genérico para um endpoint da aplicação anfitriã, com formato de resposta documentado; a aplicação implementa o endpoint no servidor e mantém nele as credenciais. Erros e cancelamento regressam à UI num formato normalizado. Não selecionar um fornecedor específico sem pedido explícito.

### Histórico e compatibilidade

Manter o histórico em memória durante a instância do chat e permitir que a aplicação controle/receba as mensagens através de props. Não ler ou escrever `localStorage` automaticamente; essa decisão reduz acoplamento e deixa persistência para um adaptador futuro. O alvo inicial é React 19.3; a integração de referência usa a versão local React 19.3.0 e Next.js 16.4.2, que permanece fora das dependências de produção do pacote.

### Versões observadas e propostas

| Tecnologia | Instalada/observada neste projeto | Proposta para a primeira versão | Uso |
|---|---:|---:|---|
| Node.js | 24.21.0 | 24.22.1 LTS; Next.js 16 aceita no mínimo 20.9.0, mas Node 20 está EOL | Construção e testes |
| npm | 11.19.0 | npm 11.x com lockfile | Instalação e distribuição |
| Next.js | 16.4.2 | Apenas aplicação anfitriã; não incluir no pacote | Exemplo/integração local |
| React / React DOM | 19.3.0 | `^19.3.0` como `peerDependencies` | Runtime fornecido pelo consumidor |
| TypeScript | 5.9.3 | 5.9.3 como dependência de desenvolvimento | Construção e declarações |
| Tailwind CSS | 4.3.3 | Não incluir; fornecer CSS próprio | Apenas aplicação anfitriã |
| Vitest | Não instalado | 5.0.5, versão estável publicada no registry e compatível com Node 24 | Testes |
| React Testing Library | Não instalado | 16.3.3, dependência de desenvolvimento | Testes de interação por papéis acessíveis |
| jsdom | Não instalado | 30.1.3, dependência de desenvolvimento | Ambiente DOM dos testes |

As versões atuais de React, Node e pacotes de teste foram verificadas nas respetivas páginas oficiais e no registry npm. As versões propostas não são apresentadas como já instaladas ou testadas neste projeto; o lockfile do pacote regista as versões resolvidas.

### Testes e documentação

Usar testes de componentes com React Testing Library para mensagens, Enter/Shift+Enter, carregamento, cancelamento, erro, personalização, ecrã estreito e semântica acessível; testar o transporte HTTP em isolamento com respostas válidas, erros e `AbortSignal`. Acrescentar uma verificação manual de teclado/leitor de ecrã e integração na aplicação anfitriã. Não foram executados testes nesta fase de planeamento.

O README do pacote será escrito em português e cobrirá objetivo, recursos entregues, compatibilidade/versionamento, requisitos, instalação local e pelo GitHub, importação, exemplos, props, CSS, transporte genérico, endpoint de servidor/variáveis de ambiente, segurança, erros, testes e limitações. Cada capacidade só será descrita como disponível após implementação e teste.

### Isolamento e publicação

O código de chat que pode ser extraído é a interface em `components/chat-ia/` e, após revisão de dependências/licenças, a lógica útil em `components/kokonutui/ai-prompt.tsx`. O resto de `components/kokonutui`, `components/ui`, `app/` (dashboard e layout), `hooks/`, `lib/`, `public/`, `components.json` e configurações Next/PostCSS pertence à aplicação anfitriã; não deve ser levado para o repositório do componente. Recriar ou simplificar apenas os elementos UI diretamente necessários, em vez de copiar dependências transitivas da aplicação.

Manter a aplicação atual no repositório de desenvolvimento e preparar o pacote completo em `packages/ai-chat/`. Para publicar apenas o componente, gerar um repositório GitHub separado a partir do prefixo do pacote (por exemplo, com `git subtree split`) ou exportar uma cópia limpa desse diretório. O remoto ainda não existe; confirmar nome, proprietário, visibilidade e licença antes de o criar. Não mover, apagar, commitar ou publicar ficheiros durante este plano. O pacote/repositório deve excluir `.env*`, `.npmrc` com tokens, chaves/API tokens, `*.pem`, `node_modules/`, `.next/`, `coverage/` e artefactos locais. Usar uma lista explícita de ficheiros do pacote e rever `npm pack --dry-run` antes de qualquer publicação.

Implementar em etapas pequenas, com revisão e testes antes de avançar para a etapa seguinte. Para cada lote futuro, apresentar o que mudou, motivo, ficheiros afetados, comportamento tratado, testes/resultados e uma mensagem de commit proposta; não criar commits automaticamente.

Fontes oficiais consultadas: [Next.js 16 e requisitos](https://nextjs.org/docs/app/guides/upgrading/version-16), [Node.js releases](https://nodejs.org/en/about/previous-releases), [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [Vitest releases](https://main.vitest.dev/releases), [React Testing Library 16.3.3](https://www.npmjs.com/package/%40testing-library/react) e [jsdom 30.1.3](https://www.npmjs.com/package/jsdom).

## Migration Plan

1. Criar o pacote sem remover nem mover a implementação existente; acrescentar primeiro o contrato de transporte e a UI independente, revendo o resultado antes de avançar.
2. Cobrir os comportamentos da especificação com testes e usar a aplicação Next.js atual apenas como anfitriã de validação, limitando qualquer integração ao chat; rever cada etapa antes de continuar.
3. Concluir README, construção, verificação do conteúdo do pacote e revisão de segredos/licenças.
4. Apresentar uma prévia visual executável no anfitrião e aguardar uma resposta explícita: **Aprovar** ou **Recusar**, com os ajustes pretendidos. Se recusada, corrigir a etapa correspondente e apresentar uma nova prévia; só encerrar a implementação após aprovação.
5. Depois da aprovação visual, decidir licença e destino GitHub; preparar e rever o repositório isolado. Rollback: remover a integração de demonstração e manter a implementação anterior intacta.

## Revisão da prévia

Abrir a aplicação anfitriã com o chat integrado e apresentar ao utilizador uma prévia do ecrã final no Codex/browser. A aprovação é recolhida nesta conversa: o utilizador pode responder **Aprovar** ou **Recusar** e descrever as alterações. A tarefa de revisão permanece pendente até uma dessas respostas; uma recusa devolve a implementação às tarefas necessárias e exige nova prévia.

## Risks / Trade-offs

- **Migração pode alterar o aspeto ou funcionalidades atuais** → usar o componente atual como referência e rever o resultado antes de substituir qualquer integração.
- **V1 não inclui fornecedor pronto nem persistência entre sessões** → documentar o endpoint genérico e a sessão em memória; aprovar separadamente qualquer fornecedor ou adaptador de armazenamento.
- **Alvo React 19 limita consumidores em React 18** → declarar a versão peer suportada com clareza e ampliar apenas após validação compatível.
- **Publicação requer direitos e destino definidos** → não escolher licença, criar repositório, commitar ou enviar alterações sem autorização explícita.
- **Alterações locais existentes podem contaminar uma publicação feita da raiz** → gerar/rever somente o conteúdo de `packages/ai-chat/` e verificar a lista de ficheiros antes da distribuição.
