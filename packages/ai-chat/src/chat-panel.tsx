"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { ChatMessage, ChatTransport } from "./types.js";

type ChatStyle = CSSProperties & {
  "--ai-chat-header-height"?: CSSProperties["height"];
  "--ai-chat-accent"?: string;
  "--ai-chat-border"?: string;
};

export interface ChatPanelProps {
  title?: string;
  description?: string;
  headerHeight?: CSSProperties["height"];
  messages?: ChatMessage[];
  initialMessages?: ChatMessage[];
  emptyState?: ReactNode;
  accentColor?: string;
  borderColor?: string;
  className?: string;
  style?: CSSProperties;
  headerActions?: ReactNode;
  placeholder?: string;
  transport?: ChatTransport;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onError?: (error: unknown) => void;
}

let messageSequence = 0;

function createMessageId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  messageSequence += 1;
  return `chat-message-${Date.now()}-${messageSequence}`;
}

export function ChatPanel({
  title = "Chat IA",
  description,
  headerHeight,
  messages: controlledMessages,
  initialMessages = [],
  emptyState = "A conversa começa aqui.",
  accentColor,
  borderColor,
  className,
  style,
  headerActions,
  placeholder = "Escreve uma mensagem...",
  transport,
  onMessagesChange,
  onError,
}: ChatPanelProps) {
  const headingId = useId();
  const textareaId = useId();
  const [internalMessages, setInternalMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeRequestRef = useRef<{
    id: number;
    controller: AbortController;
  } | null>(null);
  const requestSequenceRef = useRef(0);
  const messages = controlledMessages ?? internalMessages;
  const isControlled = controlledMessages !== undefined;

  const panelStyle: ChatStyle = {
    "--ai-chat-header-height": headerHeight,
    "--ai-chat-accent": accentColor,
    "--ai-chat-border": borderColor,
    ...style,
  };

  const updateMessages = (nextMessages: ChatMessage[]) => {
    if (!isControlled) {
      setInternalMessages(nextMessages);
    }
    onMessagesChange?.(nextMessages);
  };

  const stopResponse = () => {
    activeRequestRef.current?.controller.abort();
    activeRequestRef.current = null;
    setIsResponding(false);
  };

  useEffect(
    () => () => {
      activeRequestRef.current?.controller.abort();
    },
    [],
  );

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    messagesEndRef.current?.scrollIntoView?.({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isResponding]);

  const submitMessage = async () => {
    const content = draft.trim();
    if (!content || !transport || activeRequestRef.current) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];
    const controller = new AbortController();
    const requestId = ++requestSequenceRef.current;

    updateMessages(nextMessages);
    setDraft("");
    setHasError(false);
    activeRequestRef.current = { id: requestId, controller };
    setIsResponding(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "";
    }

    try {
      const result = await transport({ messages: nextMessages, signal: controller.signal });
      if (controller.signal.aborted) {
        return;
      }

      const assistantMessage: ChatMessage =
        typeof result === "string"
          ? { id: createMessageId(), role: "assistant", content: result }
          : { ...result, id: result.id || createMessageId(), role: "assistant" };
      updateMessages([...nextMessages, assistantMessage]);
    } catch (error) {
      if (!controller.signal.aborted) {
        setHasError(true);
        onError?.(error);
      }
    } finally {
      if (activeRequestRef.current?.id === requestId) {
        activeRequestRef.current = null;
        setIsResponding(false);
      }
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      className={`ai-chat-panel${className ? ` ${className}` : ""}`}
      data-ai-chat
      style={panelStyle}
    >
      <header className="ai-chat-panel__header" data-ai-chat-header>
        <div className="ai-chat-panel__heading">
          <h2 className="ai-chat-panel__title" id={headingId}>
            {title}
          </h2>
          {description ? (
            <p className="ai-chat-panel__description">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="ai-chat-panel__actions">{headerActions}</div>
        ) : null}
      </header>
      <div
        aria-label="Conversa"
        aria-live="polite"
        aria-relevant="additions text"
        className="ai-chat-panel__messages"
        data-ai-chat-messages
        role="log"
      >
        {messages.length === 0 ? (
          <p className="ai-chat-panel__empty" role="status">
            {emptyState}
          </p>
        ) : (
          <ol className="ai-chat-message-list">
            {messages.map((message) => (
              <li
                className="ai-chat-message-row"
                data-role={message.role}
                key={message.id}
              >
                <article
                  aria-label={
                    message.role === "user" ? "Mensagem do utilizador" : "Resposta do assistente"
                  }
                  className="ai-chat-message"
                  data-role={message.role}
                >
                  <p
                    className="ai-chat-message__content"
                    style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                  >
                    {message.content}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        )}
        <div ref={messagesEndRef} />
        {isResponding ? (
          <p aria-live="polite" className="ai-chat-panel__status" role="status">
            A IA está a responder...
          </p>
        ) : null}
      </div>
      <form className="ai-chat-composer" onSubmit={handleSubmit}>
        {hasError ? (
          <p aria-live="assertive" className="ai-chat-composer__error" role="alert">
            Não foi possível obter uma resposta. Tenta novamente.
          </p>
        ) : null}
        <label className="ai-chat-sr-only" htmlFor={textareaId}>
          Escreve a tua mensagem
        </label>
        <textarea
          className="ai-chat-composer__textarea"
          disabled={isResponding}
          id={textareaId}
          onChange={(event) => handleDraftChange(event.currentTarget.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder={placeholder}
          ref={textareaRef}
          rows={1}
          value={draft}
        />
        <div className="ai-chat-composer__actions">
          {isResponding ? (
            <button
              className="ai-chat-composer__button ai-chat-composer__button--secondary"
              onClick={stopResponse}
              type="button"
            >
              Interromper
            </button>
          ) : (
            <button
              className="ai-chat-composer__button"
              disabled={!transport || !draft.trim()}
              type="submit"
            >
              Enviar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
