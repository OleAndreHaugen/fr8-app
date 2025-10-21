"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Only render portal in the browser, not during SSR
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Don't render anything if dialog is closed or if not mounted yet
  if (!isOpen || !isMounted) return null;

  // Use a portal to render the dialog at the document root
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md z-10 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-md cursor-pointer bg-destructive hover:bg-destructive-hover`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
} 