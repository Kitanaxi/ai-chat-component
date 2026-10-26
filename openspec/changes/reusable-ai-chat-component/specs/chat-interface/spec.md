# Spec Delta

## Purpose

Disponibiliza uma interface de chat reutilizável que pode ser incorporada numa aplicação React sem depender do layout, dos componentes ou dos serviços da aplicação original.

## ADDED Requirements

### Requirement: Apresentação e histórico de mensagens
A interface SHALL apresentar mensagens do utilizador e do assistente por ordem cronológica e manter o histórico enquanto a instância do chat estiver ativa.

#### Scenario: Troca de mensagens
- **WHEN** o utilizador envia uma mensagem e o transporte devolve uma resposta
- **THEN** ambas as mensagens são apresentadas na conversa pela ordem em que ocorreram

#### Scenario: Mensagens longas
- **WHEN** uma mensagem contém várias linhas ou texto maior do que a largura do painel
- **THEN** as quebras de linha são preservadas e o texto ajusta-se ao painel sem provocar deslocamento horizontal

### Requirement: Composição e envio
A interface SHALL permitir escrever e enviar texto não vazio, incluindo a utilização por teclado, e SHALL impedir envios repetidos enquanto uma resposta está em curso.

#### Scenario: Envio por teclado
- **WHEN** o utilizador prime Enter com texto válido no campo de mensagem
- **THEN** a mensagem é enviada; Shift+Enter insere uma nova linha

#### Scenario: Envio indisponível
- **WHEN** o campo está vazio ou uma resposta está em curso
- **THEN** o controlo de envio está indisponível e não cria uma mensagem

### Requirement: Estado da resposta e erro visível
A interface SHALL indicar que uma resposta está em curso e apresentar uma mensagem compreensível quando o transporte falha, mantendo a conversa utilizável.

#### Scenario: Resposta em curso
- **WHEN** o transporte ainda não devolveu uma resposta
- **THEN** a interface apresenta um estado de carregamento acessível e permite interromper a operação quando suportado pelo transporte

#### Scenario: Falha do transporte
- **WHEN** o transporte devolve um erro
- **THEN** a interface informa o utilizador sem remover as mensagens já apresentadas e permite iniciar uma nova tentativa

### Requirement: Apresentação responsiva
A interface SHALL adaptar-se à largura disponível e manter os controlos essenciais acessíveis em ecrãs estreitos.

#### Scenario: Ecrã estreito
- **WHEN** o chat é apresentado numa janela estreita ou num dispositivo móvel
- **THEN** o painel e os controlos ajustam-se ao espaço disponível sem sobreposição ou corte de conteúdo essencial

### Requirement: Altura do cabeçalho alinhada com a aplicação
No modo horizontal, o cabeçalho do chat SHALL ter a mesma altura calculada que o `SiteHeader` da aplicação anfitriã, utilizando o token partilhado `--header-height`.

#### Scenario: Comparação dos cabeçalhos
- **WHEN** o chat e o `SiteHeader` são apresentados na mesma janela e o chat não está expandido
- **THEN** a altura visível dos dois cabeçalhos é igual

### Requirement: Incorporação sem controlar a página anfitriã
A biblioteca SHALL disponibilizar um painel incorporável e uma opção flutuante que não envolva nem redimensione o conteúdo da aplicação anfitriã.

#### Scenario: Painel flutuante
- **WHEN** a aplicação anfitriã escolhe a opção flutuante
- **THEN** o controlo de abrir/fechar mostra o chat sem exigir `children` nem alterar o layout da página

### Requirement: Acessibilidade e personalização visual
A interface SHALL expor controlos com nomes acessíveis, suportar interação por teclado e permitir personalizar texto e aspeto sem exigir um sistema de tema específico.

#### Scenario: Navegação por teclado
- **WHEN** o utilizador percorre o chat apenas com o teclado
- **THEN** os controlos interativos têm foco visível, nomes acessíveis e uma ordem de foco previsível

#### Scenario: Personalização
- **WHEN** a aplicação anfitriã fornece opções de título, texto de introdução, marcador de posição ou cores
- **THEN** o chat aplica essas opções sem depender de classes, aliases ou variáveis globais da aplicação anfitriã
