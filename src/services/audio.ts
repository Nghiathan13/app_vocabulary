import { exists, writeFile } from "@tauri-apps/plugin-fs";

import { getAudioFileName, getAudioPath } from "../utils";

export async function downloadAudio(wordToDownload: string): Promise<boolean> {
  try {
    const fileName = getAudioFileName(wordToDownload);
    const filePath = await getAudioPath(wordToDownload);

    if (await exists(filePath)) {
      return true;
    }

    const cleanWord = wordToDownload.replace(/\s*\([^)]*\)/g, "").trim();

    let audioBuffer: ArrayBuffer | null = null;

    if (!cleanWord.includes(" ")) {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
        );
        if (response.ok) {
          const data = await response.json();
          const audioUrl =
            data[0]?.phonetics?.find((p: any) => p.audio?.includes("uk"))
              ?.audio || data[0]?.phonetics?.find((p: any) => p.audio)?.audio;

          if (audioUrl) {
            const audioResponse = await fetch(audioUrl);
            if (audioResponse.ok) {
              audioBuffer = await audioResponse.arrayBuffer();
            }
          }
        }
      } catch {
        // Fallback bên dưới
      }
    }

    if (!audioBuffer) {
      const VOICERSS_KEY = import.meta.env.VITE_VOICERSS_KEY;
      if (!VOICERSS_KEY) {
        console.error("Thiếu VOICERSS_KEY trong file .env");
        return false;
      }

      const params = new URLSearchParams({
        key: VOICERSS_KEY,
        hl: "en-gb",
        src: cleanWord,
        c: "MP3",
        f: "44khz_16bit_stereo",
      });

      const voiceResponse = await fetch(
        `https://api.voicerss.org/?${params.toString()}`,
      );

      const contentType = voiceResponse.headers.get("content-type") || "";
      if (voiceResponse.ok && contentType.includes("audio")) {
        audioBuffer = await voiceResponse.arrayBuffer();
      } else {
        const errText = await voiceResponse.text();
        console.error("VoiceRSS error:", errText);
        return false;
      }
    }

    if (audioBuffer) {
      await writeFile(filePath, new Uint8Array(audioBuffer));
      console.log(`Đã tải audio: ${fileName}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Lỗi khi tải audio cho "${wordToDownload}":`, error);
    return false;
  }
}
