import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Mic, MicOff, Brain, Sliders, Play,
  TrendingUp, ChevronRight, RefreshCw, Volume2, Sparkles,
  BarChart3, MessageSquare, AlertCircle, CheckCircle, WifiOff,
  ArrowRight,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { chatBridge } from "@/store/chatBridge";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToneSample {
  id: number;
  text: string;
  tone: string;
  toneLabel: string;
  formality: number;
  energy: number;
  confidence: number;
  source: "mic" | "text";
  timestamp: string;
}

interface LearningMetric {
  label: string;
  value: number;
  color: string;
}

type ActiveTab = "learn" | "mirror" | "metrics";

// ── Constants ─────────────────────────────────────────────────────────────────

const SAMPLE_PHRASES = [
  "Yaar, system status kya hai abhi?",
  "Bhai, security scan complete hua ya nahi?",
  "Theek hai, data sync chal raha hai.",
  "Kyun itna slow hai ye process?",
];

const AI_MIRROR: Record<string, string> = {
  urgent:  "Bhai, abhi dekha! System 87% load pe hai — worker pool restart karna chahiye. Karo kya?",
  casual:  "Yaar, main check karta hoon — ek second! Sab kuch scan ho raha hai, jaldi bata deta hoon. Chill!",
  curious: "Achha sawal hai! Ye issue teen wajohaat se ho sakta hai. Pehle logs check karte hain...",
  calm:    "Theek hai, koi baat nahi. Dhire dhire sab sort ho jayega. Main monitor kar raha hoon.",
  formal:  "Ji zaroor. Aapki request process ho rahi hai. Natija jald pesh karunga.",
  default: "Samjha, main process kar raha hoon. Aapke andaz ke mutabiq jawab tayaar hai — thodi dair mein!",
};

// ── Tone detection ────────────────────────────────────────────────────────────

function detectTone(text: string): { tone: string; toneLabel: string; formality: number; energy: number } {
  const t = text.toLowerCase();
  const hasCasual  = /yaar|bhai|bc|jaldi|abhi|!/.test(t);
  const hasUrgent  = /jaldi|urgent|abhi|fast|slow|!!/.test(t);
  const hasQ       = /\?|kya|kyun|kaisa|kaise|kab|kahan/.test(t);
  const hasCalm    = /theek|ok|achha|shukriya|thanks/.test(t);
  const hasFormal  = /please|kindly|zaroor|meherbani/.test(t);

  if (hasUrgent && hasCasual) return { tone: "urgent",  toneLabel: "Urgent / Demanding",   formality: 12, energy: 94 };
  if (hasCasual && hasQ)      return { tone: "curious", toneLabel: "Casual / Curious",      formality: 22, energy: 70 };
  if (hasCasual)              return { tone: "casual",  toneLabel: "Casual / Energetic",    formality: 18, energy: 80 };
  if (hasQ)                   return { tone: "curious", toneLabel: "Curious / Analytical",  formality: 50, energy: 58 };
  if (hasCalm)                return { tone: "calm",    toneLabel: "Calm / Approving",      formality: 42, energy: 38 };
  if (hasFormal)              return { tone: "formal",  toneLabel: "Formal / Polite",       formality: 75, energy: 40 };
  return                             { tone: "default", toneLabel: "Neutral / Informational",formality: 55, energy: 50 };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AudioWaveform({ level, active, seed = 0 }: { level: number; active: boolean; seed?: number }) {
  const bars = 36;
  return (
    <div className="flex items-center justify-center gap-[2px] h-12 w-full">
      {Array.from({ length: bars }).map((_, i) => {
        const center  = Math.abs((i / bars) - 0.5);
        const base    = (1 - center * 1.4) * 8;
        const animated = active
          ? base + (level / 100) * 28 * Math.abs(Math.sin((i + seed) * 0.9))
          : 3;
        return (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "2px",
              height: `${Math.max(3, animated)}px`,
              background: active ? `hsl(195 100% ${45 + (i % 4) * 5}%)` : "hsl(210 30% 20%)",
              opacity: active ? 0.65 + (i % 3) * 0.1 : 0.35,
              transition: active ? "height 80ms ease-out" : "height 400ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct   = Math.round(value * 100);
  const color = pct >= 80
    ? "text-green-400 border-green-400/30 bg-green-400/10"
    : pct >= 55
    ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
    : "text-red-400 border-red-400/30 bg-red-400/10";
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${color}`}>
      {pct}% confident
    </span>
  );
}

function MetricBar({ label, value, color }: LearningMetric) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
    </div>
  );
}

// ── Initial demo samples ──────────────────────────────────────────────────────

const INITIAL_SAMPLES: ToneSample[] = [
  { id: 1, text: "Yaar, ye system bilkul slow hai!", tone: "urgent",  toneLabel: "Urgent / Demanding", formality: 12, energy: 94, confidence: 0.91, source: "text", timestamp: "10:02:14" },
  { id: 2, text: "Bhai, kya security scan complete hua?", tone: "curious", toneLabel: "Casual / Curious",  formality: 25, energy: 72, confidence: 0.87, source: "text", timestamp: "10:05:33" },
  { id: 3, text: "Theek hai, data sync chal raha hai.", tone: "calm",   toneLabel: "Calm / Approving",  formality: 40, energy: 38, confidence: 0.93, source: "text", timestamp: "10:11:08" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function VoiceTone() {
  const [, navigate]      = useLocation();
  const [samples,         setSamples]         = useState<ToneSample[]>(INITIAL_SAMPLES);
  const [textInput,       setTextInput]       = useState("");
  const [activeTab,       setActiveTab]       = useState<ActiveTab>("learn");
  const [mirrorInput,     setMirrorInput]     = useState("");
  const [mirrorOutput,    setMirrorOutput]    = useState("");
  const [mirrorLoading,   setMirrorLoading]   = useState(false);
  const [learningProgress,setLearningProgress]= useState(67);
  const [lang,            setLang]            = useState<"ur-PK" | "hi-IN" | "en-US">("ur-PK");
  const [waveformTick,    setWaveformTick]    = useState(0);
  const [errorMsg,        setErrorMsg]        = useState("");
  const [lastVoiceText,   setLastVoiceText]   = useState("");

  // Waveform animation tick (every 80 ms)
  useEffect(() => {
    const t = setInterval(() => setWaveformTick(n => n + 1), 80);
    return () => clearInterval(t);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const toneFingerprint = {
    formality: Math.round(samples.reduce((s, t) => s + t.formality, 0) / samples.length),
    energy:    Math.round(samples.reduce((s, t) => s + t.energy, 0) / samples.length),
  };

  const metrics: LearningMetric[] = [
    { label: "Urdu/Hindi Casual Blend",  value: Math.min(99, 76 + samples.filter(s => s.tone === "casual" || s.tone === "urgent").length * 2), color: "hsl(195 100% 50%)" },
    { label: "Direct Command Style",     value: Math.min(99, 68 + samples.filter(s => s.tone === "urgent").length * 3),  color: "hsl(160 80% 45%)" },
    { label: "Impatience Pattern",       value: Math.min(99, 60 + samples.filter(s => s.energy > 75).length * 3),        color: "hsl(35 90% 55%)" },
    { label: "Technical Vocabulary",     value: 91,                                                                        color: "hsl(270 80% 65%)" },
    { label: "Informal Contractions",    value: Math.min(99, 72 + samples.length),                                        color: "hsl(195 80% 60%)" },
    { label: "Question Frequency",       value: Math.min(99, 78 + samples.filter(s => s.tone === "curious").length * 2), color: "hsl(0 80% 65%)" },
  ];

  // ── Mirror helper ─────────────────────────────────────────────────────────
  const triggerMirror = useCallback((text: string) => {
    const { tone } = detectTone(text);
    setMirrorOutput("");
    setMirrorLoading(true);
    const response = AI_MIRROR[tone] ?? AI_MIRROR.default;
    setTimeout(() => {
      setMirrorLoading(false);
      let i = 0;
      const iv = setInterval(() => {
        setMirrorOutput(response.slice(0, i));
        i++;
        if (i > response.length) clearInterval(iv);
      }, 18);
    }, 700);
  }, []);

  // ── Speech callbacks ──────────────────────────────────────────────────────
  const handleFinalTranscript = useCallback((text: string, conf: number) => {
    const { tone, toneLabel, formality, energy } = detectTone(text);
    const sample: ToneSample = {
      id: Date.now(), text, tone, toneLabel, formality, energy,
      confidence: conf > 0 ? conf : 0.72,
      source: "mic",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    };
    setSamples(prev => [sample, ...prev.slice(0, 14)]);
    setLearningProgress(prev => Math.min(98, prev + 2));
    setLastVoiceText(text);
    // Sync learned tone profile into the shared bridge so Chat inherits it
    chatBridge.updateTone({ dominantTone: tone, formality, energy, language: lang });
    if (activeTab === "mirror") {
      setMirrorInput(text);
      triggerMirror(text);
    }
  }, [activeTab, triggerMirror, lang]);

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  }, []);

  const speech = useSpeechRecognition({
    lang,
    continuous: false,
    interimResults: true,
    onFinalResult: handleFinalTranscript,
    onError: handleError,
  });

  // ── Text sample ───────────────────────────────────────────────────────────
  function addTextSample() {
    if (!textInput.trim()) return;
    const { tone, toneLabel, formality, energy } = detectTone(textInput);
    const sample: ToneSample = {
      id: Date.now(), text: textInput.trim(), tone, toneLabel, formality, energy,
      confidence: 1, source: "text",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    };
    setSamples(prev => [sample, ...prev.slice(0, 14)]);
    setLearningProgress(prev => Math.min(98, prev + 1));
    setTextInput("");
  }

  // ── Status label / color ──────────────────────────────────────────────────
  const statusLabel: Record<typeof speech.status, string> = {
    idle:        "Mic ready — click to start",
    listening:   "Sun raha hoon...",
    processing:  "Analyze ho raha hai...",
    error:       "Error — dobara try karo",
    unsupported: "Browser supported nahi",
  };
  const statusColor: Record<typeof speech.status, string> = {
    idle:        "text-muted-foreground",
    listening:   "text-primary",
    processing:  "text-yellow-400",
    error:       "text-red-400",
    unsupported: "text-red-400",
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Voice &amp; Tone Module</h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            AI tumhari awaaz, intonation aur andaz seekhta hai — phir usi tarah jawab deta hai
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={e => setLang(e.target.value as typeof lang)}
            className="bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground font-mono outline-none focus:border-primary/50 transition-colors"
          >
            <option value="ur-PK">اردو (ur-PK)</option>
            <option value="hi-IN">हिंदी (hi-IN)</option>
            <option value="en-US">English (en-US)</option>
          </select>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-mono">{learningProgress}% Learned</span>
          </div>
        </div>
      </div>

      {/* ── Unsupported banner ── */}
      {speech.status === "unsupported" && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-red-400/30 bg-red-400/10 slide-up">
          <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">
            Tumhara browser Web Speech API support nahi karta. Chrome ya Edge use karo best results ke liye.
          </p>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="hex-border rounded-xl bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Tone Learning Progress</span>
          <span className="text-xs font-mono text-primary">{learningProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${learningProgress}%`,
              background: "linear-gradient(90deg, hsl(195 100% 50%), hsl(270 80% 65%))",
              boxShadow: "0 0 10px hsl(195 100% 50% / 0.45)",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>{samples.length} samples · Formality {toneFingerprint.formality}% · Energy {toneFingerprint.energy}%</span>
          <span>{100 - learningProgress}% remaining</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
        {([
          { id: "learn",   label: "Tone Learning", icon: Brain },
          { id: "mirror",  label: "AI Mirror",     icon: MessageSquare },
          { id: "metrics", label: "Metrics",        icon: BarChart3 },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-card text-primary border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB: Tone Learning
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "learn" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Voice input card ── */}
          <div className="hex-border rounded-xl bg-card p-5 space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">
              Voice Input (Live Speech)
            </h3>

            {/* Waveform */}
            <div className="bg-muted/30 rounded-xl px-3 py-2 border border-border">
              <AudioWaveform level={speech.audioLevel} active={speech.status === "listening"} seed={waveformTick} />
            </div>

            {/* Mic button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={speech.status === "listening" ? speech.stop : speech.start}
                disabled={speech.status === "unsupported"}
                className={`relative rounded-full border-2 flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                  speech.status === "listening"
                    ? "border-red-400 bg-red-400/15 shadow-[0_0_28px_hsl(0_84%_60%_/0.45)]"
                    : "border-primary/50 bg-primary/10 hover:border-primary hover:bg-primary/15 glow-ring"
                }`}
                style={{ width: "72px", height: "72px" }}
              >
                {speech.status === "listening"
                  ? <MicOff className="w-7 h-7 text-red-400" />
                  : <Mic className="w-7 h-7 text-primary" />
                }
                {speech.status === "listening" && (
                  <span className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" />
                )}
              </button>

              <p className={`text-[11px] font-mono ${statusColor[speech.status]}`}>
                {statusLabel[speech.status]}
              </p>

              {/* Live audio level bar */}
              {speech.status === "listening" && (
                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${speech.audioLevel}%`,
                      background: "hsl(195 100% 50%)",
                      boxShadow: "0 0 8px hsl(195 100% 50% / 0.6)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Live transcript */}
            <div className="min-h-[60px] bg-muted/30 rounded-lg border border-border p-3">
              {speech.finalTranscript || speech.interimTranscript ? (
                <p className="text-sm text-foreground leading-relaxed font-mono">
                  {speech.finalTranscript}
                  <span className="text-muted-foreground italic">{speech.interimTranscript}</span>
                  {speech.status === "listening" && <span className="cursor-blink" />}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground font-mono italic">
                  {speech.status === "listening" ? "Bol do..." : "Transcript yahan dikhega..."}
                </p>
              )}
            </div>

            {/* Confidence */}
            {speech.confidence > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-[11px] text-muted-foreground font-mono">Last result:</span>
                <ConfidencePill value={speech.confidence} />
              </div>
            )}

            {/* Error */}
            {(errorMsg || speech.status === "error") && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-400/10 border border-red-400/25">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-[11px] text-red-300 font-mono">{errorMsg || "Recognition error."}</p>
              </div>
            )}

            {/* Send to Chat — appears after a voice transcript is captured */}
            {lastVoiceText && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/8 slide-up">
                <Mic className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-[11px] text-primary font-mono flex-1 truncate">"{lastVoiceText}"</p>
                <button
                  onClick={() => {
                    chatBridge.sendVoiceTranscript(lastVoiceText);
                    navigate("/chat");
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
                >
                  Chat mein bhejo <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Sample phrases */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Sample phrases try karo:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PHRASES.map(p => (
                  <button
                    key={p}
                    onClick={() => setTextInput(p)}
                    className="text-[10px] px-2 py-1 rounded-md border border-primary/20 text-primary/70 hover:border-primary/40 hover:text-primary bg-primary/5 hover:bg-primary/10 transition-all font-mono"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Text fallback */}
            <div className="border-t border-border pt-3 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTextSample()}
                placeholder="Ya text type karo..."
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors font-mono"
              />
              <button
                onClick={addTextSample}
                disabled={!textInput.trim()}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono hover:opacity-90 disabled:opacity-30 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* ── Samples history ── */}
          <div className="hex-border rounded-xl bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Learned Samples</h3>
              <span className="text-[10px] font-mono text-muted-foreground">{samples.length} total</span>
            </div>
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {samples.map(sample => (
                <div key={sample.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 slide-up">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {sample.source === "mic"
                        ? <Mic className="w-3 h-3 text-primary" />
                        : <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      }
                    </div>
                    <p className="text-xs text-foreground leading-relaxed flex-1">"{sample.text}"</p>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{sample.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                      {sample.toneLabel}
                    </span>
                    {sample.source === "mic" && <ConfidencePill value={sample.confidence} />}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[9px] font-mono text-muted-foreground">Formal {sample.formality}%</p>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${sample.formality}%` }} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[9px] font-mono text-muted-foreground">Energy {sample.energy}%</p>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${sample.energy}%`, background: "hsl(35 90% 55%)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: AI Mirror
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "mirror" && (
        <div className="hex-border rounded-xl bg-card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Mirror Mode</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary ml-auto">
              VOICE ACTIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mic se bolo ya text likho — JARVIS tumhare seekhe hue andaz mein jawab dega.
            Active style: <strong className="text-primary">Casual + Direct + Urdu-Hindi blend</strong>.
            Tone Learning tab pe bola hua input yahan automatically mirror hota hai.
          </p>

          {/* Tone profile pills */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Dominant Tone", value: samples[0]?.toneLabel.split("/")[0]?.trim() ?? "Casual", color: "text-primary" },
              { label: "Language Mix",  value: lang === "ur-PK" ? "Urdu-Hindi" : lang === "hi-IN" ? "Hindi" : "English", color: "text-chart-2" },
              { label: "Avg Energy",    value: `${toneFingerprint.energy}%`, color: "text-yellow-400" },
            ].map(p => (
              <div key={p.label} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                <p className={`text-sm font-bold font-mono truncate ${p.color}`}>{p.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.label}</p>
              </div>
            ))}
          </div>

          {/* Voice → Mirror section */}
          <div className="bg-muted/30 rounded-xl border border-border px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Voice → Mirror</p>
              <span className={`text-[10px] font-mono ${statusColor[speech.status]}`}>
                {statusLabel[speech.status]}
              </span>
            </div>
            <AudioWaveform level={speech.audioLevel} active={speech.status === "listening"} seed={waveformTick + 500} />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={speech.status === "listening" ? speech.stop : speech.start}
                disabled={speech.status === "unsupported"}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
                  speech.status === "listening"
                    ? "bg-red-400/20 border border-red-400/40 text-red-400"
                    : "bg-primary/15 border border-primary/35 text-primary hover:bg-primary/25"
                }`}
              >
                {speech.status === "listening"
                  ? <><MicOff className="w-3.5 h-3.5" /> Stop Recording</>
                  : <><Mic className="w-3.5 h-3.5" /> Record Voice</>
                }
              </button>
              {speech.finalTranscript && (
                <p className="text-xs text-foreground font-mono flex-1 truncate">"{speech.finalTranscript}"</p>
              )}
            </div>
          </div>

          {/* Text input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={mirrorInput}
              onChange={e => setMirrorInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && mirrorInput.trim()) { triggerMirror(mirrorInput); } }}
              placeholder="Ya yahan type karo..."
              className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors font-mono"
            />
            <button
              onClick={() => mirrorInput.trim() && triggerMirror(mirrorInput)}
              disabled={!mirrorInput.trim() || mirrorLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-30 transition-all glow-ring"
            >
              {mirrorLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Mirror
            </button>
          </div>

          {/* Mirror output */}
          {(mirrorOutput || mirrorLoading) && (
            <div className="chat-bubble-ai rounded-xl p-4 space-y-2 slide-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center">
                  <Volume2 className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">JARVIS · Tumhara Andaz</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono ml-auto">
                  MIRRORED
                </span>
              </div>
              {mirrorLoading
                ? (
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )
                : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {mirrorOutput}
                    {mirrorOutput.length > 0 && mirrorOutput.length < 120 && <span className="cursor-blink" />}
                  </p>
                )
              }
            </div>
          )}

          {/* Open in Chat — after mirror output */}
          {mirrorOutput && (
            <div className="flex items-center justify-between gap-3 px-1 slide-up">
              <p className="text-[10px] text-muted-foreground font-mono">
                Tone synced to Chat: <span className="text-primary capitalize">{chatBridge.toneProfile.dominantTone}</span>
              </p>
              <button
                onClick={() => {
                  if (mirrorInput.trim()) chatBridge.sendVoiceTranscript(mirrorInput);
                  navigate("/chat");
                }}
                className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/35 text-primary hover:bg-primary/25 transition-all shrink-0"
              >
                Chat mein kholo <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick prompts */}
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Quick test:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Yaar, system status batao!",
                "Bhai, koi issue hai kya?",
                "Please check kar lo.",
                "Kyun itna slow hai?",
              ].map(p => (
                <button
                  key={p}
                  onClick={() => { setMirrorInput(p); triggerMirror(p); }}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-primary/20 text-primary/70 hover:border-primary/40 hover:text-primary bg-primary/5 hover:bg-primary/10 transition-all font-mono"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: Metrics
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hex-border rounded-xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Tone Fingerprint</h3>
            </div>
            <div className="space-y-3">
              {metrics.map(m => <MetricBar key={m.label} {...m} />)}
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Source breakdown</p>
              <div className="flex gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-primary" />
                  <span className="text-foreground">{samples.filter(s => s.source === "mic").length} voice</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{samples.filter(s => s.source === "text").length} text</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hex-border rounded-xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Learning Timeline</h3>
            </div>
            <div className="space-y-3">
              {[
                { event: "Initial calibration",            pct: 12,            date: "2026-05-28 09:00", current: false },
                { event: "First samples analyzed",          pct: 28,            date: "2026-05-28 09:15", current: false },
                { event: "Urdu-blend pattern recognized",   pct: 45,            date: "2026-05-28 09:42", current: false },
                { event: "Impatience tone mapped",          pct: 58,            date: "2026-05-28 10:10", current: false },
                { event: "Direct command style locked",     pct: 67,            date: "2026-05-28 10:33", current: false },
                { event: `Live session (${samples.length} samples)`, pct: learningProgress, date: "In progress", current: true },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-2 h-2 rounded-full mt-0.5"
                      style={{
                        background: ev.current ? "hsl(195 100% 50%)" : "hsl(210 30% 28%)",
                        boxShadow: ev.current ? "0 0 8px hsl(195 100% 50% / 0.7)" : "none",
                      }}
                    />
                    {i < 5 && <div className="w-px h-5 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${ev.current ? "text-primary font-medium" : "text-foreground"}`}>{ev.event}</p>
                      <span className="text-[10px] font-mono text-primary">{ev.pct}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{ev.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-border space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">Next milestone:</span>
                <span className="text-primary font-mono">75% → Full Style Adoption</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                <ChevronRight className="w-3 h-3 text-primary" />
                ~{Math.max(0, Math.ceil((75 - learningProgress) / 1.5))} samples needed
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
