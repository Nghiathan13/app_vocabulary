import type { ReactNode } from "react";

import { IconButton } from "../Button/Button";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  header?: ReactNode;
  headerStart?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  closeButtonDisabled?: boolean;
  closeButtonLabel?: string;
  closeOnOverlayClick?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  className,
  header,
  headerStart,
  footer,
  children,
  showCloseButton = false,
  closeButtonDisabled = false,
  closeButtonLabel = "Close",
  closeOnOverlayClick = false,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  const panelClassName = className
    ? `modal-panel ${className}`
    : "modal-panel";
  const generatedHeader =
    headerStart || showCloseButton ? (
      <>
        <div>{headerStart}</div>
        {showCloseButton ? (
          <IconButton
            type="button"
            className="modal-close-btn"
            icon="close"
            label={closeButtonLabel}
            onClick={onClose}
            disabled={closeButtonDisabled}
            size="sm"
          />
        ) : null}
      </>
    ) : null;
  const headerContent = header ?? generatedHeader;

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {headerContent ? <div className="modal-header">{headerContent}</div> : null}

        <div className="modal-body">{children}</div>

        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
