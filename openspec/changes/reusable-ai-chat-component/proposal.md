# Proposal

## Why

O repositório já contém uma interface de chat em `components/chat-ia/chat-ia.tsx`, mas esta depende de componentes, aliases, tema e estilos da aplicação Next.js. Sem um serviço de IA configurado, o fluxo atual usa uma resposta de demonstração. Extrair o chat para uma biblioteca independente permite reutilizar a interface e ligar fornecedores diferentes sem levar a aplicação original junto.

## What Changes

- Criar uma biblioteca React isolada, com painel de chat incorporável e uma opção de apresentação flutuante, sem controlar o conteúdo ou o layout da aplicação anfitriã.
- Implementar mensagens do utilizador e da IA, composição de texto, estado de resposta, erros, histórico durante a sessão, apresentação responsiva, acessibilidade e personalização visual.
- Alinhar a altura do cabeçalho horizontal do chat com o `SiteHeader`, usando o mesmo valor calculado de `--header-height`.
- Definir uma interface de transporte independente do fornecedor. A biblioteca não incluirá chaves, SDKs nem chamadas diretas a um fornecedor; a aplicação anfitriã poderá ligar um endpoint próprio.
- Incluir testes automatizados, comandos de construção e um README completo em português, coerente com as funcionalidades efetivamente implementadas e verificadas.
- Apresentar uma prévia visual do resultado final e aguardar a aprovação ou recusa do utilizador antes de encerrar a etapa de implementação.
- Manter todos os ficheiros existentes da aplicação. Preparar a distribuição sob `packages/ai-chat`, com uma estratégia para gerar um repositório GitHub que contenha apenas esse pacote, sem criar repositórios, commits ou pushes nesta fase.
- Deixar para versões futuras a persistência entre sessões, anexos, comandos, seletor de modelos/esforço, respostas em streaming e adaptadores específicos de fornecedores.

## Capabilities

### New Capabilities

- `chat-interface`: Interface de chat reutilizável, acessível, responsiva e personalizável.
- `ai-provider-integration`: Contrato para ligar, substituir e testar o transporte de mensagens para serviços de IA.

### Modified Capabilities

Nenhuma. O inventário atual de especificações OpenSpec está vazio.

## Impact

- Será criada uma área isolada em `packages/ai-chat/`, com fontes, estilos, definições de tipos, testes, configuração de pacote e documentação.
- A implementação atual e os seus componentes auxiliares servirão de referência; não serão movidos nem apagados. A integração na aplicação existente limitar-se-á ao necessário para validar o pacote.
- O projeto usa Next.js 16.4.2, React/React DOM 19.3.0 e TypeScript 5.9.3. O pacote terá como alvo React 19 e não dependerá de Next.js.
- Não existe remoto Git configurado. O estado atual contém alterações locais e ficheiros não acompanhados; a distribuição deverá selecionar apenas `packages/ai-chat/` e exigir autorização antes de operações externas.
