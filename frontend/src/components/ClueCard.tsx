import React from 'react';
import Tooltip from './Tooltip';
import styles from './ClueCard.module.css';

interface ClueCardProps {
  index: number;
  isSolved: boolean;
  totalCards: number;
  iconKeyword?: string;
  componentText?: string;
}

const ClueCard: React.FC<ClueCardProps> = ({
  index,
  isSolved,
  totalCards,
  iconKeyword,
  componentText
}) => {
  return (
    <Tooltip
      text={componentText || ''}
      isEnabled={isSolved && !!componentText}
    >
      <div className={`${styles.card} ${isSolved ? styles.solved : ''}`}>
        <div className={styles.cardInner}>
          {/* Front of card (face-down) */}
          <div className={styles.cardFront}>
            <div className={styles.cardNumber}>{index + 1}</div>
          </div>
          
          {/* Back of card (revealed with icon/keyword) */}
          <div className={styles.cardBack}>
            {iconKeyword ? (
              <div className={styles.iconKeyword}>{iconKeyword}</div>
            ) : (
              <svg
                className={styles.checkmark}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </Tooltip>
  );
};

export default ClueCard;