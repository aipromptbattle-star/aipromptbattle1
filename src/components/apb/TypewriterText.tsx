
"use client";
import React, { useState, useEffect } from "react";

export function TypewriterText({ text, speed = 30, className = "" }: { text: string; speed?: number; className?: string }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    if (!text) return;
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return (
    <span className={className}>
      {displayedText}
      <span className="inline-block w-[0.5em] h-[1em] bg-current ml-1 animate-pulse align-middle" style={{ opacity: displayedText.length === text.length ? 0 : 1 }} />
    </span>
  );
}

