# Tasks

## 1. Base isolada do pacote

- [x] 1.1 Criar `packages/ai-chat/` com manifesto, exports, tipos públicos, CSS próprio, configuração TypeScript e script de build; verificar `npm run build` e a instalação local sem importar aliases da aplicação.
- [x] 1.2 Configurar Vitest, React Testing Library e jsdom como dependências de desenvolvimento e adicionar um teste de montagem/acessibilidade básica; verificar `npm test` e as versões de Node/React declaradas.

## 2. Interface e comportamento do chat

- [x] 2.1 Implementar painel incorporável, opção flutuante, lista cronológica de mensagens, texto longo, layout responsivo e tokens de personalização; criar testes para mensagens, quebras de linha, largura e tema e verificar `npm test`.
- [x] 2.2 Implementar campo e botão de envio, Enter/Shift+Enter, carregamento, cancelamento, erro recuperável e histórico em memória; criar testes para cada estado e verificar `npm test`.
- [x] 2.3 Rever nomes acessíveis, foco, leitura de novas mensagens e preferência por movimento reduzido; testar teclado e critérios automáticos de acessibilidade e documentar as opções no README em português.
- [x] 2.4 Alinhar a altura do cabeçalho horizontal com `SiteHeader` através do token partilhado `--header-height`; verificar por teste de integração que ambos têm a mesma altura calculada.

## 3. Integração independente de fornecedor

- [x] 3.1 Definir e exportar o contrato de transporte com histórico e `AbortSignal`, mais o adaptador HTTP genérico para endpoint da aplicação; testar resposta, erro e cancelamento com transporte simulado e verificar `npm test`.
- [x] 3.2 Documentar no README a integração de servidor, variáveis de ambiente, tratamento de erros e proteção de credenciais; verificar os exemplos com o adaptador e confirmar que nenhum segredo é necessário no bundle do navegador.

## 4. Compatibilidade, documentação e preparação de publicação

- [ ] 4.1 Integrar o pacote na aplicação Next.js existente com alterações apenas no ponto de integração do chat; verificar build e typecheck do anfitrião e confirmar que dashboard e outros componentes não foram refatorados.
- [ ] 4.2 Completar README com instalação, importação, props, exemplos, testes, limitações e segurança; executar os comandos documentados e confirmar que a documentação corresponde apenas a capacidades implementadas e testadas.
- [ ] 4.3 Definir allowlist do pacote e rever dependências, licenças, segredos e artefactos; validar `npm pack --dry-run` e confirmar que o pacote não contém `app/`, credenciais, `.env*`, `.npmrc` sensível, `.next/` ou `node_modules/`.
- [ ] 4.4 Abrir e apresentar uma prévia visual do chat integrado; aguardar **Aprovar** ou **Recusar** do utilizador, aplicar os ajustes solicitados e repetir a prévia até aprovação explícita.
- [ ] 4.5 Preparar, sem criar remoto nem enviar alterações, uma exportação isolada de `packages/ai-chat/` e apresentar nome de repositório, visibilidade e licença para aprovação; verificar que o conteúdo exportado contém apenas o pacote e os ficheiros de distribuição necessários.
