import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  isDisabled: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, isDisabled }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => {
    if (isDisabled) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && <div className="tooltip-container">{text}</div>}
    </div>
  );
};

export default Tooltip;