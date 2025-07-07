import React from 'react';

interface CenteredLayoutProps {
  children: React.ReactNode;
}

const CenteredLayout: React.FC<CenteredLayoutProps> = ({ children }) => {
  return (
    <div className="centered-layout">
      {children}
      
      <style jsx>{`
        .centered-layout {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default CenteredLayout;