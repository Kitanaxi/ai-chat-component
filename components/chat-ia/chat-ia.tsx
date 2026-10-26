"use client";

import AI_Prompt from "@/components/kokonutui/ai-prompt";
import DotGrid from "@/components/DotGrid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import Image, { type StaticImageData } from "next/image";
import {
  BookOpen,
  ChevronRight,
  Lightbulb,
  Maximize2,
  MessageSquare,
  Minimize2,
  Sparkles,
  X,
} from "lucide-react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
type PromptProps = ComponentProps<typeof AI_Prompt>;
type ChatIAStyle = CSSProperties & {
  "--chat-ia-accent-color": string;
  "--chat-ia-border-color"?: string;
};
type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};
type ChatConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};
type StoredChatState = {
  conversations: ChatConversation[];
  activeConversationId: string | null;
};

const CHAT_STORAGE_KEY = "chat-ia-conversations-v1";
const NEW_CONVERSATION_TITLE = "Nova conversa";
const EMPTY_MESSAGES: ChatMessage[] = [];

function createConversation(): ChatConversation {
  return {
    id: crypto.randomUUID(),
    title: NEW_CONVERSATION_TITLE,
    messages: [],
    updatedAt: Date.now(),
  };
}

function isStoredMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "number" &&
    (message.role === "assistant" || message.role === "user") &&
    typeof message.text === "string"
  );
}

function isStoredConversation(value: unknown): value is ChatConversation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const conversation = value as Partial<ChatConversation>;
  return (
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    typeof conversation.updatedAt === "number" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isStoredMessage)
  );
}

function parseStoredChatState(rawValue: string | null): StoredChatState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const value = JSON.parse(rawValue) as Partial<StoredChatState>;
    if (!Array.isArray(value.conversations)) {
      return null;
    }

    return {
      conversations: value.conversations.filter(isStoredConversation),
      activeConversationId:
        typeof value.activeConversationId === "string"
          ? value.activeConversationId
          : null,
    };
  } catch {
    return null;
  }
}

export interface ChatIAProps {
  /** Platform content rendered beside the chat panel. */
  children: ReactNode;
  /** Name displayed in the chat panel header. */
  name?: string;
  /** Optional AI logo for light theme, as a public path/URL or static import. */
  logoIa?: string | StaticImageData;
  /** Optional replacement logo for dark theme. */
  logoIaDark?: string | StaticImageData;
  /** Rendered logo width and height in pixels. */
  logoIaSize?: number;
  /** Accent color for DotGrid and highlighted question borders. */
  color?: string;
  /** Explicit accent override for DotGrid and highlighted borders. */
  activeColor?: string;
  /** Optional override for panel and message borders. */
  borderColor?: string;
  /** Display the open chat as an inset, rounded floating panel. */
  floating?: boolean;
  /** Distance from the viewport edges when floating is enabled. */
  floatingMargin?: number | string;
  /** Per-side margin overrides for the floating panel. */
  floatingMarginTop?: number | string;
  floatingMarginRight?: number | string;
  floatingMarginBottom?: number | string;
  floatingMarginLeft?: number | string;
  /** Corner radius for the floating panel. */
  floatingRadius?: number | string;
  /** Show a shadow around the floating panel. */
  floatingShadow?: boolean;
  /** Connect the prompt to the platform's AI workflow. */
  onSubmit?: PromptProps["onSubmit"];
  onStop?: PromptProps["onStop"];
  models?: PromptProps["models"];
  defaultModel?: PromptProps["defaultModel"];
  placeholder?: PromptProps["placeholder"];
}

const DEFAULT_MODELS: NonNullable<PromptProps["models"]> = [
  {
    name: "Gemini Pro",
    description: "Modelo avançado do Google para tarefas complexas",
    efforts: ["Low", "Medium", "High"],
    defaultEffort: "Medium",
  },
  {
    name: "Gemini Flash",
    description: "Modelo rápido para tarefas do dia a dia",
    efforts: ["Low", "Medium"],
    defaultEffort: "Medium",
  },
];

const STARTER_QUESTIONS = [
  {
    prompt: "O que podes fazer?",
    title: "O que podes fazer?",
    description: "Descobre como posso ajudar-te",
    Icon: Sparkles,
  },
  {
    prompt: "Explica um conceito",
    title: "Explica um conceito",
    description: "Aprende de forma simples, passo a passo",
    Icon: BookOpen,
  },
  {
    prompt: "Ajuda-me com uma ideia",
    title: "Ajuda-me com uma ideia",
    description: "Vamos transformar a tua ideia num plano",
    Icon: Lightbulb,
  },
];

export function ChatIA({
  children,
  onSubmit,
  onStop,
  models = DEFAULT_MODELS,
  defaultModel = "Gemini Pro",
  placeholder = "Escreve uma pergunta...",
  name = "Chat IA",
  logoIa,
  logoIaDark,
  logoIaSize = 56,
  color,
  activeColor,
  borderColor,
  floating = false,
  floatingMargin = 16,
  floatingMarginTop,
  floatingMarginRight,
  floatingMarginBottom,
  floatingMarginLeft,
  floatingRadius = 24,
  floatingShadow = true,
}: ChatIAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNameMenuOpen, setIsNameMenuOpen] = useState(false);
  const [isFullScreenViewport, setIsFullScreenViewport] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [isStorageReady, setIsStorageReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const isPanelExpanded = isFullScreenViewport || isExpanded;
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const messages = activeConversation?.messages ?? EMPTY_MESSAGES;
  const baseColor = resolvedTheme === "dark" ? "#494058" : "#a4a4a4";
  const resolvedAccentColor =
    activeColor ?? color ?? (resolvedTheme === "dark" ? "#ffffff" : "#000000");
  const resolvedBorderColor = borderColor ?? "var(--border)";
  const resolvedFloatingMargin =
    typeof floatingMargin === "number" ? `${floatingMargin}px` : floatingMargin;
  const resolveFloatingMargin = (margin?: number | string) =>
    margin === undefined
      ? resolvedFloatingMargin
      : typeof margin === "number"
        ? `${margin}px`
        : margin;
  const resolvedFloatingMarginTop = resolveFloatingMargin(floatingMarginTop);
  const resolvedFloatingMarginRight = resolveFloatingMargin(floatingMarginRight);
  const resolvedFloatingMarginBottom = resolveFloatingMargin(floatingMarginBottom);
  const resolvedFloatingMarginLeft = resolveFloatingMargin(floatingMarginLeft);
  const resolvedFloatingRadius =
    typeof floatingRadius === "number" ? `${floatingRadius}px` : floatingRadius;
  const resolvedLogoIa =
    resolvedTheme === "dark" ? (logoIaDark ?? logoIa) : logoIa;
  const chatStyle: ChatIAStyle = {
    "--chat-ia-accent-color": resolvedAccentColor,
    "--chat-ia-border-color": resolvedBorderColor,
  };
  const customBorderStyle = { borderColor: resolvedBorderColor };
  const chatPanelStyle: CSSProperties = {
    ...customBorderStyle,
    ...(floating && !isPanelExpanded
      ? {
          top: resolvedFloatingMarginTop,
          right: resolvedFloatingMarginRight,
          bottom: resolvedFloatingMarginBottom,
          left: "auto",
          width: `min(400px, calc(100vw - ${resolvedFloatingMarginLeft} - ${resolvedFloatingMarginRight}))`,
          borderRadius: resolvedFloatingRadius,
        }
      : {}),
  };

  useEffect(() => {
    let storedState: StoredChatState | null = null;
    try {
      storedState = parseStoredChatState(
        window.localStorage.getItem(CHAT_STORAGE_KEY)
      );
    } catch {
      storedState = null;
    }

    const loadedConversations = (storedState?.conversations ?? []).sort(
      (first, second) => second.updatedAt - first.updatedAt
    );

    if (!storedState) {
      const initialConversation = createConversation();
      setConversations([initialConversation]);
      setActiveConversationId(initialConversation.id);
    } else {
      const savedActiveConversationId =
        loadedConversations.find(
          (conversation) =>
            conversation.id === storedState.activeConversationId
        )?.id ?? loadedConversations[0]?.id ?? null;
      const largestMessageId = loadedConversations
        .flatMap((conversation) => conversation.messages)
        .reduce((largest, message) => Math.max(largest, message.id), 0);

      messageIdRef.current = largestMessageId;
      setConversations(loadedConversations);
      setActiveConversationId(savedActiveConversationId);
    }

    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    try {
      window.localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({ conversations, activeConversationId })
      );
    } catch {
      // Keep the chat usable when browser storage is unavailable.
    }
  }, [activeConversationId, conversations, isStorageReady]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 445px) and (max-height: 498px)"
    );
    const updateViewport = () =>
      setIsFullScreenViewport(mediaQuery.matches);

    updateViewport();
    setDevicePixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      messagesEndRef.current?.parentElement?.scrollTo({ top: 0 });
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeConversationId, messages]);

  const appendMessageToConversation = (
    conversationId: string,
    message: ChatMessage
  ) => {
    setConversations((currentConversations) => {
      const conversation = currentConversations.find(
        (item) => item.id === conversationId
      );
      if (!conversation) {
        return currentConversations;
      }

      const normalizedText = message.text.trim().replace(/\s+/g, " ");
      const nextTitle =
        message.role === "user" && conversation.messages.length === 0
          ? normalizedText.length > 36
            ? `${normalizedText.slice(0, 36)}…`
            : normalizedText || NEW_CONVERSATION_TITLE
          : conversation.title;
      const updatedConversation: ChatConversation = {
        ...conversation,
        title: nextTitle,
        messages: [...conversation.messages, message],
        updatedAt: Date.now(),
      };

      return [
        updatedConversation,
        ...currentConversations.filter((item) => item.id !== conversationId),
      ];
    });
  };

  const startNewConversation = () => {
    const conversation = createConversation();
    setConversations((currentConversations) => [
      conversation,
      ...currentConversations,
    ]);
    setActiveConversationId(conversation.id);
    setIsNameMenuOpen(false);
  };

  const clearActiveConversation = () => {
    if (!activeConversationId) {
      return;
    }

    setConversations((currentConversations) => {
      const conversation = currentConversations.find(
        (item) => item.id === activeConversationId
      );
      if (!conversation || conversation.messages.length === 0) {
        return currentConversations;
      }

      const clearedConversation: ChatConversation = {
        ...conversation,
        title: NEW_CONVERSATION_TITLE,
        messages: [],
        updatedAt: Date.now(),
      };
      return [
        clearedConversation,
        ...currentConversations.filter(
          (item) => item.id !== activeConversationId
        ),
      ];
    });
    setIsNameMenuOpen(false);
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsNameMenuOpen(false);
  };

  const closeConversation = (conversationId: string) => {
    const remainingConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );

    setConversations(remainingConversations);
    if (activeConversationId === conversationId) {
      setActiveConversationId(remainingConversations[0]?.id ?? null);
    }
  };

  const ensureActiveConversationId = () => {
    const activeConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    );
    if (activeConversation) {
      return activeConversation.id;
    }

    const conversation = createConversation();
    setConversations((currentConversations) => [
      conversation,
      ...currentConversations,
    ]);
    setActiveConversationId(conversation.id);
    return conversation.id;
  };

  const handlePromptSubmit: NonNullable<PromptProps["onSubmit"]> = async (
    text,
    model,
    options,
    existingConversationId?
  ) => {
    if (!isStorageReady) {
      return;
    }
    const conversationId =
      existingConversationId ?? ensureActiveConversationId();

    const userMessage: ChatMessage = {
      id: ++messageIdRef.current,
      role: "user",
      text,
    };
    appendMessageToConversation(conversationId, userMessage);

    if (onSubmit) {
      return onSubmit(text, model, options);
    }

    await new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(resolve, 650);
      options.signal.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timeoutId);
          resolve();
        },
        { once: true }
      );
    });

    if (!options.signal.aborted) {
      const assistantMessage: ChatMessage = {
        id: ++messageIdRef.current,
        role: "assistant",
        text: "Resposta de teste: a tua mensagem apareceu no histórico da conversa.",
      };
      appendMessageToConversation(conversationId, assistantMessage);
    }
  };

  const sendSuggestedQuestion = (text: string) => {
    const model = models.find((item) => item.name === defaultModel) ?? models[0];
    const effort =
      model?.defaultEffort && model.efforts?.includes(model.defaultEffort)
        ? model.defaultEffort
        : (model?.efforts?.at(-1) ?? null);
    const controller = new AbortController();
    const conversationId = ensureActiveConversationId();

    void handlePromptSubmit(text, model?.name ?? defaultModel, {
      effort,
      files: [],
      signal: controller.signal,
      command: null,
    }, conversationId).catch(() => {
      const errorMessage: ChatMessage = {
        id: ++messageIdRef.current,
        role: "assistant",
        text: "Não consegui responder agora. Tenta novamente.",
      };
      if (conversationId) {
        appendMessageToConversation(conversationId, errorMessage);
      }
    });
  };

  return (
    <div className="relative min-h-svh overflow-x-clip" style={chatStyle}>
      <motion.div
        animate={{
          width: isOpen && !isPanelExpanded ? "calc(100% - 400px)" : "100%",
        }}
        className="min-h-svh"
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {children}
      </motion.div>

      <Button
        aria-controls="chat-ia-panel"
        aria-expanded={isOpen}
        aria-hidden={isOpen}
        className={cn(
          "fixed top-4 left-4 z-30 transition-opacity",
          isOpen && "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(true)}
        tabIndex={isOpen ? -1 : 0}
        type="button"
      >
        <MessageSquare aria-hidden="true" />
        Chat
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            {isPanelExpanded && (
              <motion.button
                aria-label="Fechar chat"
                className="pointer-events-auto absolute inset-0 z-40 cursor-default bg-black/30"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  setIsExpanded(false);
                  setIsOpen(false);
                }}
                type="button"
              />
            )}

            <motion.aside
              aria-labelledby="chat-ia-title"
              aria-modal={isPanelExpanded ? true : undefined}
              className={cn(
                "pointer-events-auto absolute z-50 flex w-full flex-col border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                isExpanded && "flex-row",
                isPanelExpanded
                  ? "inset-0 max-w-full border-l-0"
                  : floating
                    ? cn(
                        "max-w-[400px] border",
                        floatingShadow && "shadow-xl"
                      )
                    : "inset-y-0 right-0 max-w-[400px] border-l"
              )}
              exit={{ x: "100%", opacity: 0 }}
              id="chat-ia-panel"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              role="dialog"
              style={chatPanelStyle}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div
                className={cn(
                  "flex items-center border-zinc-200 dark:border-zinc-800",
                  isExpanded
                    ? "h-full w-[76px] shrink-0 flex-col justify-start gap-4 border-r px-1 py-3"
                    : "h-(--header-height) w-full shrink-0 justify-between border-b px-4"
                )}
                style={customBorderStyle}
              >
                <DropdownMenu
                  open={isNameMenuOpen}
                  onOpenChange={(open) => setIsNameMenuOpen(open)}
                >
                  <DropdownMenuTrigger
                    render={
                      <Button
                        aria-label={isExpanded ? name : undefined}
                        className={cn(
                          isExpanded &&
                            "h-auto w-full flex-col gap-1 px-1 py-2"
                        )}
                        title={isExpanded ? name : undefined}
                        variant="ghost"
                      />
                    }
                  >
                    {isExpanded ? (
                      resolvedLogoIa ? (
                        <Image
                          alt=""
                          className="size-7 object-contain"
                          height={28}
                          src={resolvedLogoIa}
                          unoptimized={typeof resolvedLogoIa === "string"}
                          width={28}
                        />
                      ) : (
                        <Sparkles aria-hidden="true" className="size-4" />
                      )
                    ) : (
                      <>
                        {name}
                        <ChevronRight
                          aria-hidden="true"
                          className={cn(
                            "size-4 transition-transform duration-150",
                            isNameMenuOpen && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        disabled={!isStorageReady}
                        onClick={startNewConversation}
                      >
                        Nova conversa
                      </DropdownMenuItem>
                      {messages.length > 0 ? (
                        <DropdownMenuItem
                          disabled={!isStorageReady}
                          onClick={clearActiveConversation}
                        >
                          Limpar mensagens
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuGroup>
                    {conversations.length > 0 ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>
                            Conversas guardadas
                          </DropdownMenuLabel>
                          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                            {conversations.map((conversation) => (
                              <div
                                className="flex items-center gap-1"
                                key={conversation.id}
                              >
                                <DropdownMenuItem
                                  aria-current={
                                    conversation.id === activeConversationId
                                      ? "true"
                                      : undefined
                                  }
                                  className={cn(
                                    "min-w-0 flex-1",
                                    conversation.id === activeConversationId &&
                                      "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() =>
                                    selectConversation(conversation.id)
                                  }
                                >
                                  <span className="truncate">
                                    {conversation.title}
                                  </span>
                                </DropdownMenuItem>
                                <Button
                                  aria-label={`Eliminar conversa ${conversation.title}`}
                                  className="size-7 shrink-0"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    closeConversation(conversation.id);
                                  }}
                                  size="icon"
                                  title="Eliminar conversa"
                                  type="button"
                                  variant="ghost"
                                >
                                  <X
                                    aria-hidden="true"
                                    className="size-3.5"
                                  />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </DropdownMenuGroup>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div
                  className={cn(
                    "flex gap-1",
                    isExpanded ? "flex-col items-center" : "items-center"
                  )}
                >
                <Button
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? "Restaurar painel do chat" : "Expandir chat"
                  }
                  onClick={() => setIsExpanded((expanded) => !expanded)}
                  size="icon"
                  title={isExpanded ? "Restaurar chat" : "Expandir chat"}
                  type="button"
                  variant="ghost"
                >
                  {isExpanded ? (
                    <Minimize2 aria-hidden="true" className="size-4" />
                  ) : (
                    <Maximize2 aria-hidden="true" className="size-4" />
                  )}
                </Button>

                 <Button
                   aria-label="Fechar chat"
                   onClick={() => {
                     setIsExpanded(false);
                     setIsOpen(false);
                   }}
                   size="icon"
                   type="button"
                   variant="ghost"
                 >
                   <X aria-hidden="true" className="size-4" />
                 </Button>
               </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden">
                {!isExpanded && (
                  <div className="pointer-events-none absolute inset-0">
                    <DotGrid
                      activeColor={resolvedAccentColor}
                      baseColor={baseColor}
                      bounce={0.6}
                      clickShock
                      dotSize={1}
                      dpr={devicePixelRatio}
                      fade={0}
                      gap={14}
                      glow={0.35}
                      intro
                      mouseInteraction
                      opacity={1}
                      proximity={120}
                      returnDuration={0.8}
                      shape="circle"
                      shockRadius={320}
                      shockStrength={2}
                      strength={0.85}
                      stretch={0.5}
                      style={{}}
                      swell={0.8}
                      tension={0.25}
                    />
                  </div>
                )}

                <div className="relative z-10 flex h-full min-h-0 flex-col">
                  <div
                    aria-label="Mensagens da conversa"
                    aria-relevant="additions"
                    className={cn(
                      "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5",
                      "[scrollbar-color:rgb(161_161_170_/_0.65)_transparent] [scrollbar-width:thin]",
                      "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent",
                      "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400/70",
                      "dark:[scrollbar-color:rgb(82_82_91_/_0.8)_transparent]",
                      "dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600/80"
                    )}
                    role="log"
                  >
                    {messages.length === 0 ? (
                      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-2 py-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        <div>
                          {resolvedLogoIa ? (
                            <Image
                              alt={`Logótipo de ${name}`}
                              className="mx-auto mb-3 object-contain"
                              height={logoIaSize}
                              src={resolvedLogoIa}
                              unoptimized={typeof resolvedLogoIa === "string"}
                              width={logoIaSize}
                            />
                          ) : null}
                          <h1 className="text-lg font-medium text-black dark:text-white">
                            Olá! Como posso ajudar?
                          </h1>
                          <p className="mt-1">
                            Escreve uma pergunta ou escolhe uma sugestão.
                          </p>
                        </div>
                        <div
                          aria-label="Sugestões de perguntas"
                          className="flex w-full mt-2 max-w-md flex-col gap-1.5"
                        >
                          {STARTER_QUESTIONS.map(({ prompt, title, description, Icon }) => (
                            <Button
                              className={cn(
                                "group relative flex mb-1 h-[52px] w-full items-center justify-start gap-2 overflow-hidden rounded-xl border bg-white px-2.5 py-1 text-left text-zinc-700 shadow-0  transition-all hover:border-[var(--chat-ia-accent-color)] hover:bg-zinc-50 hover:shadow-md focus-visible:border-[var(--chat-ia-accent-color)] focus-visible:ring-2 focus-visible:ring-[var(--chat-ia-accent-color)] focus-visible:ring-offset-2 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[var(--chat-ia-accent-color)] dark:hover:bg-zinc-800 dark:focus-visible:border-[var(--chat-ia-accent-color)] dark:focus-visible:bg-zinc-800",
                                "border-[var(--chat-ia-border-color)] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--chat-ia-accent-color)] before:opacity-0 before:transition-opacity hover:before:opacity-100 focus-visible:before:opacity-100 dark:hover:before:opacity-100 dark:focus-visible:before:opacity-100"
                              )}
                              key={prompt}
                              onClick={() => sendSuggestedQuestion(prompt)}
                              style={{
                                "--chat-ia-suggestion-hover-bg":
                                  resolvedTheme === "dark"
                                    ? "color-mix(in srgb, var(--chat-ia-accent-color) 22%, #18181b)"
                                    : "color-mix(in srgb, var(--chat-ia-accent-color) 10%, white)",
                              } as CSSProperties}
                              type="button"
                              variant="outline"
                            >
                              <span
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-[var(--chat-ia-suggestion-hover-bg)] group-hover:text-[var(--chat-ia-accent-color)] group-focus-visible:bg-[var(--chat-ia-suggestion-hover-bg)] group-focus-visible:text-[var(--chat-ia-accent-color)] dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-800 dark:group-hover:text-[var(--chat-ia-accent-color)] dark:group-focus-visible:bg-zinc-800 dark:group-focus-visible:text-[var(--chat-ia-accent-color)]"
                              >
                                <Icon aria-hidden="true" className="size-3" />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                                <span className="max-w-full truncate text-[12px] font-medium text-zinc-500 group-hover:text-black group-focus-visible:text-black dark:text-zinc-100 dark:group-hover:text-zinc-100 dark:group-focus-visible:text-zinc-100">
                                  {title}
                                </span>
                                <span className="max-w-full truncate  text-[12px] font-normal text-zinc-500 dark:text-zinc-400">
                                  {description}
                                </span>
                              </span>
                              <ChevronRight
                                aria-hidden="true"
                                className="size-4 shrink-0 text-zinc-400 transition-colors group-hover:text-[var(--chat-ia-accent-color)] group-focus-visible:text-[var(--chat-ia-accent-color)] dark:text-zinc-500 dark:group-hover:text-[var(--chat-ia-accent-color)] dark:group-focus-visible:text-[var(--chat-ia-accent-color)]"
                              />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ol
                        className={cn(
                          "space-y-3",
                          isExpanded && "mx-auto w-full max-w-lg"
                        )}
                      >
                        {messages.map((message) => (
                          <li
                            className={cn(
                              "flex",
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            )}
                            key={message.id}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] whitespace-pre-wrap break-words text-sm",
                                message.role === "user"
                                  ? "rounded-2xl border border-neutral-100 bg-neutral-100 px-4 py-3 text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                  : isExpanded
                                    ? "max-w-full text-foreground"
                                    : "rounded-2xl border border-border bg-background px-4 py-3 text-foreground shadow-sm"
                              )}
                              style={
                                message.role === "assistant" && isExpanded
                                  ? undefined
                                  : customBorderStyle
                              }
                            >
                              {message.text}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="shrink-0 px-4 pt-2 pb-2">
                    <AI_Prompt
                      className="mx-auto py-1"
                      defaultModel={defaultModel}
                      disableAttachments
                      headerAction=""
                      headerText=""
                      models={models}
                      onStop={onStop}
                      onSubmit={handlePromptSubmit}
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatIA;
