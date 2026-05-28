// ── chatBridge — module-level singleton, zero React deps ─────────────────────
// Shared between Chat and VoiceTone without a context provider.
// Components subscribe via useChatBridge() and re-render only on store updates.

export interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
  time: string;
  source?: "voice" | "text";
  tone?: string;
}

export interface ToneProfile {
  dominantTone: string;
  formality: number;
  energy: number;
  language: string;
}

type Listener = () => void;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1, role: "ai", source: "text",
    text: "Hello. I'm JARVIS — your Just A Rather Very Intelligent System. All core modules are online. How can I assist you today?",
    time: "09:00:01",
  },
  {
    id: 2, role: "user", source: "text",
    text: "Run a full diagnostic on all systems and give me a summary.",
    time: "09:00:45",
  },
  {
    id: 3, role: "ai", source: "text",
    text: "Initiating full diagnostic sweep...\n\n**System Report — 2026-05-28**\n\n- Core API: ✅ Online (4ms)\n- Auth Service: ✅ Online (8ms)\n- Data Pipeline: ⚠️ Degraded — high load at 91%\n- ML Engine: ✅ Online (22ms)\n- Cache Layer: ✅ Online (1ms)\n\n**Recommendation:** The Data Pipeline load spike is unusual. I suggest clearing the batch queue and restarting the worker pool. Shall I proceed?",
    time: "09:00:47",
  },
  {
    id: 4, role: "user", source: "text",
    text: "Yes, proceed with queue flush. Also check memory usage.",
    time: "09:02:10",
  },
  {
    id: 5, role: "ai", source: "text",
    text: "Executing queue flush on Data Pipeline... done. Worker pool restarted (3/3 workers healthy).\n\n**Memory Report:**\n- Total: 7.6 GB\n- Used: 6.2 GB (82%)\n- Cached: 1.1 GB\n- Free: 1.4 GB\n\nMemory usage is elevated. I recommend reviewing the ML Engine's inference batch size. Would you like me to auto-tune the configuration?",
    time: "09:02:14",
  },
];

const DEFAULT_TONE: ToneProfile = {
  dominantTone: "casual",
  formality: 30,
  energy: 70,
  language: "ur-PK",
};

class ChatBridgeStore {
  private _messages: ChatMessage[]     = [...INITIAL_MESSAGES];
  private _tone: ToneProfile           = { ...DEFAULT_TONE };
  private _pendingTranscript: string   = "";
  private _listeners                   = new Set<Listener>();

  // ── Subscriptions ─────────────────────────────────────────────────────────
  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  private notify() { this._listeners.forEach(fn => fn()); }

  // ── Messages ──────────────────────────────────────────────────────────────
  get messages()   { return this._messages; }

  addMessage(msg: ChatMessage) {
    this._messages = [...this._messages, msg];
    this.notify();
  }

  // ── Tone profile ──────────────────────────────────────────────────────────
  get toneProfile() { return this._tone; }

  updateTone(patch: Partial<ToneProfile>) {
    this._tone = { ...this._tone, ...patch };
    this.notify();
  }

  // ── Voice → Chat pipeline ─────────────────────────────────────────────────
  get pendingTranscript() { return this._pendingTranscript; }

  /** Called by VoiceTone when a transcript is ready to be sent to Chat. */
  sendVoiceTranscript(text: string) {
    this._pendingTranscript = text.trim();
    this.notify();
  }

  /** Called by Chat after consuming the pending transcript. */
  clearPendingTranscript() {
    this._pendingTranscript = "";
    // no notify needed — Chat already consumed it
  }
}

export const chatBridge = new ChatBridgeStore();
