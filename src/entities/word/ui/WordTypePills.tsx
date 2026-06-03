import {
  formatWordTypeLabel,
  getWordTypeKind,
  splitWordTypeLabels,
} from "../lib/wordTypes";
import "./WordTypePills.css";

interface WordTypePillsProps {
  type: string | null;
  variant: "table" | "review";
  className?: string;
}

export default function WordTypePills({
  type,
  variant,
  className,
}: WordTypePillsProps) {
  const labels = splitWordTypeLabels(type);

  if (labels.length === 0) {
    return null;
  }

  return (
    <span className={["type-pill-list", className].filter(Boolean).join(" ")}>
      {labels.map((typePart) => {
        const kind = getWordTypeKind(typePart);

        return (
          <span
            className={`type-pill-${variant} type-pill-${kind}`}
            key={typePart}
          >
            {formatWordTypeLabel(typePart)}
          </span>
        );
      })}
    </span>
  );
}
