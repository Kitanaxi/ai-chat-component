# Spec Delta

## Purpose

Define uma fronteira estável entre a interface de chat e o serviço de IA para que uma aplicação possa usar ou substituir o transporte sem alterar a apresentação.

## ADDED Requirements

### Requirement: Contrato de transporte independente
A biblioteca SHALL aceitar um transporte configurado pela aplicação anfitriã, que recebe o histórico da conversa e um sinal de cancelamento e devolve uma resposta do assistente.

#### Scenario: Transporte configurado
- **WHEN** o utilizador envia uma mensagem e a aplicação fornece um transporte
- **THEN** o transporte recebe as mensagens da sessão e a resposta devolvida é apresentada como mensagem do assistente

#### Scenario: Operação interrompida
- **WHEN** o utilizador interrompe uma resposta em curso
- **THEN** o sinal de cancelamento é enviado ao transporte e a interface regressa a um estado utilizável

### Requirement: Substituição do fornecedor
A aplicação anfitriã SHALL poder substituir o transporte por outro compatível sem alterar os componentes de apresentação do chat.

#### Scenario: Troca de transporte
- **WHEN** a aplicação configura um transporte diferente que cumpre o mesmo contrato
- **THEN** o chat mantém o mesmo comportamento de apresentação e envio de mensagens

### Requirement: Credenciais protegidas
A biblioteca SHALL evitar exigir ou incluir credenciais de fornecedores no código executado no navegador e SHALL permitir que o transporte use um endpoint controlado pela aplicação anfitriã.

#### Scenario: Integração através de endpoint anfitrião
- **WHEN** uma aplicação liga o chat a um serviço de IA que exige uma chave secreta
- **THEN** o navegador comunica com um endpoint da aplicação e a chave permanece no ambiente de servidor
