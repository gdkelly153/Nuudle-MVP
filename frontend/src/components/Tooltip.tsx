import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  isDisabled: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, isDisabled }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (isDisabled) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Dynamic tooltip width based on viewport (mobile-friendly)
      const maxTooltipWidth = Math.min(250, viewportWidth - 20); // Never wider than viewport - 20px
      const tooltipHeight = 32;
      
      // Start with centered positioning
      let left = rect.left + (rect.width / 2) - (maxTooltipWidth / 2);
      let top = rect.top - tooltipHeight - 8;
      
      // Mobile-safe boundary checks - ensure tooltip stays fully within viewport
      const safeMargin = 10;
      
      // Check left boundary - never go below 10px from left edge
      if (left < safeMargin) {
        left = safeMargin;
      }
      
      // Check right boundary - ensure tooltip + its width never exceeds viewport
      if (left + maxTooltipWidth > viewportWidth - safeMargin) {
        left = viewportWidth - maxTooltipWidth - safeMargin;
      }
      
      // Double-check: if tooltip is still too wide, position it at absolute left
      if (left < 0) {
        left = safeMargin;
      }
      
      // Check top boundary - if no room above, position below
      if (top < safeMargin) {
        top = rect.bottom + 8;
      }
      
      // Check bottom boundary - ensure tooltip doesn't go off bottom
      if (top + tooltipHeight > viewportHeight - safeMargin) {
        top = viewportHeight - tooltipHeight - safeMargin;
      }

      setPosition({ top, left });
    }
  }, [isVisible, text]);

  if (!isDisabled) {
    return <div style={{ display: 'inline-block' }}>{children}</div>;
  }

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: `${Math.min(250, window.innerWidth - 20)}px`,
            minWidth: '120px',
            backgroundColor: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.3',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            textAlign: 'center',
            wordWrap: 'break-word',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;