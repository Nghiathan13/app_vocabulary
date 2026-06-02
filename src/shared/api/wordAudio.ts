import { invoke } from "@tauri-apps/api/core";

import { WordWithId } from "../../entities/word/model/types";
import { API_BASE_URL, isDesktopMode } from "../config/appMode";
import { getAudioPath } from "../lib/utils";

export interface WordAudioSource {
  url: string;
  shouldRevoke: boolean;
}

const toAbsoluteAudioUrl = (audioUrl: string) => {
  if (/^https?:\/\//.test(audioUrl)) {
    return audioUrl;
  }

  return `${API_BASE_URL}${audioUrl}`;
};

const blobUrlFromBytes = (bytes: number[]) => {
  const blob = new Blob([new Uint8Array(bytes)], { type: "audio/mpeg" });

  return URL.createObjectURL(blob);
};

export async function createWordAudioSource(
  word: WordWithId,
): Promise<WordAudioSource | null> {
  if (!word.hasAudio) {
    return null;
  }

  if (!isDesktopMode) {
    if (!word.audio_url) {
      return null;
    }

    return {
      url: toAbsoluteAudioUrl(word.audio_url),
      shouldRevoke: false,
    };
  }

  const audioPath = await getAudioPath(word.word);

  try {
    const localBytes = await invoke<number[]>("read_binary_file", {
      path: audioPath,
    });

    return {
      url: blobUrlFromBytes(localBytes),
      shouldRevoke: true,
    };
  } catch {
    if (!word.audio_url) {
      return null;
    }
  }

  const response = await fetch(toAbsoluteAudioUrl(word.audio_url));

  if (!response.ok) {
    throw new Error(`Audio download failed: ${response.status}`);
  }

  const remoteBytes = Array.from(new Uint8Array(await response.arrayBuffer()));
  await invoke("write_binary_file", {
    path: audioPath,
    bytes: remoteBytes,
  });

  return {
    url: blobUrlFromBytes(remoteBytes),
    shouldRevoke: true,
  };
}
