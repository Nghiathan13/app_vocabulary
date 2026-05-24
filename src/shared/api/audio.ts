import { invoke } from "@tauri-apps/api/core";

export interface ElevenLabsQuota {
  characterCount: number;
  characterLimit: number;
  nextCharacterCountResetUnix: number | null;
  status: string | null;
}

export interface AudioDownloadResult {
  status: "ready" | "quota_exhausted" | "error";
  fileName: string;
  message: string | null;
}

export async function getElevenLabsQuota(): Promise<ElevenLabsQuota> {
  return await invoke<ElevenLabsQuota>("get_elevenlabs_quota");
}

export async function downloadAudioStatus(
  wordToDownload: string,
): Promise<AudioDownloadResult> {
  try {
    return await invoke<AudioDownloadResult>("download_elevenlabs_audio", {
      word: wordToDownload,
    });
  } catch (error) {
    console.error(`Lỗi khi tải audio cho "${wordToDownload}":`, error);
    return {
      status: "error",
      fileName: "",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function downloadAudio(wordToDownload: string): Promise<boolean> {
  const result = await downloadAudioStatus(wordToDownload);

  if (result.status !== "ready" && result.message) {
    console.error(result.message);
  }

  return result.status === "ready";
}
