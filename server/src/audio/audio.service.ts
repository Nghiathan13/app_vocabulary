import { Injectable } from "@nestjs/common";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join, resolve } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

import { PrismaService } from "../prisma/prisma.service";

const AUDIO_PROVIDER = "elevenlabs";
const TTS_MODEL = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

export interface AudioMetadata {
  audio_status: string | null;
  audio_url: string | null;
  hasAudio: boolean;
}

export const normalizeAudioText = (text: string) => text.trim().toLowerCase();

const cleanTtsText = (text: string) => {
  let result = "";
  let inParentheses = false;

  for (const char of text) {
    if (char === "(") {
      result = result.trimEnd();
      inParentheses = true;
      continue;
    }

    if (char === ")" && inParentheses) {
      inParentheses = false;
      continue;
    }

    if (!inParentheses) {
      result += char;
    }
  }

  return result.trim();
};

@Injectable()
export class AudioService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureAudioForWord(word: string) {
    const text = word.trim();
    const normalizedText = normalizeAudioText(text);

    if (!normalizedText) {
      return;
    }

    const existingAsset = await this.prisma.audioAsset.findUnique({
      where: { normalizedText },
    });

    if (existingAsset?.status === "ready" || existingAsset?.status === "pending") {
      return;
    }

    const asset =
      existingAsset ??
      (await this.prisma.audioAsset.create({
        data: {
          text,
          normalizedText,
          provider: AUDIO_PROVIDER,
          voiceId: this.getVoiceId(),
          model: TTS_MODEL,
          status: "pending",
        },
      }));

    await this.prisma.audioAsset.update({
      where: { id: asset.id },
      data: {
        text,
        provider: AUDIO_PROVIDER,
        voiceId: this.getVoiceId(),
        model: TTS_MODEL,
        status: "pending",
        errorMessage: null,
      },
    });

    try {
      const fileName = `${asset.id}.mp3`;
      const filePath = join(this.getStorageDir(), fileName);

      await this.generateElevenLabsAudio(text, filePath);

      await this.prisma.audioAsset.update({
        where: { id: asset.id },
        data: {
          filePath: fileName,
          status: "ready",
          errorMessage: null,
        },
      });
    } catch (error) {
      await this.prisma.audioAsset.update({
        where: { id: asset.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async getMetadataByNormalizedTexts(normalizedTexts: string[]) {
    const uniqueTexts = Array.from(new Set(normalizedTexts.filter(Boolean)));
    const assets = await this.prisma.audioAsset.findMany({
      where: { normalizedText: { in: uniqueTexts } },
    });

    const metadata = new Map<string, AudioMetadata>();

    for (const asset of assets) {
      metadata.set(asset.normalizedText, {
        audio_status: asset.status,
        audio_url:
          asset.status === "ready" && asset.filePath
            ? `/audio/${asset.filePath}`
            : null,
        hasAudio: asset.status === "ready" && Boolean(asset.filePath),
      });
    }

    return metadata;
  }

  getAudioFilePath(fileName: string) {
    if (!/^[a-zA-Z0-9-]+\.mp3$/.test(fileName)) {
      return null;
    }

    return resolve(this.getStorageDir(), fileName);
  }

  private getStorageDir() {
    return resolve(process.cwd(), process.env.AUDIO_STORAGE_DIR ?? "storage/audio");
  }

  private getApiKey() {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      throw new Error("Missing ELEVENLABS_API_KEY");
    }

    return apiKey;
  }

  private getVoiceId() {
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!voiceId) {
      throw new Error("Missing ELEVENLABS_VOICE_ID");
    }

    return voiceId;
  }

  private async generateElevenLabsAudio(text: string, filePath: string) {
    const ttsText = cleanTtsText(text);

    if (!ttsText) {
      throw new Error("Word is empty after cleanup");
    }

    await mkdir(this.getStorageDir(), { recursive: true });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.getVoiceId()}?output_format=${OUTPUT_FORMAT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
          "xi-api-key": this.getApiKey(),
        },
        body: JSON.stringify({
          text: ttsText,
          model_id: TTS_MODEL,
        }),
      },
    );

    if (!response.ok || !response.body) {
      const body = await response.text().catch(() => "");
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${body}`);
    }

    await pipeline(
      Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(filePath),
    );
  }
}
