import React from 'react';
import { Brain } from 'lucide-react';

interface BrainIconWithAnimationProps {
  size: number;
  className?: string;
}

const BrainIconWithAnimation: React.FC<BrainIconWithAnimationProps> = ({ size, className = '' }) => {
  return (
    <div className="brain-icon-wrapper">
      <Brain className={`brain-icon ${className}`} size={size} />
      <div className="neural-network-brain">
        <div className="light-particle"></div>
        <div className="light-particle"></div>
        <div className="light-particle"></div>
        <div className="light-particle"></div>
        <div className="light-particle"></div>
      </div>
    </div>
  );
};

export default BrainIconWithAnimation;