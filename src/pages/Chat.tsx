import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import {
  Send,
  Bot,
  Zap,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  User,
} from "lucide-react";
import { chatBridge, type ChatMessage } from "@/store/chatBridge";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// ── Tone-aware response engine ────────────────────────────────────────────────
const toneOpener: Record<string, string> = {
  casual: "Yaar, ",
  urgent: "Bhai, abhi — ",
  curious: "Dekho, ",
  calm: "Theek hai, ",
  formal: "Ji bilkul, ",
  default: "",
};

const baseResponses: Record<string, string> = {
  status:
    "**System Status — All Systems:**\n\n- Core API: ✅ Online (4ms)\n- Auth: ✅ Online (8ms)\n- Data Pipeline: ⚠️ Recovering\n- ML Engine: ✅ Online (22ms)\n- Cache: ✅ Online (1ms)\n- Storage: ✅ Online\n\nOverall system health: **94%**",
  tasks:
    "**Active Tasks:**\n1. Data Sync Protocol — 87% ⏳\n2. Security Audit Scan — 42% ⏳\n3. Neural Net Training — 63% ⏳\n\n**Completed Today:**\n- Cache Optimization ✅\n- Log Archival ✅",
  threat:
    "**Threat Log (Last 24h):**\n\n- 18 threats blocked\n- 12x Port scan attempts (auto-blocked)\n- 4x Brute force attempts (IP banned)\n- 2x Suspicious API calls (flagged)\n\nAll threats neutralized. No breach detected.",
  memory:
    "**Memory Optimization initiated...**\n\nFreed 840 MB by:\n- Clearing stale cache entries\n- Reducing ML batch buffer\n- Compressing log buffers\n\nNew usage: 5.4 GB / 7.6 GB (71%) ✅",
  default:
    "**Result:** Action completed successfully. All systems nominal.\n\nIs there anything else you'd like me to help with?",
};

function getResponse(text: string): string {
  const lower = text.toLowerCase();
  const tone = chatBridge.toneProfile.dominantTone;
  const opener = toneOpener[tone] ?? "";
  let base: string;
  if (lower.includes("status")) base = baseResponses.status;
  else if (lower.includes("task")) base = baseResponses.tasks;
  else if (lower.includes("threat") || lower.includes("security"))
    base = baseResponses.threat;
  else if (lower.includes("memory") || lower.includes("optimize"))
    base = baseResponses.memory;
  else base = baseResponses.default;

  const [firstLine, ...rest] = base.split("\n");
  return opener + firstLine + (rest.length ? "\n" + rest.join("\n") : "");
}

function useChatBridge() {
  const [, rerender] = useReducer((n) => n + 1, 0);
  useEffect(() => chatBridge.subscribe(rerender), []);
  return chatBridge;
}

const now = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

function formatText(text: string) {
  return text.split("\n").map((line, i, arr) => {
    const html = line.replace(
      /\*\*(.*?)\*\*/g,
      (_, m) => `<strong class="text-primary">${m}</strong>`,
    );
    return (
      <span
        key={i}
        dangerouslySetInnerHTML={{
          __html: html + (i < arr.length - 1 ? "<br/>" : ""),
        }}
      />
    );
  });
}

const quickPrompts = [
  "Show system status",
  "List all running tasks",
  "Check threat log",
  "Optimize memory usage",
];

export default function Chat() {
  const bridge = useChatBridge();
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persistence: Load chat on startup
  useEffect(() => {
    const saved = localStorage.getItem("jarvis_chat_history");
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.forEach((m: ChatMessage) => bridge.addMessage(m));
    }
  }, []);

  // Persistence: Save chat whenever messages change
  useEffect(() => {
    localStorage.setItem(
      "jarvis_chat_history",
      JSON.stringify(bridge.messages),
    );
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bridge.messages]);

  const sendMessage = useCallback(
    (text: string, source: "text" | "voice" = "text") => {
      const trimmed = text.trim();
      if (!trimmed) return;

      bridge.addMessage({
        id: Date.now(),
        role: "user",
        text: trimmed,
        time: now(),
        source,
      });
      setInput("");
      setTyping(true);

      setTimeout(() => {
        bridge.addMessage({
          id: Date.now() + 1,
          role: "ai",
          text: getResponse(trimmed),
          time: now(),
          source: "text",
          tone: bridge.toneProfile.dominantTone,
        });
        setTyping(false);
      }, 900);
    },
    [bridge],
  );

  const speech = useSpeechRecognition({
    lang: bridge.toneProfile.language as "ur-PK" | "hi-IN" | "en-US",
    interimResults: true,
    onFinalResult: (transcript) => sendMessage(transcript, "voice"),
  });

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="hex-border rounded-xl bg-card px-4 py-3 flex items-center gap-3 mb-4 shrink-0">
        <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center glow-ring">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">JARVIS AI</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-mono">
              Online · Tone:{" "}
              <span className="text-primary capitalize">
                {bridge.toneProfile.dominantTone}
              </span>
            </span>
          </div>
        </div>
        <button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {bridge.messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className="w-7 h-7 rounded-full border border-border bg-secondary flex items-center justify-center mt-1">
              {msg.role === "ai" ? (
                <Zap className="w-3.5 h-3.5 text-primary" />
              ) : (
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="max-w-[78%] rounded-xl px-4 py-3 text-sm chat-bubble-ai">
              <p>{formatText(msg.text)}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="text-primary text-xs font-mono ml-10">
            Jarvis is thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-3 hex-border rounded-xl bg-card flex items-center gap-2 p-3 shrink-0">
        <button
          onClick={speech.status === "listening" ? speech.stop : speech.start}
          className="p-2 bg-muted rounded-lg"
        >
          <Mic
            className={`w-4 h-4 ${speech.status === "listening" ? "text-red-400" : ""}`}
          />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !e.shiftKey &&
            (e.preventDefault(), sendMessage(input))
          }
          placeholder="Send a command to JARVIS..."
          className="flex-1 bg-transparent text-sm outline-none resize-none"
          rows={1}
        />
        <button
          onClick={() => sendMessage(input)}
          className="p-2 bg-primary text-primary-foreground rounded-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
