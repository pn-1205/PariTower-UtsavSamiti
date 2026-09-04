import React from 'react';

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  repeat?: number;
}

export function Marquee({
  className = '',
  reverse = false,
  pauseOnHover = true,
  children,
  repeat = 4,
}: MarqueeProps) {
  return (
    <div
      className={`group flex overflow-hidden p-1.5 [--gap:1.5rem] [gap:var(--gap)] marquee-container ${className}`}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={`flex shrink-0 justify-around [gap:var(--gap)] marquee-content ${
            reverse ? 'animate-marquee-reverse' : 'animate-marquee'
          } ${pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''}`}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

export default Marquee;
