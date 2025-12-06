"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

export function OrbInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder,
  className,
  ...props
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Keep the placeholders stable across renders
  const placeholders = useMemo(
    () => [
      "Ask anything...",
      "What's on your mind?",
      "How can I help you?",
      "What would you like to know?",
    ],
    []
  );

  // Config: tweak the animation to taste
  const CHAR_DELAY = 75; // ms between characters while typing
  const IDLE_DELAY_AFTER_FINISH = 2200; // ms to wait after a full sentence is shown

  // Refs to hold active timers so they can be cleaned up
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // clear any stale timers (helps with StrictMode double-invoke in dev)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const current = placeholders[placeholderIndex];
    if (!current) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    const chars = Array.from(current);
    // reset state for a new round
    setDisplayedText("");
    setIsTyping(true);
    let charIndex = 0;

    // type character-by-character using a derived slice to avoid any chance of appending undefined
    intervalRef.current = setInterval(() => {
      if (charIndex < chars.length) {
        const next = chars.slice(0, charIndex + 1).join("");
        setDisplayedText(next);
        charIndex += 1;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsTyping(false);
        // after a brief pause, advance to the next placeholder
        timeoutRef.current = setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, IDLE_DELAY_AFTER_FINISH);
      }
    }, CHAR_DELAY);

    // Cleanup on unmount or when placeholderIndex changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [placeholderIndex, placeholders]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={`relative ${className || ""}`}>
      <div
        className={`flex items-center gap-3 p-4 bg-black/60 shadow-lg transition-all duration-300 ease-out rounded-full border border-gray-300/50 backdrop-blur-sm ${
          isFocused ? "shadow-xl scale-[1.02] border-gray-500/70" : "shadow-lg"
        }`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden transition-all duration-300 scale-100">
            <img
              src="https://media.giphy.com/media/26gsuUjoEBmLrNBxC/giphy.gif"
              alt="Animated orb"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="w-px h-10 bg-gray-600/50" />
        <div className="flex-1 min-w-0">
          <input
            data-testid="orb-input"
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || `${displayedText}${isTyping ? "|" : ""}`}
            aria-label="Ask a question"
            className="w-full text-lg text-white placeholder-gray-400 bg-transparent border-none outline-none font-light"
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

export default OrbInput;

