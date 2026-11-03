"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  MessageCircle,
  SendHorizontal,
  X,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeRole, useCurrentUser } from "@/lib/session";
import type { UserRole } from "@/lib/types";

interface ChatSource {
  id: string;
  title: string;
  source: string;
}

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
  timestamp: string;
  sources?: ChatSource[];
  suggestedFollowups?: string[];
  toolsUsed?: string[];
}

const MAX_LENGTH = 500;

const ROLE_SUGGESTIONS: Record<UserRole, string[]> = {
  Donor: [
    "How do I list surplus food?",
    "Where can I see my active donations?",
    "Can I cancel a donation after pickup?",
  ],
  Volunteer: [
    "How do I claim an available donation?",
    "What does my pickup status mean?",
    "How many active tasks can I claim?",
  ],
  NGO: [
    "How do I confirm a received donation?",
    "How can I view incoming deliveries?",
    "What is required for NGO verification?",
  ],
  Admin: [
    "How do I review NGO verifications?",
    "Where can I view audit activity?",
    "What are administrator safety rules?",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "How does the donation lifecycle work?",
  "How do I register as a donor or volunteer?",
  "What are the food safety requirements?",
];

function getWelcomeMessage(role?: UserRole | null): string {
  if (role === "Donor") {
    return "Hi, I'm your FoodShare assistant! Ask me about listing surplus food, pickup deadlines, cancellation policies, or your donation status.";
  }
  if (role === "Volunteer") {
    return "Hi, I'm your FoodShare assistant! Ask me about claiming donations, confirming pickups, delivery handover, or your active tasks.";
  }
  if (role === "NGO") {
    return "Hi, I'm your FoodShare assistant! Ask me about verifying incoming deliveries, confirming receipts, or organization verification.";
  }
  if (role === "Admin") {
    return "Hi, I'm your FoodShare assistant! Ask me about platform metrics, reviewing NGO verification documents, or monitoring activity.";
  }
  return "Hi, I'm the FoodShare assistant. Ask me how donating, volunteering, or receiving food works across the platform.";
}

function failureMessage(status: number | null, serverText?: string): string {
  if (status === null) return "I can't reach the assistant right now. Check your connection and try again.";
  if (status === 429) return "You're sending messages quickly. Wait a moment and try again.";
  if (status === 400 && serverText) return serverText;
  if (status >= 500) return "The assistant ran into a problem. Try again in a moment.";
  return "That didn't go through. Try again.";
}

function formatTime(isoOrDate?: string): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Lightweight safe markdown formatter for chat responses. */
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Bullet point
        if (trimmed.startsWith("• ") || trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const itemText = trimmed.replace(/^[•*-]\s+/, "");
          return (
            <div key={idx} className="flex gap-2 pl-1">
              <span className="select-none text-primary font-bold">•</span>
              <div>{renderInline(itemText)}</div>
            </div>
          );
        }

        // Section header like **Title**
        if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.slice(2, -2).includes("**")) {
          return (
            <p key={idx} className="font-semibold text-foreground pt-1">
              {trimmed.slice(2, -2)}
            </p>
          );
        }

        return <p key={idx}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Simple token parsing for **bold** and `code`
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    let nextMatch = null;
    let matchType = null;

    if (boldMatch && codeMatch) {
      if ((boldMatch.index ?? 0) <= (codeMatch.index ?? 0)) {
        nextMatch = boldMatch;
        matchType = "bold";
      } else {
        nextMatch = codeMatch;
        matchType = "code";
      }
    } else if (boldMatch) {
      nextMatch = boldMatch;
      matchType = "bold";
    } else if (codeMatch) {
      nextMatch = codeMatch;
      matchType = "code";
    }

    if (!nextMatch || nextMatch.index === undefined) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (nextMatch.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, nextMatch.index)}</span>);
    }

    if (matchType === "bold") {
      parts.push(<strong key={key++} className="font-semibold">{nextMatch[1]}</strong>);
    } else if (matchType === "code") {
      parts.push(
        <code key={key++} className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs text-foreground">
          {nextMatch[1]}
        </code>
      );
    }

    remaining = remaining.slice(nextMatch.index + nextMatch[0].length);
  }

  return parts;
}

export default function Chatbot() {
  const url = process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:5002";
  const { user } = useCurrentUser();
  const role = normalizeRole(user?.role);
  const suggestions = role ? ROLE_SUGGESTIONS[role] : DEFAULT_SUGGESTIONS;

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ text: string; retry: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);
  const panelId = useId();
  const inputId = useId();

  // Initialize or restore conversation session
  useEffect(() => {
    const savedCid = typeof window !== "undefined" ? sessionStorage.getItem("foodshare:chat:cid") : null;
    if (savedCid) {
      setConversationId(savedCid);
    }
    const welcomeText = getWelcomeMessage(role);
    setMessages([{ id: 0, from: "bot", text: welcomeText, timestamp: formatTime() }]);
  }, [role]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("foodshare:open-chatbot", handleOpen);
    return () => window.removeEventListener("foodshare:open-chatbot", handleOpen);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the newest message in view
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, failure]);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  async function handleCopy(msgId: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  }

  function handleClearChat() {
    if (conversationId) {
      void fetch(`${url}/api/conversations/${conversationId}/clear`, { method: "POST" }).catch(() => {});
    }
    nextId.current = 1;
    setMessages([{ id: 0, from: "bot", text: getWelcomeMessage(role), timestamp: formatTime() }]);
    setFailure(null);
  }

  async function send(text: string, isRetry = false) {
    const message = text.trim();
    if (!message || pending) return;

    setFailure(null);
    setInput("");

    if (!isRetry) {
      setMessages((m) => [
        ...m,
        { id: nextId.current++, from: "user", text: message, timestamp: formatTime() },
      ]);
    }

    setPending(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20_000);

    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          conversation_id: conversationId || undefined,
        }),
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => ({}))) as {
        response?: string;
        conversation_id?: string;
        sources?: ChatSource[];
        suggested_followups?: string[];
        tools_used?: string[];
        error?: string;
      };

      if (!res.ok || typeof data.response !== "string") {
        setFailure({ text: failureMessage(res.status, data.error), retry: message });
      } else {
        if (data.conversation_id && data.conversation_id !== conversationId) {
          setConversationId(data.conversation_id);
          sessionStorage.setItem("foodshare:chat:cid", data.conversation_id);
        }

        setMessages((m) => [
          ...m,
          {
            id: nextId.current++,
            from: "bot",
            text: data.response as string,
            timestamp: formatTime(),
            sources: data.sources,
            suggestedFollowups: data.suggested_followups,
            toolsUsed: data.tools_used,
          },
        ]);
      }
    } catch {
      setFailure({ text: failureMessage(null), retry: message });
    } finally {
      window.clearTimeout(timer);
      setPending(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const latestBotMessage = messages.filter((m) => m.from === "bot").slice(-1)[0];
  const activeSuggestions =
    latestBotMessage?.suggestedFollowups && latestBotMessage.suggestedFollowups.length > 0
      ? latestBotMessage.suggestedFollowups
      : suggestions;

  return (
    <>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="FoodShare AI assistant"
          data-ui="chat-panel"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="fixed bottom-[calc(var(--float-bottom)+3.75rem)] right-4 z-50 flex h-[min(34rem,calc(100dvh-9rem))] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-card shadow-overlay md:right-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-primary-foreground/15 text-primary-foreground">
                <Sparkles aria-hidden className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-sm leading-tight">FoodShare Assistant</p>
                <p className="text-[11px] text-primary-soft">
                  {role ? `${role} Context Active` : "Verified Platform Knowledge"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
                className="grid size-8 place-items-center rounded hover:bg-primary-hover"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={close}
                title="Close assistant"
                aria-label="Close assistant"
                className="grid size-8 place-items-center rounded hover:bg-primary-hover"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>

          {/* Subheader info strip */}
          <div className="border-b border-line bg-muted px-4 py-1.5 text-xs text-ink-muted"> {/* taste-skill-ignore */}
            Official platform guidance. For state-changing actions, use direct dashboard actions.
          </div>

          {/* Message Log */}
          <div
            ref={logRef}
            role="log"
            aria-label="Conversation"
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "group relative max-w-[88%] rounded-xl px-3.5 py-2.5",
                  m.from === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start border border-line bg-surface text-foreground"
                )}
              >
                <span className="sr-only">{m.from === "user" ? "You said: " : "Assistant said: "}</span>

                {m.from === "bot" ? (
                  <FormattedMessage content={m.text} />
                ) : (
                  <p className="whitespace-pre-line text-sm">{m.text}</p>
                )}

                {/* Sources Attribution */}
                {m.sources && m.sources.length > 0 ? (
                  <div className="mt-2 border-t border-line/60 pt-1.5 text-[11px] text-ink-muted"> {/* taste-skill-ignore */}
                    <span className="font-semibold">Source: </span>
                    {m.sources.map((s, i) => (
                      <span key={s.id}>
                        {s.title}
                        {i < (m.sources?.length ?? 0) - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Footer timestamp and copy action */}
                <div
                  className={cn(
                    "mt-1.5 flex items-center justify-between text-[10px]",
                    m.from === "user" ? "text-primary-soft justify-end" : "text-ink-muted"
                  )}
                >
                  <span>{m.timestamp}</span>

                  {m.from === "bot" ? (
                    <button
                      type="button"
                      onClick={() => void handleCopy(m.id, m.text)}
                      aria-label="Copy response"
                      className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted text-ink-muted"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check aria-hidden className="size-3 text-status-completed-bg" />
                          <span className="text-[10px] text-status-completed-bg">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy aria-hidden className="size-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}

            {/* Role-Aware Suggestion Chips */}
            {!pending && activeSuggestions.length > 0 ? (
              <div className="my-1 flex flex-wrap gap-1.5" aria-label="Suggested questions" role="group">
                {activeSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="cursor-pointer rounded-full border border-line bg-card px-3 py-1.5 text-left text-xs font-medium text-ink-soft hover:border-primary hover:bg-primary-soft hover:text-primary-soft-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Typing Indicator */}
            {pending ? (
              <div
                role="status"
                className="flex items-center gap-2 self-start rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs text-ink-soft"
              >
                <div className="flex gap-1.5 items-center">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:200ms] motion-reduce:animate-none" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:400ms] motion-reduce:animate-none" />
                </div>
                <span>Finding verified answer…</span>
              </div>
            ) : null}

            {/* Error Alert with Retry */}
            {failure ? (
              <div
                role="alert"
                className="self-start rounded-xl border border-destructive bg-destructive-soft p-3 text-xs"
              >
                <p className="font-medium text-destructive">{failure.text}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs"
                  onClick={() => void send(failure.retry, true)}
                >
                  <RotateCcw aria-hidden className="mr-1.5 size-3" />
                  Try again
                </Button>
              </div>
            ) : null}
          </div>

          {/* Input Form */}
          <form onSubmit={submit} className="flex items-end gap-2 border-t border-line bg-surface p-3"> {/* taste-skill-ignore */}
            <div className="min-w-0 flex-1">
              <label htmlFor={inputId} className="sr-only">
                Your message
              </label>
              <input
                ref={inputRef}
                id={inputId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_LENGTH}
                autoComplete="off"
                placeholder={role ? `Ask about ${role.toLowerCase()} tasks or rules…` : "Ask a question about FoodShare…"}
                className="block h-11 w-full min-w-0 rounded-lg border border-line bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {input.length > MAX_LENGTH - 80 ? (
                <p className="mt-1 text-[11px] text-muted-foreground">{MAX_LENGTH - input.length} characters left</p>
              ) : null}
            </div>
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={pending || input.trim() === ""}
              className="h-11 w-11 shrink-0"
            >
              <SendHorizontal aria-hidden className="size-5" />
            </Button>
          </form>
        </div>
      ) : null}

      {/* Floating Launcher Button */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="fixed bottom-[var(--float-bottom)] right-4 z-50 grid size-12 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-raised hover:bg-primary-hover md:right-6"
      >
        {open ? <X aria-hidden className="size-6" /> : <MessageCircle aria-hidden className="size-6" />}
      </button>
    </>
  );
}
