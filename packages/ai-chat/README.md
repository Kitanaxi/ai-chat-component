# ai-chat-component

Componente React reutilizável para apresentar uma conversa com IA. O pacote inclui um painel incorporável e uma janela flutuante, mas deixa a ligação ao serviço de IA sob controlo da aplicação anfitriã.

## Instalação e importação

Instala o pacote na aplicação React e importa os estilos uma vez no ponto de entrada global:

```tsx
import { ChatPanel, createHttpChatTransport } from "ai-chat-component";
import "ai-chat-component/styles.css";
```

O pacote requer React e React DOM 19.3 ou superior. Os componentes devem ser apresentados num ambiente cliente.

## Utilização

```tsx
import { ChatPanel, createHttpChatTransport } from "ai-chat-component";
import "ai-chat-component/styles.css";

const transport = createHttpChatTransport({ endpoint: "/api/chat" });

export function AssistantPanel() {
  return (
    <ChatPanel
      title="Assistente"
      description="Como posso ajudar?"
      transport={transport}
    />
  );
}
```

Para uma janela flutuante, usa `ChatWidget` com as mesmas opções de conversa:

```tsx
import { ChatWidget } from "ai-chat-component";

export function AssistantWidget() {
  return <ChatWidget title="Assistente" transport={transport} />;
}
```

## Opções

| Opção | Componente | Descrição |
| --- | --- | --- |
| `title` | Ambos | Título acessível da conversa. |
| `description` | Ambos | Texto curto junto ao título. |
| `headerHeight` | Ambos | Altura do cabeçalho; por omissão usa `--header-height` ou 3rem. |
| `messages` | Ambos | Histórico controlado pela aplicação. Se definido, a aplicação atualiza-o através de `onMessagesChange`. |
| `initialMessages` | Ambos | Histórico inicial quando o componente gere o estado localmente. |
| `emptyState` | Ambos | Conteúdo apresentado antes da primeira mensagem. |
| `placeholder` | Ambos | Texto de orientação no campo de mensagem. |
| `transport` | Ambos | Função assíncrona que recebe o histórico e um `AbortSignal`, devolvendo texto ou uma mensagem do assistente. |
| `onMessagesChange` | Ambos | Notificação quando uma mensagem é adicionada ao histórico. |
| `onError` | Ambos | Notificação de erro para a aplicação; a mensagem técnica não é mostrada ao utilizador. |
| `accentColor`, `borderColor` | Ambos | Cores principais do chat. |
| `className`, `style` | Ambos | Classes e estilos aplicados ao painel. |
| `headerActions` | `ChatPanel` | Controlos adicionais no cabeçalho incorporado. |
| `initiallyOpen` | `ChatWidget` | Abre a janela flutuante ao montar. |
| `launcherLabel` | `ChatWidget` | Nome acessível do botão que abre o chat. |

Uma mensagem tem a forma `{ id, role, content }`, em que `role` é `user` ou `assistant`. Sem `messages`, o histórico fica em memória enquanto a instância estiver montada.

## Ligar a um serviço no servidor

`createHttpChatTransport` envia um `POST` para o endpoint da aplicação com o corpo `{ "messages": [...] }`. O endpoint deve responder com JSON no formato `{ "message": "texto da resposta" }`. O transporte encaminha o `AbortSignal`, lança `ChatHttpError` para respostas HTTP não bem-sucedidas e `ChatResponseError` para respostas inválidas.

```tsx
import {
  ChatPanel,
  createHttpChatTransport,
  type ChatTransport,
} from "ai-chat-component";

const transport: ChatTransport = createHttpChatTransport({
  endpoint: "/api/chat",
});

<ChatPanel transport={transport} onError={(error) => reportChatFailure(error)} />;
```

Implementa `/api/chat` no servidor da aplicação anfitriã. A rota deve validar as mensagens, ler a chave do fornecedor a partir do ambiente do servidor, chamar o fornecedor e transformar a resposta para `{ message }`. Guarda valores como `AI_PROVIDER_API_KEY` em variáveis de ambiente apenas do servidor e num ficheiro local ignorado pelo Git. Não uses variáveis `NEXT_PUBLIC_*`, não incluas a chave em props ou no código do navegador e não devolvas detalhes do fornecedor ao cliente. Responde com um estado HTTP não bem-sucedido quando o serviço falhar; o chat apresenta um erro simples e mantém as mensagens para uma nova tentativa.

O pacote não define fornecedor, endpoint ou nome de variável por ti. A aplicação escolhe-os no seu código de servidor e fornece ao componente apenas o transporte configurado.

## Teclado e acessibilidade

- `Enter` envia a mensagem e `Shift+Enter` permite escrever várias linhas.
- O campo e os botões têm nomes acessíveis e foco visível.
- A janela flutuante recebe foco quando abre, fecha com `Escape` e devolve o foco ao botão de abertura.
- As mensagens aparecem numa região de conversa anunciada a tecnologias de apoio.
- A rolagem automática respeita `prefers-reduced-motion`.

## Personalização

O CSS do pacote é isolado por classes `ai-chat-*` e atributos `data-ai-chat`. Importa `styles.css` para obter o aspeto predefinido. As opções de cor podem ser passadas por props; o cabeçalho horizontal usa `--header-height` quando esse token existe no anfitrião.

## Testes e compilação

Na pasta do pacote:

```sh
npm test
npm run build
```

O pacote não guarda histórico fora da memória da instância e não inclui cliente de um fornecedor de IA. O transporte HTTP e a proteção de credenciais são responsabilidade da aplicação anfitriã.
