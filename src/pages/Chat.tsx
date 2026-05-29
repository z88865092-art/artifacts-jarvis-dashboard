import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { Send, Bot, Zap, RefreshCw, Copy, ThumbsUp, ThumbsDown, Mic, MicOff, User } from "lucide-react";
import { chatBridge, type ChatMessage } from "@/store/chatBridge";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// ── Tone-aware response engine ────────────────────────────────────────────────

const toneOpener: Record<string, string> = {
  casual:  "Yaar, ",
  urgent:  "Bhai, abhi — ",
  curious: "Dekho, ",
  calm:    "Theek hai, ",
  formal:  "Ji bilkul, ",
  default: "",
};

const baseResponses: Record<string, string> = {
  status:  "**System Status — All Systems:**\n\n- Core API: ✅ Online (4ms)\n- Auth: ✅ Online (8ms)\n- Data Pipeline: ⚠️ Recovering\n- ML Engine: ✅ Online (22ms)\n- Cache: ✅ Online (1ms)\n- Storage: ✅ Online\n\nOverall system health: **94%**",
  tasks:   "**Active Tasks:**\n1. Data Sync Protocol — 87% ⏳\n2. Security Audit Scan — 42% ⏳\n3. Neural Net Training — 63% ⏳\n\n**Completed Today:**\n- Cache Optimization ✅\n- Log Archival ✅",
  threat:  "**Threat Log (Last 24h):**\n\n- 18 threats blocked\n- 12x Port scan attempts (auto-blocked)\n- 4x Brute force attempts (IP banned)\n- 2x Suspicious API calls (flagged)\n\nAll threats neutralized. No breach detected.",
  memory:  "**Memory Optimization initiated...**\n\nFreed 840 MB by:\n- Clearing stale cache entries\n- Reducing ML batch buffer\n- Compressing log buffers\n\nNew usage: 5.4 GB / 7.6 GB (71%) ✅",
  default: "**Result:** Action completed successfully. All systems nominal.\n\nIs there anything else you'd like me to help with?",
};

function getResponse(text: string): string {
  const lower = text.toLowerCase();
  const tone  = chatBridge.toneProfile.dominantTone;
  const opener = toneOpener[tone] ?? "";

  let base: string;
  if (lower.includes("status"))                         base = baseResponses.status;
  else if (lower.includes("task"))                      base = baseResponses.tasks;
  else if (lower.includes("threat") || lower.includes("security")) base = baseResponses.threat;
  else if (lower.includes("memory") || lower.includes("optimize"))  base = baseResponses.memory;
  else                                                  base = baseResponses.default;

  // Prepend tone opener only to the first line
  const [firstLine, ...rest] = base.split("\n");
  return opener + firstLine + (rest.length ? "\n" + rest.join("\n") : "");
}

// ── useChatBridge: subscribe to store with zero flicker ──────────────────────
function useChatBridge() {
  const [, rerender] = useReducer(n => n + 1, 0);
  useEffect(() => chatBridge.subscribe(rerender), []);
  return chatBridge;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

function formatText(text: string) {
  return text.split("\n").map((line, i, arr) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong class="text-primary">${m}</strong>`);
    return <span key={i} dangerouslySetInnerHTML={{ __html: html + (i < arr.length - 1 ? "<br/>" : "") }} />;
  });
}

const quickPrompts = ["Show system status", "List all running tasks", "Check threat log", "Optimize memory usage"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Chat() {
  const bridge          = useChatBridge();
  const [typing,        setTyping]    = useState(false);
  const [input,         setInput]     = useState("");
  const [copiedId,      setCopiedId]  = useState<number | null>(null);
  const bottomRef       = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages or typing changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bridge.messages.length, typing]);

  // ── Core send logic ───────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string, source: "text" | "voice" = "text") => {
    const trimmed = text.trim();
    if (!trimmed) return;

    bridge.addMessage({ id: Date.now(), role: "user", text: trimmed, time: now(), source });
    setInput("");
    setTyping(true);

    const delay = 900 + Math.random() * 700;
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
    }, delay);
  }, [bridge]);

  // ── Consume pending voice transcript from VoiceTone ───────────────────────
  useEffect(() => {
    const transcript = bridge.pendingTranscript;
    if (!transcript) return;
    bridge.clearPendingTranscript();
    // Small delay so the route transition settles before processing
    const t = setTimeout(() => sendMessage(transcript, "voice"), 120);
    return () => clearTimeout(t);
  }, [bridge.pendingTranscript, bridge, sendMessage]);

  // ── In-chat voice input ───────────────────────────────────────────────────
  const speech = useSpeechRecognition({
    lang: bridge.toneProfile.language as "ur-PK" | "hi-IN" | "en-US",
    interimResults: true,
    onFinalResult: (transcript) => {
      sendMessage(transcript, "voice");
    },
  });

  // Mirror interim transcript into the textarea for visual feedback
  useEffect(() => {
    if (speech.interimTranscript) setInput(speech.interimTranscript);
    else if (speech.status === "idle" && !speech.finalTranscript) setInput(prev => prev);
  }, [speech.interimTranscript, speech.status, speech.finalTranscript]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  function copyMsg(id: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const micListening = speech.status === "listening";

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="hex-border rounded-xl bg-card px-4 py-3 flex items-center gap-3 mb-4 shrink-0">
        <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center glow-ring">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">JARVIS AI</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-mono">
              Online · Tone: <span className="text-primary capitalize">{bridge.toneProfile.dominantTone}</span>
              {" "}· {bridge.toneProfile.language}
            </span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-muted-foreground hover:text-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {bridge.messages.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex gap-3 slide-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
              msg.role === "ai" ? "border-primary/50 bg-primary/10" : "border-border bg-secondary"
            }`}>
              {msg.role === "ai"
                ? <Zap className="w-3.5 h-3.5 text-primary" />
                : <User className="w-3.5 h-3.5 text-muted-foreground" />
              }
            </div>

            {/* Bubble */}
            <div className={`group max-w-[78%] flex flex-col space-y-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "ai" ? "chat-bubble-ai" : "chat-bubble-user"
              }`}>
                <p className="text-foreground">{formatText(msg.text)}</p>
              </div>

              <div className={`flex items-center gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <span className="text-[10px] text-muted-foreground font-mono">{msg.time}</span>

                {/* Voice badge */}
                {msg.source === "voice" && (
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-primary/25 bg-primary/8 text-primary/70 flex items-center gap-0.5">
                    <Mic className="w-2.5 h-2.5" /> voice
                  </span>
                )}

                {/* AI actions */}
                {msg.role === "ai" && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copyMsg(msg.id, msg.text)} className="text-muted-foreground hover:text-primary transition-colors" title="Copy">
                      <Copy className="w-3 h-3" />
                    </button>
                    {copiedId === msg.id && <span className="text-[9px] text-green-400 font-mono">Copied!</span>}
                    <button className="text-muted-foreground hover:text-green-400 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                    <button className="text-muted-foreground hover:text-red-400 transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-3 slide-up">
            <div className="w-7 h-7 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="chat-bubble-ai rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1 font-mono">Processing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick prompts ── */}
      <div className="flex gap-2 mt-4 flex-wrap shrink-0">
        {quickPrompts.map(p => (
          <button key={p} onClick={() => sendMessage(p)}
            className="text-[11px] px-3 py-1.5 rounded-md border border-primary/25 text-primary/80 hover:border-primary/50 hover:text-primary bg-primary/5 hover:bg-primary/10 transition-all font-mono">
            {p}
          </button>
        ))}
      </div>

      {/* ── Input bar ── */}
      <div className={`mt-3 hex-border rounded-xl bg-card flex items-end gap-2 p-3 shrink-0 transition-colors ${
        micListening ? "border-red-400/40 shadow-[0_0_12px_hsl(0_84%_60%_/0.15)]" : ""
      }`}>
        {/* Mic button */}
        <button
          onClick={micListening ? speech.stop : speech.start}
          disabled={speech.status === "unsupported"}
          title={micListening ? "Stop recording" : "Record voice"}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30 ${
            micListening
              ? "bg-red-400/20 border border-red-400/40 text-red-400"
              : "bg-muted text-muted-foreground hover:text-primary hover:bg-primary/15 border border-border"
          }`}
        >
          {micListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={micListening ? "Bol do — sun raha hoon..." : "Send a command to JARVIS..."}
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none font-mono max-h-32 py-1"
          style={{ lineHeight: "1.5" }}
        />

        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || typing || micListening}
          className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-30 transition-all glow-ring"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-2 font-mono shrink-0">
        Enter to send · Shift+Enter for newline · Mic for voice
      </p>
    </div>
  );
}
