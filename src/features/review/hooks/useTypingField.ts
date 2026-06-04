import { useLayoutEffect, useRef, useState } from "react";
import { TypingFieldStyle } from "../model/reviewTypes";

const TYPING_INPUT_MAX_WIDTH = 360;
const TYPING_UNDERLINE_EXTRA_WIDTH = 28;
const TYPING_FIELD_VIEWPORT_MARGIN = 96;

interface UseTypingFieldProps {
  typedAnswer: string;
  isTypingMode: boolean;
}

export function useTypingField({
  typedAnswer,
  isTypingMode,
}: UseTypingFieldProps) {
  const [typingFieldWidth, setTypingFieldWidth] = useState(0);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const typingMeasureRef = useRef<HTMLSpanElement>(null);

  const typingFieldText = typedAnswer || "Type the word";
  const typingFieldStyle: TypingFieldStyle = {
    "--typing-field-width": `${typingFieldWidth || 156}px`,
  };

  useLayoutEffect(() => {
    if (!isTypingMode) {
      return;
    }

    const measure = typingMeasureRef.current;
    if (!measure) {
      return;
    }

    const width =
      Math.ceil(measure.getBoundingClientRect().width) +
      TYPING_UNDERLINE_EXTRA_WIDTH +
      16;
    setTypingFieldWidth(width);

    const animationFrame = window.requestAnimationFrame(() => {
      const maxFieldWidth = Math.min(
        TYPING_INPUT_MAX_WIDTH + TYPING_UNDERLINE_EXTRA_WIDTH,
        window.innerWidth - TYPING_FIELD_VIEWPORT_MARGIN,
      );

      if (width <= maxFieldWidth) {
        typingInputRef.current?.scrollTo({ left: 0 });
      }
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [typingFieldText, isTypingMode]);

  return {
    typingInputRef,
    typingMeasureRef,
    typingFieldText,
    typingFieldStyle,
  };
}
