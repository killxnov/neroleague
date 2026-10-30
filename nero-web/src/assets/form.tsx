"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type OTPStatus = "idle" | "error" | "success";

export interface OTPInputProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  label?: string;
  hint?: string;
  successMessage?: string;
  errorMessage?: string;
  status?: OTPStatus;
  mask?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function OTPInput({
  length = 4,
  value: controlledValue,
  defaultValue = "",
  onChange,
  onComplete,
  label,
  hint,
  successMessage,
  errorMessage,
  status = "idle",
  mask = false,
  disabled = false,
  autoFocus = false,
  "aria-label": ariaLabel = "One-time passcode",
  className,
}: OTPInputProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  const controlled = controlledValue !== undefined;

  const [slots, setSlots] = useState<string[]>(() =>
    toSlots(controlled ? controlledValue : defaultValue, length),
  );

  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  const joined = slots.join("");
  const joinedRef = useRef(joined);
  joinedRef.current = joined;

  useEffect(() => {
    if (!controlled) return;
    const incoming = sanitize(controlledValue, length);
    if (incoming !== joinedRef.current) {
      setSlots(toSlots(incoming, length));
    }
  }, [controlled, controlledValue, length]);

  const commit = (next: string[]) => {
    const wasComplete = slots.every((c) => c !== "");
    setSlots(next);
    const str = next.join("");
    onChange?.(str);
    if (!wasComplete && next.every((c) => c !== "")) {
      onComplete?.(str);
    }
  };

  const clearSlot = (idx: number) => {
    const next = [...slots];
    next[idx] = "";
    commit(next);
  };

  const slotFromClientX = (clientX: number) => {
    const els = slotsRef.current?.children;
    if (!els) return 0;
    for (let i = 0; i < els.length; i++) {
      if (clientX < els[i].getBoundingClientRect().right) return i;
    }
    return length - 1;
  };

  const insert = (raw: string, from = active) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = [...slots];
    let i = from;
    for (const ch of digits) {
      if (i >= length) break;
      next[i] = ch;
      i++;
    }
    commit(next);
    setActive(Math.min(i, length - 1));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      insert(k);
    } else if (k === "Backspace") {
      e.preventDefault();
      if (slots[active]) {
        clearSlot(active);
      } else if (active > 0) {
        clearSlot(active - 1);
        setActive(active - 1);
      }
    } else if (k === "Delete") {
      e.preventDefault();
      clearSlot(active);
    } else if (k === "ArrowLeft") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (k === "ArrowRight") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, length - 1));
    } else if (k === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (k === "End") {
      e.preventDefault();
      setActive(length - 1);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    insert(e.clipboardData.getData("text"), active);
  };

  const onChangeNative = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = sanitize(e.target.value, length);
    if (!digits) return;
    commit(toSlots(digits, length));
    setActive(Math.min(digits.length, length - 1));
  };

  useEffect(() => {
    if (status !== "error" || reduce || !slotsRef.current) return;
    animate(
      slotsRef.current,
      { x: [0, -5, 5, -3, 3, -1, 0] },
      { duration: 0.45, ease: EASE_OUT }
    );
  }, [status, reduce]);

  const showSuccess = status === "success";
  const activeIndex = focused ? active : -1;
  const message = showSuccess ? successMessage : status === "error" ? errorMessage : hint;

  return (
    <div className={cn("inline-flex flex-col items-center gap-2 w-full", className)}>
      {label ? (
        <label htmlFor={`${uid}-input`} className="text-sm font-medium text-white mb-2">
          {label}
        </label>
      ) : null}

      <div
        className="relative inline-flex w-max mx-auto"
        onMouseDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          const firstEmpty = slots.indexOf("");
          const cap = firstEmpty === -1 ? length - 1 : firstEmpty;
          setActive(Math.min(slotFromClientX(e.clientX), cap));
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          id={`${uid}-input`}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={status === "error"}
          value=""
          maxLength={length}
          onKeyDown={onKeyDown}
          onChange={onChangeNative}
          onPaste={onPaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-20 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
        />

        <div ref={slotsRef} className="flex items-center gap-3">
          {Array.from({ length }, (_, i) => {
            const char = slots[i] ?? "";
            const isActive = i === activeIndex;

            return (
              <div
                key={`${uid}-${i}`}
                data-active={isActive}
                data-filled={char !== ""}
                className={cn(
                  "relative grid h-16 w-14 place-items-center overflow-hidden rounded-2xl border-2 text-2xl font-black tabular-nums transition-all duration-300",
                  showSuccess
                    ? "border-[#80e06d]/60 text-white bg-[#1b1e5c]/10"
                    : status === "error"
                      ? "border-[#A6192E] text-white bg-[#a6192e28]"
                      : char
                        ? "border-white/40 text-white bg-white/5"
                        : "border-white/10 text-slate-500 bg-black/40",
                  isActive && !showSuccess && status !== "error" && "border-[#0e0ae9] shadow-[0_0_20px_rgba(14, 10, 233,0.5)] bg-white/5",
                  disabled && "opacity-50",
                )}
              >
                {isActive && !showSuccess ? (
                  <motion.span
                    aria-hidden
                    animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
                    transition={reduce ? undefined : { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-8 w-0.5 -translate-y-1/2 bg-[#ffffff]",
                      char ? "right-3" : "left-1/2 -translate-x-1/2",
                    )}
                  />
                ) : null}

                <AnimatePresence initial={false}>
                  {char ? (
                    <motion.span
                      key={char}
                      initial={reduce ? { opacity: 0 } : { y: 14, opacity: 0, filter: "blur(4px)" }}
                      animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0, filter: "blur(4px)" }}
                      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE_OUT }}
                      className="absolute inset-0 grid place-items-center leading-none"
                    >
                      {mask ? "•" : char}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Success Icon */}
        <AnimatePresence>
          {showSuccess ? (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 text-[#80e06d]"
              aria-hidden
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.1 }}
                />
              </svg>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {message ? (
        <p
          aria-live="polite"
          className={cn(
            "text-xs lg:text-sm font-bold mt-3",
            showSuccess ? "text-[#0ac8b9]" : status === "error" ? "text-[#A6192E]" : "text-slate-400",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function sanitize(raw: string | undefined, length: number) {
  return (raw ?? "").replace(/\D/g, "").slice(0, length);
}

function toSlots(raw: string | undefined, length: number) {
  const digits = sanitize(raw, length);
  return Array.from({ length }, (_, i) => digits[i] ?? "");
}