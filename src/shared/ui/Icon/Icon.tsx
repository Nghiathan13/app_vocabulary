import "./Icon.css";

export type IconName =
  | "add"
  | "close"
  | "delete"
  | "edit"
  | "export"
  | "import"
  | "search"
  | "sort";

interface IconProps {
  name: IconName;
  className?: string;
}

export default function Icon({ name, className }: IconProps) {
  const iconClassName = className
    ? `ui-icon ui-icon-${name} ${className}`
    : `ui-icon ui-icon-${name}`;

  return <span className={iconClassName} aria-hidden="true" />;
}
