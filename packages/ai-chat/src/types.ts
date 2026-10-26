export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export type ChatTransport = (request: {
  messages: ChatMessage[];
  signal: AbortSignal;
}) => Promise<string | ChatMessage>;
