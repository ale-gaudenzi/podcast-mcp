import { EdgeTTS } from "@andresaya/edge-tts";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cleanScript } from "./cleaner.js";

// Voci selezionate per podcast e narrazione
export const VOICES: Record<string, string> = {
  // Italiano
  "it-male": "it-IT-GiuseppeMultilingualNeural", // Consigliata, molto naturale
  "it-female": "it-IT-ElsaNeural",               // Voce femminile colloquiale e calda
  "it-diego": "it-IT-DiegoNeural",               // Voce maschile formale
  "it-isabella": "it-IT-IsabellaNeural",         // Voce femminile limpida
  // Inglese
  "en-male": "en-US-AndrewNeural",
  "en-female": "en-US-AvaNeural",
  // Francese
  "fr-male": "fr-FR-HenriNeural",
  "fr-female": "fr-FR-DeniseNeural",
  // Spagnolo
  "es-male": "es-ES-AlvaroNeural",
  "es-female": "es-ES-ElviraNeural",
};

export const DEFAULT_VOICE = process.env.DEFAULT_VOICE ?? "it-male";

export interface SynthesizeOptions {
  text: string;
  // Chiave da VOICES (es. "it-male") o nome completo Edge TTS
  voice?: string;
  // Percorso di destinazione SENZA estensione (.mp3 viene aggiunto dalla libreria)
  outPathNoExt: string;
  // Velocità di riproduzione opzionale (es. "0%", "+10%", "-5%")
  rate?: string;
  // Volume opzionale (es. "0%", "+10%")
  volume?: string;
  // Pitch / tono opzionale (es. "0Hz")
  pitch?: string;
  // Se disabilitare la pulizia automatica del testo (default: false)
  rawText?: boolean;
}

export interface SynthesizeResult {
  filePath: string;
  durationSeconds: number;
  voiceUsed: string;
  cleanedText: string;
}

/**
 * Sintetizza un testo in file audio MP3 con Microsoft Edge TTS.
 * Pulisce automaticamente il testo dai prompt dei modelli LLM ed espande le sigle.
 */
export async function synthesizeNarration(
  opts: SynthesizeOptions
): Promise<SynthesizeResult> {
  const voiceId = VOICES[opts.voice ?? DEFAULT_VOICE] ?? opts.voice ?? VOICES[DEFAULT_VOICE];

  // Pulisce il testo e scandisce le sigle per audio naturale
  const cleanedText = opts.rawText ? opts.text : cleanScript(opts.text);

  if (!cleanedText.trim()) {
    throw new Error("Il testo fornito è vuoto dopo la pulizia.");
  }

  let lastError: unknown;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tts = new EdgeTTS();
      await tts.synthesize(cleanedText, voiceId, {
        rate: opts.rate ?? "0%",
        volume: opts.volume ?? "0%",
        pitch: opts.pitch ?? "0Hz",
      });

      await tts.toFile(opts.outPathNoExt);
      const filePath = `${opts.outPathNoExt}.mp3`;

      // Calcolo stima durata
      let durationSeconds = 0;
      try {
        durationSeconds = Math.round((tts.getDuration?.() as number) ?? 0);
      } catch {
        const wordCount = cleanedText.split(/\s+/).length;
        durationSeconds = Math.max(5, Math.round((wordCount / 140) * 60));
      }

      await fs.access(filePath);

      return {
        filePath: path.resolve(filePath),
        durationSeconds,
        voiceUsed: voiceId,
        cleanedText,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[EdgeTTS] Tentativo ${attempt}/${maxRetries} fallito: ${err?.message ?? err}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw lastError;
}
