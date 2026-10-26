import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { ChatPanel, ChatWidget } from "../src/index.js";
import type { ChatTransport } from "../src/types.js";

describe("ChatPanel", () => {
  it("exposes a named region and heading", () => {
    render(<ChatPanel />);

    expect(screen.getByRole("region", { name: "Chat IA" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Chat IA" })).toBeTruthy();
  });

  it("renders messages in order and preserves long multi-line text", () => {
    const longMessage = `Primeira linha\n${"texto longo ".repeat(100)}`;
    render(
      <ChatPanel
        messages={[
          { id: "user-1", role: "user", content: "Olá" },
          { id: "assistant-1", role: "assistant", content: longMessage },
        ]}
      />,
    );

    const messages = screen.getByRole("log", { name: "Conversa" });
    expect(messages.textContent?.indexOf("Olá")).toBeLessThan(
      messages.textContent?.indexOf("Primeira linha") ?? -1,
    );
    const assistantMessage = screen.getByText(
      (_, element) =>
        element?.classList.contains("ai-chat-message__content") === true &&
        element.textContent === longMessage,
    );
    expect(assistantMessage.textContent).toBe(longMessage);
    expect(assistantMessage.style.whiteSpace).toBe("pre-wrap");
    expect(assistantMessage.style.overflowWrap).toBe("anywhere");
  });

  it("applies public header and color options", () => {
    render(
      <ChatPanel
        accentColor="#f2a900"
        borderColor="#222222"
        headerHeight="4rem"
        title="Assistente"
      />,
    );

    const panel = screen.getByRole("region", { name: "Assistente" });
    expect(panel.style.getPropertyValue("--ai-chat-header-height")).toBe("4rem");
    expect(panel.style.getPropertyValue("--ai-chat-accent")).toBe("#f2a900");
    expect(panel.style.getPropertyValue("--ai-chat-border")).toBe("#222222");
  });

  it("sends on Enter, preserves Shift+Enter, and keeps the exchange in memory", async () => {
    const transport = vi.fn<ChatTransport>(async ({ messages }) => {
      expect(messages.map(({ role }) => role)).toEqual(["user"]);
      return "Olá, posso ajudar?";
    });
    const onMessagesChange = vi.fn();
    render(<ChatPanel transport={transport} onMessagesChange={onMessagesChange} />);

    const composer = screen.getByRole("textbox", { name: "Escreve a tua mensagem" });
    fireEvent.change(composer, { target: { value: "Bom dia" } });
    fireEvent.keyDown(composer, { key: "Enter", shiftKey: true });
    expect(transport).not.toHaveBeenCalled();
    expect((composer as HTMLTextAreaElement).value).toBe("Bom dia");

    fireEvent.keyDown(composer, { key: "Enter" });
    expect(await screen.findByText("Olá, posso ajudar?")).toBeTruthy();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(onMessagesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ role: "user", content: "Bom dia" }),
      expect.objectContaining({ role: "assistant", content: "Olá, posso ajudar?" }),
    ]);
  });

  it("shows the pending state and aborts a response on request", async () => {
    let finishResponse: ((value: string) => void) | undefined;
    const transport = vi.fn<ChatTransport>(({ signal }) => {
      signal.addEventListener("abort", () => undefined);
      return new Promise((resolve) => {
        finishResponse = resolve;
      });
    });
    render(<ChatPanel transport={transport} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Escreve a tua mensagem" }), {
      target: { value: "Uma pergunta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(screen.getByRole("status").textContent).toContain("A IA está a responder");
    const stopButton = screen.getByRole("button", { name: "Interromper" });
    fireEvent.click(stopButton);
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(transport.mock.calls[0]?.[0].signal.aborted).toBe(true);

    finishResponse?.("Resposta tardia");
    await waitFor(() => expect(screen.queryByText("Resposta tardia")).toBeNull());
  });

  it("shows a recoverable error and allows another send", async () => {
    const transport = vi
      .fn<ChatTransport>()
      .mockRejectedValueOnce(new Error("private provider details"))
      .mockResolvedValueOnce("Resposta após nova tentativa");
    const onError = vi.fn();
    render(<ChatPanel transport={transport} onError={onError} />);

    const composer = screen.getByRole("textbox", { name: "Escreve a tua mensagem" });
    fireEvent.change(composer, { target: { value: "Primeira tentativa" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("private provider details")).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);

    fireEvent.change(composer, { target: { value: "Tentar novamente" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Resposta após nova tentativa")).toBeTruthy();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it("keeps sending unavailable for empty drafts or without a transport", () => {
    const { rerender } = render(<ChatPanel />);

    const send = screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    rerender(<ChatPanel transport={vi.fn<ChatTransport>(async () => "ok")} />);
    expect((screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("has no Axe accessibility violations in the panel", async () => {
    render(<ChatPanel transport={vi.fn<ChatTransport>(async () => "Resposta")} />);

    const panel = screen.getByRole("region", { name: "Chat IA" });
    const results = await axe.run(panel, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations.map(({ id }) => id)).toEqual([]);
  });

  it("uses automatic scrolling when reduced motion is requested", () => {
    const previousMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
    const previousScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    const scrollIntoView = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      render(<ChatPanel />);
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "end" });
    } finally {
      if (previousMatchMedia) {
        Object.defineProperty(window, "matchMedia", previousMatchMedia);
      } else {
        delete (window as Partial<Window>).matchMedia;
      }
      if (previousScrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScrollIntoView);
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
      }
    }
  });
});

describe("ChatWidget", () => {
  it("opens an independent floating panel without page children", () => {
    render(<ChatWidget title="Assistente" />);

    const launcher = screen.getByRole("button", { name: "Abrir chat" });
    fireEvent.click(launcher);

    expect(screen.getByRole("dialog", { name: "Assistente" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fechar chat" })).toBeTruthy();
    expect(launcher.getAttribute("aria-expanded")).toBe("true");
  });

  it("supports Escape and restores keyboard focus to the launcher", () => {
    render(<ChatWidget title="Assistente" />);

    const launcher = screen.getByRole("button", { name: "Abrir chat" });
    fireEvent.click(launcher);
    const dialog = screen.getByRole("dialog", { name: "Assistente" });
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Assistente" })).toBeNull();
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(launcher);
  });
});
