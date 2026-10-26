"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChatPanel, type ChatPanelProps } from "./chat-panel.js";

export interface ChatWidgetProps extends ChatPanelProps {
  initiallyOpen?: boolean;
  launcherLabel?: string;
}

export function ChatWidget({
  initiallyOpen = false,
  launcherLabel = "Abrir chat",
  title = "Chat IA",
  ...panelProps
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    } else if (wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="ai-chat-widget" data-ai-chat-widget>
      <div
        aria-label={title}
        className="ai-chat-widget__panel"
        hidden={!isOpen}
        id={panelId}
        onKeyDown={handlePanelKeyDown}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <ChatPanel
          headerActions={
            <button
              aria-label="Fechar chat"
              className="ai-chat-panel__icon-button"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          }
          title={title}
          {...panelProps}
        />
      </div>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Ocultar chat" : launcherLabel}
        className="ai-chat-widget__launcher"
        onClick={() => setIsOpen((open) => !open)}
        ref={launcherRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="20"
          viewBox="0 0 24 24"
          width="20"
        >
          <path
            d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.4A7.5 7.5 0 1 1 20 11.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
        <span>{isOpen ? "Fechar" : "Chat"}</span>
      </button>
    </div>
  );
}
