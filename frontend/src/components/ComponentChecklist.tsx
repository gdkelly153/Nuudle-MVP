import React from 'react';
import styles from './ComponentChecklist.module.css';

interface ComponentChecklistProps {
  solvedComponentTexts: string[];
  totalComponents: number;
}

const ComponentChecklist: React.FC<ComponentChecklistProps> = ({
  solvedComponentTexts,
  totalComponents,
}) => {
  if (totalComponents === 0) {
    return null; // Don't render if there are no components
  }

  return (
    <div className={styles.checklistContainer}>
      <h3 className={styles.checklistTitle}>Solution Components</h3>
      <div className={styles.checklist}>
        {Array.from({ length: totalComponents }).map((_, index) => {
          const isSolved = index < solvedComponentTexts.length;
          const componentText = isSolved ? solvedComponentTexts[index] : null;

          return (
            <div
              key={index}
              className={`${styles.checklistItem} ${isSolved ? styles.solved : styles.unsolved}`}
            >
              <div className={styles.checkbox}>
                {isSolved ? (
                  <svg
                    className={styles.checkmark}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="#4FD1C5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <div className={styles.emptyBox} />
                )}
              </div>
              <div className={styles.componentText}>
                {isSolved ? (
                  <span className={styles.revealedText}>{componentText}</span>
                ) : (
                  <span className={styles.hiddenText}>???</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.progress}>
        {solvedComponentTexts.length} of {totalComponents} components discovered
      </div>
    </div>
  );
};

export default ComponentChecklist;