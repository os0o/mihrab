import { del, get, set } from "idb-keyval";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const DEFAULT_ADHAN = `${BASE}/audio/adhan.mp3`;

export interface Voice {
  id: string;
  name: string;
}

export const BUILTIN_VOICES: Voice[] = [
  { id: "default", name: "الأذان المرفق" },
  { id: "tone", name: "نغمة قصيرة فقط" },
];

// أصوات المستخدم تُحفظ في IndexedDB لأنها ملفات كبيرة لا تتسع لها localStorage
const LIST_KEY = "voices";
const blobKey = (id: string) => `voice:${id}`;

export async function listCustomVoices(): Promise<Voice[]> {
  return (await get<Voice[]>(LIST_KEY)) ?? [];
}

export async function addCustomVoice(file: File): Promise<Voice> {
  const voice: Voice = { id: `u${Date.now().toString(36)}`, name: file.name.replace(/\.[^.]+$/, "") };
  await set(blobKey(voice.id), file);
  await set(LIST_KEY, [...(await listCustomVoices()), voice]);
  return voice;
}

export async function removeCustomVoice(id: string) {
  await del(blobKey(id));
  await set(LIST_KEY, (await listCustomVoices()).filter((v) => v.id !== id));
}

let current: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export type PlayResult = "playing" | "blocked" | "missing";

async function resolveSrc(voiceId: string) {
  if (voiceId === "default") return DEFAULT_ADHAN;
  const blob = await get<Blob>(blobKey(voiceId));
  if (!blob) return DEFAULT_ADHAN; // صوت محذوف: نعود للأذان المرفق
  currentUrl = URL.createObjectURL(blob);
  return currentUrl;
}

export function stopAdhan() {
  current?.pause();
  current = null;
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = null;
}

export async function playAdhan(voiceId: string, volume: number): Promise<PlayResult> {
  stopAdhan();
  if (voiceId === "tone") {
    return playTone(volume) ? "playing" : "blocked";
  }
  const audio = new Audio(await resolveSrc(voiceId));
  audio.volume = volume;
  current = audio;
  try {
    await audio.play();
    return "playing";
  } catch (err) {
    // المتصفح يمنع الصوت قبل أول تفاعل من المستخدم مع الصفحة
    return err instanceof DOMException && err.name === "NotAllowedError" ? "blocked" : "missing";
  }
}

export function isAdhanPlaying() {
  return !!current && !current.paused;
}

// نغمة تنبيه مولّدة (لمنبّه الفجر والتذكيرات) بلا ملف صوتي
export function playTone(volume: number, repeats = 3) {
  if (typeof window === "undefined" || !("AudioContext" in window)) return false;
  const ctx = new AudioContext();
  void ctx.resume();
  const notes = [659.25, 880, 987.77];
  for (let r = 0; r < repeats; r++) {
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + r * 1.1 + i * 0.22;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.35 * volume), start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    });
  }
  setTimeout(() => void ctx.close(), repeats * 1100 + 800);
  return ctx.state !== "suspended";
}
