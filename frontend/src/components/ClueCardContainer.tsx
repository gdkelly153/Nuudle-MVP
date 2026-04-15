import React from 'react';
import ClueCard from './ClueCard';
import styles from './ClueCardContainer.module.css';

interface ComponentData {
  icon_keyword?: string;
  component_text?: string;
}

interface ClueCardContainerProps {
  totalComponents: number;
  solvedComponents: number[];
  componentData?: ComponentData[];
}

const ClueCardContainer: React.FC<ClueCardContainerProps> = ({
  totalComponents,
  solvedComponents,
  componentData = []
}) => {
  if (totalComponents === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Clues Discovered</h3>
        <span className={styles.progress}>
          {solvedComponents.length} of {totalComponents}
        </span>
      </div>
      <div className={styles.cardsGrid}>
        {Array.from({ length: totalComponents }, (_, index) => {
          const isSolved = solvedComponents.includes(index);
          const data = componentData[index];
          
          return (
            <ClueCard
              key={index}
              index={index}
              isSolved={isSolved}
              totalCards={totalComponents}
              iconKeyword={isSolved ? data?.icon_keyword : undefined}
              componentText={isSolved ? data?.component_text : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ClueCardContainer;