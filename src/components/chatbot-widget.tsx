import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Minimize2,
} from "lucide-react";
import { chatWithAssistant } from "@/lib/chat-server-fn";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ─── Quick suggestion chips ─────────────────────────────────────────────────

const SUGGESTIONS = [
  "How do I upload Aadhaar?",
  "How to renew passport?",
  "Link PAN with Aadhaar",
  "How does QR sharing work?",
  "What is Consistency Checker?",
  "Is my data secure?",
];

// ─── Markdown-lite renderer ─────────────────────────────────────────────────

function renderMessageContent(content: string) {
  // Split into lines and render with basic markdown support
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    let processed: React.ReactNode = line;

    // Bold text **text**
    if (line.includes("**")) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      processed = parts.map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} className="font-semibold">
            {part}
          </strong>
        ) : (
          part
        ),
      );
    }

    // Bullet points
    if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-emerald-400 flex-shrink-0">•</span>
          <span>{typeof processed === "string" ? processed.slice(2) : processed}</span>
        </div>,
      );
      return;
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-emerald-400 font-medium flex-shrink-0 text-xs bg-emerald-900/30 rounded-full w-5 h-5 flex items-center justify-center">
            {numMatch[1]}
          </span>
          <span>{typeof processed === "string" ? processed.replace(/^\d+\.\s/, "") : processed}</span>
        </div>,
      );
      return;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    // Regular line
    elements.push(
      <div key={i}>{processed}</div>,
    );
  });

  return <div className="space-y-1 leading-relaxed">{elements}</div>;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatWithAssistant({
        data: {
          message: text,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      const assistantMsg: ChatMessage = {
        id: response.id,
        role: "assistant",
        content: response.content,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Floating action button (collapsed state) ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="chatbot-fab"
        aria-label="Open AI Assistant"
        id="chatbot-fab"
      >
        <div className="chatbot-fab-inner">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className="chatbot-fab-ping" />

        {/* Tooltip */}
        <span className="chatbot-fab-tooltip">
          <Sparkles className="h-3 w-3" />
          AI Assistant
        </span>
      </button>
    );
  }

  // ── Chat panel ──
  return (
    <div
      className={`chatbot-panel ${isMinimized ? "chatbot-panel--minimized" : ""}`}
      id="chatbot-panel"
    >
      {/* ─── Header ─── */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <Bot className="h-5 w-5" />
            <div className="chatbot-avatar-pulse" />
          </div>
          <div>
            <h3 className="chatbot-title">Bharat ID Assistant</h3>
            <p className="chatbot-subtitle">
              <span className="chatbot-status-dot" />
              Always ready to help
            </p>
          </div>
        </div>
        <div className="chatbot-header-actions">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="chatbot-header-btn"
              title="Clear chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="chatbot-header-btn"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDown className="h-4 w-4 rotate-180" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="chatbot-header-btn"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Body (hidden when minimized) ─── */}
      {!isMinimized && (
        <>
          {/* ─── Messages ─── */}
          <div className="chatbot-messages" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              // Welcome state
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">
                  <Sparkles className="h-8 w-8 text-emerald-400" />
                </div>
                <h4 className="chatbot-welcome-title">
                  🙏 Namaste!
                </h4>
                <p className="chatbot-welcome-text">
                  I'm your Bharat ID AI Assistant. Ask me anything about your government IDs, documents, or procedures.
                </p>

                {/* Quick suggestions */}
                <div className="chatbot-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="chatbot-suggestion-chip"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat messages
              <div className="chatbot-message-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chatbot-message ${msg.role === "user" ? "chatbot-message--user" : "chatbot-message--assistant"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="chatbot-message-avatar">
                        <Bot className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={`chatbot-bubble ${msg.role === "user" ? "chatbot-bubble--user" : "chatbot-bubble--assistant"}`}
                    >
                      <div className="chatbot-bubble-content">
                        {msg.role === "assistant"
                          ? renderMessageContent(msg.content)
                          : msg.content}
                      </div>
                      <span className="chatbot-bubble-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    {msg.role === "user" && (
                      <div className="chatbot-message-avatar chatbot-message-avatar--user">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="chatbot-message chatbot-message--assistant">
                    <div className="chatbot-message-avatar">
                      <Bot className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="chatbot-bubble chatbot-bubble--assistant">
                      <div className="chatbot-typing">
                        <div className="chatbot-typing-dot" />
                        <div className="chatbot-typing-dot" />
                        <div className="chatbot-typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Input ─── */}
          <div className="chatbot-input-area">
            {messages.length > 0 && (
              <div className="chatbot-quick-row">
                {SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="chatbot-quick-chip"
                    disabled={isLoading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="chatbot-input-row">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                className="chatbot-input"
                disabled={isLoading}
                id="chatbot-input"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
                className="chatbot-send-btn"
                aria-label="Send message"
                id="chatbot-send-btn"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="chatbot-footer-text">
              Powered by Bharat ID AI • Your data stays secure
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatbotWidget;
