import { useCallback, useEffect, useRef, useState } from "react";
import { WordId, WordWithId } from "../../../entities/word/model/types";
import { createWordAudioSource } from "../../../shared/api/wordAudio";
import { createSilentWarmupUrl } from "../lib/audioWarmup";

const AUDIO_PREROLL_DELAY_MS = 500;

interface UseReviewAudioProps {
  currentWord: WordWithId | undefined;
}

export function useReviewAudio({ currentWord }: UseReviewAudioProps) {
  const [hasAudio, setHasAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const shouldRevokeAudioUrlRef = useRef(false);
  const warmupAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentWarmupUrlRef = useRef<string | null>(null);
  const pronounceTimerRef = useRef<number | null>(null);
  const autoPlayedWordIdRef = useRef<WordId | null>(null);

  const stopCurrentAudio = useCallback(() => {
    if (pronounceTimerRef.current !== null) {
      window.clearTimeout(pronounceTimerRef.current);
      pronounceTimerRef.current = null;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    if (warmupAudioRef.current) {
      warmupAudioRef.current.pause();
      warmupAudioRef.current.currentTime = 0;
      warmupAudioRef.current = null;
    }
  }, []);

  const playCurrentAudio = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    const audio = audioRef.current.cloneNode(true) as HTMLAudioElement;
    activeAudioRef.current = audio;
    audio.onended = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    };

    audio.play().catch(() => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    });
  }, []);

  const handlePronounce = useCallback(
    (onStart?: () => void) => {
      if (!audioRef.current) {
        return;
      }

      stopCurrentAudio();

      if (!silentWarmupUrlRef.current) {
        silentWarmupUrlRef.current = createSilentWarmupUrl();
      }

      const warmupAudio = new Audio(silentWarmupUrlRef.current);
      warmupAudioRef.current = warmupAudio;
      warmupAudio.play().catch(() => {});

      pronounceTimerRef.current = window.setTimeout(() => {
        pronounceTimerRef.current = null;
        onStart?.();
        playCurrentAudio();
      }, AUDIO_PREROLL_DELAY_MS);
    },
    [playCurrentAudio, stopCurrentAudio],
  );

  useEffect(() => {
    const clearAudio = () => {
      stopCurrentAudio();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current && shouldRevokeAudioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      audioUrlRef.current = null;
      shouldRevokeAudioUrlRef.current = false;
    };

    if (!currentWord) {
      clearAudio();
      setHasAudio(false);
      return;
    }

    let isCancelled = false;

    const loadAudio = async () => {
      try {
        if (currentWord.hasAudio) {
          const source = await createWordAudioSource(currentWord);

          if (isCancelled) {
            return;
          }

          if (!source) {
            clearAudio();
            setHasAudio(false);
            return;
          }

          const audio = new Audio(source.url);
          audio.preload = "auto";
          audio.load();
          audioUrlRef.current = source.url;
          shouldRevokeAudioUrlRef.current = source.shouldRevoke;
          audioRef.current = audio;

          setHasAudio(true);

          if (autoPlayedWordIdRef.current !== currentWord.id) {
            const wordId = currentWord.id;
            handlePronounce(() => {
              autoPlayedWordIdRef.current = wordId;
            });
          }
        } else {
          clearAudio();
          setHasAudio(false);
        }
      } catch (error) {
        console.error("Lỗi khi load audio:", error);
        clearAudio();
        setHasAudio(false);
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
      clearAudio();
    };
  }, [currentWord, handlePronounce, stopCurrentAudio]);

  useEffect(() => {
    return () => {
      if (silentWarmupUrlRef.current) {
        URL.revokeObjectURL(silentWarmupUrlRef.current);
      }
    };
  }, []);

  return {
    hasAudio,
    playAudio: playCurrentAudio,
    stopAudio: stopCurrentAudio,
    handlePronounce,
  };
}
