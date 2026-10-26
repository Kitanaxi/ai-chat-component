import { describe, expect, it, vi } from "vitest";
import {
  ChatHttpError,
  ChatResponseError,
  createHttpChatTransport,
} from "../src/transport.js";
import type { ChatMessage } from "../src/types.js";

const history: ChatMessage[] = [
  { id: "u1", role: "user", content: "Olá" },
];

describe("createHttpChatTransport", () => {
  it("posts the conversation and returns the endpoint message", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "Olá!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const controller = new AbortController();
    const transport = createHttpChatTransport({ endpoint: "/api/chat", fetcher });

    await expect(transport({ messages: history, signal: controller.signal })).resolves.toBe(
      "Olá!",
    );
    expect(fetcher).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
      signal: controller.signal,
    });
  });

  it("reports HTTP and malformed-response errors without exposing response bodies", async () => {
    const failedFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("provider secret detail", { status: 503 }),
    );
    const transport = createHttpChatTransport({
      endpoint: "/api/chat",
      fetcher: failedFetcher,
    });
    const controller = new AbortController();

    await expect(
      transport({ messages: history, signal: controller.signal }),
    ).rejects.toMatchObject<Partial<ChatHttpError>>({ status: 503, name: "ChatHttpError" });

    const malformedFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ answer: "campo inesperado" }), { status: 200 }),
    );
    const malformedTransport = createHttpChatTransport({
      endpoint: "/api/chat",
      fetcher: malformedFetcher,
    });
    await expect(
      malformedTransport({ messages: history, signal: controller.signal }),
    ).rejects.toBeInstanceOf(ChatResponseError);
  });

  it("passes cancellation through to fetch", async () => {
    const fetcher = vi.fn<typeof fetch>((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    const controller = new AbortController();
    const transport = createHttpChatTransport({ endpoint: "/api/chat", fetcher });
    const pending = transport({ messages: history, signal: controller.signal });

    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(fetcher.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});
