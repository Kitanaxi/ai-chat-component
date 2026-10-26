import type { ChatTransport } from "./types.js";

export interface HttpChatTransportOptions {
  /** Endpoint owned by the host application, such as `/api/chat`. */
  endpoint: string;
  /** Optional fetch implementation, primarily useful for tests and custom runtimes. */
  fetcher?: typeof fetch;
}

export class ChatHttpError extends Error {
  constructor(readonly status: number) {
    super(`O endpoint do chat respondeu com o estado HTTP ${status}.`);
    this.name = "ChatHttpError";
  }
}

export class ChatResponseError extends Error {
  constructor() {
    super("O endpoint do chat devolveu uma resposta inválida.");
    this.name = "ChatResponseError";
  }
}

/** Creates a provider-neutral transport for an application-owned JSON endpoint. */
export function createHttpChatTransport({
  endpoint,
  fetcher = globalThis.fetch,
}: HttpChatTransportOptions): ChatTransport {
  if (!endpoint.trim()) {
    throw new Error("É necessário indicar o endpoint do chat.");
  }

  return async ({ messages, signal }) => {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (!response.ok) {
      throw new ChatHttpError(response.status);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ChatResponseError();
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !("message" in payload) ||
      typeof payload.message !== "string" ||
      payload.message.trim().length === 0
    ) {
      throw new ChatResponseError();
    }

    return payload.message;
  };
}
