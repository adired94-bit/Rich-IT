"use client";
import * as React from "react";

export type RecorderState = "idle" | "recording" | "stopped" | "error";

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

export function useAudioRecorder() {
  const [state, setState] = React.useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [levels, setLevels] = React.useState<number[]>(Array(32).fill(0.05));
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [errorKey, setErrorKey] = React.useState<"denied" | "unsupported" | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const startedAtRef = React.useRef<number>(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  React.useEffect(() => cleanupStream, [cleanupStream]);

  const tickLevels = React.useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const bucket = 32;
    const step = Math.floor(data.length / bucket) || 1;
    const next: number[] = [];
    for (let i = 0; i < bucket; i++) {
      const v = data[i * step] / 255;
      next.push(Math.max(0.05, v));
    }
    setLevels(next);
    rafRef.current = requestAnimationFrame(tickLevels);
  }, []);

  const start = React.useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorKey("unsupported");
      setState("error");
      return;
    }
    const mimeType = pickMimeType();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(tickLevels);

      chunksRef.current = [];
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("stopped");
        cleanupStream();
      };
      recorder.start(250);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
      setState("recording");
      setAudioBlob(null);
      setAudioUrl(null);
    } catch {
      setErrorKey("denied");
      setState("error");
    }
  }, [cleanupStream, tickLevels]);

  const stop = React.useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = React.useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedMs(0);
    setLevels(Array(32).fill(0.05));
    setState("idle");
    setErrorKey(null);
  }, [audioUrl]);

  return { state, elapsedMs, levels, audioBlob, audioUrl, errorKey, start, stop, reset };
}
