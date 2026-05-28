import { useState, useEffect, useRef, useCallback } from "react";

export type RecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: SpeechRecognitionResult) => void;
  onFinalResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
}

// ── Web Speech API type declarations ─────────────────────────────────────────

interface ISpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionCtor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionCtor;
    webkitSpeechRecognition?: ISpeechRecognitionCtor;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = "ur-PK",
    continuous = false,
    interimResults = true,
    onResult,
    onFinalResult,
    onError,
  } = options;

  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    (Boolean(window.SpeechRecognition) || Boolean(window.webkitSpeechRecognition));

  // ── Audio level meter ──────────────────────────────────────────────────────
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, avg * 2.4));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // mic permission denied — audio meter skipped, recognition still proceeds
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => undefined);
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  // ── Start ──────────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (!isSupported) {
      setStatus("unsupported");
      onError?.("Web Speech API is not supported in this browser.");
      return;
    }
    if (status === "listening") return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) { setStatus("unsupported"); return; }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setStatus("listening");
      setInterimTranscript("");
      setFinalTranscript("");
      setConfidence(0);
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      let bestConf = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const conf = result[0].confidence;

        if (result.isFinal) {
          final += text;
          bestConf = Math.max(bestConf, conf);
          onResult?.({ transcript: text, isFinal: true, confidence: conf });
        } else {
          interim += text;
          onResult?.({ transcript: text, isFinal: false, confidence: 0 });
        }
      }

      if (interim) setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(prev => (prev ? prev + " " + final : final).trim());
        setConfidence(bestConf);
        onFinalResult?.(final.trim(), bestConf);
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      const msg =
        event.error === "no-speech"
          ? "Koi awaaz nahi aayi — phir try karo."
          : event.error === "not-allowed"
          ? "Microphone permission denied. Browser settings check karo."
          : event.error === "network"
          ? "Network error — internet connection check karo."
          : `Recognition error: ${event.error}`;
      setStatus("error");
      onError?.(msg);
      stopAudioMeter();
    };

    recognition.onend = () => {
      setStatus(prev => (prev === "error" ? "error" : "idle"));
      stopAudioMeter();
    };

    startAudioMeter();
    recognition.start();
  }, [isSupported, status, lang, continuous, interimResults, onResult, onFinalResult, onError, startAudioMeter, stopAudioMeter]);

  // ── Stop ───────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    stopAudioMeter();
    setStatus("idle");
    setInterimTranscript("");
  }, [stopAudioMeter]);

  const reset = useCallback(() => {
    stop();
    setFinalTranscript("");
    setInterimTranscript("");
    setConfidence(0);
    setStatus("idle");
  }, [stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopAudioMeter();
    };
  }, [stopAudioMeter]);

  return {
    isSupported,
    status,
    interimTranscript,
    finalTranscript,
    confidence,
    audioLevel,
    start,
    stop,
    reset,
  };
}
