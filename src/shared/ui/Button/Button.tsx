import type { ButtonHTMLAttributes } from "react";

import Icon, { IconName } from "../Icon/Icon";
import "./Button.css";

type ButtonVariant = "outline" | "primary";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "outline",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const buttonClassName = [
    "ui-button",
    `ui-button-${variant}`,
    `ui-button-${size}`,
    fullWidth ? "ui-button-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={buttonClassName} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  variant = "outline",
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  const buttonClassName = [
    "ui-button",
    "ui-icon-button",
    `ui-button-${variant}`,
    `ui-icon-button-${size}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={buttonClassName} aria-label={label} {...props}>
      <Icon name={icon} />
    </button>
  );
}
