import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { Send, Bot, Zap, RefreshCw, Mic, User } from "lucide-react";
import { chatBridge, type ChatMessage } from "@/store/chatBridge";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

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

export default function Chat() {
  const bridge = useChatBridge();
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      try {
        const saved = localStorage.getItem("jarvis_chat_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((m: ChatMessage) => bridge.addMessage(m));
          }
        }
      } catch (e) {
        localStorage.removeItem("jarvis_chat_history");
      }
      setHasLoaded(true);
    }
  }, [bridge, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(
        "jarvis_chat_history",
        JSON.stringify(bridge.messages),
      );
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bridge.messages, hasLoaded]);

  const sendMessage = useCallback(
    async (text: string, source: "text" | "voice" = "text") => {
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

      try {
        // API KEY ka verification
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) throw new Error("API Key missing");

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: trimmed }] }],
            }),
          },
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const aiText =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response generated.";

        bridge.addMessage({
          id: Date.now() + 1,
          role: "ai",
          text: aiText,
          time: now(),
          source: "text",
          tone: bridge.toneProfile.dominantTone,
        });
      } catch (error) {
        console.error("Jarvis Error:", error);
        bridge.addMessage({
          id: Date.now() + 1,
          role: "ai",
          text: "Neural net connection failed. Please check your API key in Vercel settings.",
          time: now(),
          source: "text",
        });
      } finally {
        setTyping(false);
      }
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
      {/* UI Code... */}
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
