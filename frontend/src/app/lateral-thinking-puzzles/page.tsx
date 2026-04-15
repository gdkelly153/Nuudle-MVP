"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import Confetti from 'react-confetti';
import ClueCardContainer from '@/components/ClueCardContainer';
import styles from './LateralThinkingPuzzles.module.css';

interface SolutionComponent {
  component_text: string;
  icon_keyword: string;
}

interface DailyPuzzle {
  id: string;
  puzzle_text: string;
  date: string;
  is_solved: boolean;
  solved_session_id?: string;
  total_components: number;
  solution_components?: SolutionComponent[];
}

interface HistoryItem {
  text: string;
  response: string;
  type: 'question' | 'solution';
  isCorrect?: boolean;
}

interface Stats {
  streak: number;
  riddlesSolved: number;
  totalQuestions: number;
}

interface ComponentData {
  icon_keyword?: string;
  component_text?: string;
}

const LateralThinkingPuzzlesPage: React.FC = () => {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [stats, setStats] = useState<Stats>({ streak: 0, riddlesSolved: 0, totalQuestions: 0 });
  const [solvedComponents, setSolvedComponents] = useState<number[]>([]);
  const [totalComponents, setTotalComponents] = useState<number>(0);
  const [componentData, setComponentData] = useState<ComponentData[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [fullSolution, setFullSolution] = useState<string | null>(null);
  const { trackEvent } = useAnalytics();
  
  // Countdown timer state
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPuzzleText, setDisplayedPuzzleText] = useState('');
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const syncTextareaHeights = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Get formatted date
  const getFormattedDate = () => {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    const day = now.getDate();
    const year = now.getFullYear();
    return `${dayOfWeek}, ${month} ${day}, ${year}`;
  };

  const formattedDate = getFormattedDate();

  // Calculate time until midnight Pacific Time (handles PST/PDT automatically)
  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    
    // Convert to Pacific Time using Intl.DateTimeFormat
    // This automatically handles PST/PDT transitions
    const pacificTimeString = now.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the Pacific time string
    const [datePart, timePart] = pacificTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    
    // Create a date object for current Pacific time
    const pacificNow = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
    
    // Calculate midnight Pacific Time (next day at 00:00:00)
    const midnightPacific = new Date(pacificNow);
    midnightPacific.setHours(24, 0, 0, 0);
    
    // Calculate difference in milliseconds
    const diff = midnightPacific.getTime() - pacificNow.getTime();
    
    if (diff <= 0) {
      return '00:00:00';
    }
    
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
  };

  // Typing animation for puzzle text
  const typeText = async (text: string, isDeleting: boolean = false) => {
    return new Promise<void>((resolve) => {
      let currentIndex = isDeleting ? text.length : 0;
      const speed = isDeleting ? 20 : 50; // Faster deletion, slower typing
      
      const animate = () => {
        if (isDeleting) {
          if (currentIndex > 0) {
            currentIndex--;
            setDisplayedPuzzleText(text.substring(0, currentIndex));
            animationRef.current = setTimeout(animate, speed);
          } else {
            resolve();
          }
        } else {
          if (currentIndex < text.length) {
            currentIndex++;
            setDisplayedPuzzleText(text.substring(0, currentIndex));
            animationRef.current = setTimeout(animate, speed);
          } else {
            resolve();
          }
        }
      };
      
      animate();
    });
  };

  // Handle puzzle transition at midnight
  const handleMidnightTransition = async () => {
    if (isTransitioning || !puzzle) return;
    
    setIsTransitioning(true);
    
    try {
      // Delete old puzzle text
      await typeText(puzzle.puzzle_text, true);
      
      // Fetch new puzzle
      const response = await fetch('/api/v1/puzzles/daily');
      if (!response.ok) {
        throw new Error('Failed to fetch new puzzle');
      }
      const newPuzzle: DailyPuzzle = await response.json();
      
      // Update puzzle state
      setPuzzle(newPuzzle);
      
      // Type new puzzle text
      await typeText(newPuzzle.puzzle_text, false);
      
      // Reset session for new puzzle
      const sessionResponse = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_type: 'daily-puzzle',
          user_id: 'anonymous',
          puzzle_id: newPuzzle.id,
        }),
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSessionId(sessionData.id);
        setHistory([]);
        setAttemptCount(0);
        setSolved(false);
        trackEvent('session_start', { session_type: 'daily-puzzle', sessionId: sessionData.id });
      }
    } catch (err) {
      console.error('Error during midnight transition:', err);
    } finally {
      setIsTransitioning(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const timeStr = calculateTimeUntilMidnight();
      setTimeUntilMidnight(timeStr);
      
      // Check if it's midnight (00:00:00)
      if (timeStr === '00:00:00' && !isTransitioning) {
        handleMidnightTransition();
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [puzzle, isTransitioning]);

  // Initialize displayed puzzle text when puzzle loads
  useEffect(() => {
    if (puzzle && !displayedPuzzleText && !isTransitioning) {
      setDisplayedPuzzleText(puzzle.puzzle_text);
    }
  }, [puzzle]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const initializePuzzle = async () => {
      try {
        // Fetch the daily puzzle with solved status
        const response = await fetch('/api/v1/puzzles/daily', {
          credentials: 'include' // Include cookies for authentication
        });
        if (!response.ok) {
          throw new Error('Failed to fetch daily puzzle');
        }
        const data: DailyPuzzle = await response.json();
        
        // Check if this is a different puzzle than what's cached
        const cachedPuzzleId = localStorage.getItem('current_puzzle_id');
        if (cachedPuzzleId && cachedPuzzleId !== data.id) {
          // New puzzle detected - clear all cached state for the old puzzle
          console.log('New puzzle detected, clearing old cached state');
          const oldPuzzleDate = localStorage.getItem('current_puzzle_date');
          if (oldPuzzleDate) {
            localStorage.removeItem(`puzzle_solved_${oldPuzzleDate}`);
            localStorage.removeItem(`puzzle_history_${oldPuzzleDate}`);
            localStorage.removeItem(`puzzle_questions_${oldPuzzleDate}`);
          }
        }
        
        // TEMPORARY: Force clear cache for current date to reset state
        // This will be removed after testing
        const currentDate = data.date;
        console.log('Clearing cache for current puzzle to reset state');
        localStorage.removeItem(`puzzle_solved_${currentDate}`);
        localStorage.removeItem(`puzzle_history_${currentDate}`);
        localStorage.removeItem(`puzzle_questions_${currentDate}`);
        
        // Store current puzzle ID and date for future comparison
        localStorage.setItem('current_puzzle_id', data.id);
        localStorage.setItem('current_puzzle_date', data.date);
        
        setPuzzle(data);
        
        // Set total components from puzzle data
        if (data.total_components) {
          setTotalComponents(data.total_components);
        }
        
        // Initialize component data from puzzle solution_components
        if (data.solution_components && Array.isArray(data.solution_components)) {
          setComponentData(data.solution_components.map(comp => ({
            icon_keyword: comp.icon_keyword,
            component_text: comp.component_text
          })));
        }

        // Check if puzzle is already solved
        const puzzleDate = data.date;
        const solvedKey = `puzzle_solved_${puzzleDate}`;
        const savedSolvedState = localStorage.getItem(solvedKey);
        
        // Check both backend solved status and localStorage for anonymous users
        if (data.is_solved || savedSolvedState === 'true') {
          setSolved(true);
          
          // Load saved history and attempt count if available
          const historyKey = `puzzle_history_${puzzleDate}`;
          const attemptCountKey = `puzzle_attempts_${puzzleDate}`;
          const savedHistory = localStorage.getItem(historyKey);
          const savedAttemptCount = localStorage.getItem(attemptCountKey);
          
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          }
          if (savedAttemptCount) {
            setAttemptCount(parseInt(savedAttemptCount, 10));
          }
          
          // Use existing session if available, otherwise create one
          if (data.solved_session_id) {
            setSessionId(data.solved_session_id);
          } else {
            // Create a session for tracking purposes
            const sessionResponse = await fetch('/api/v1/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_type: 'daily-puzzle',
                user_id: 'anonymous',
                puzzle_id: data.id,
              }),
            });
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setSessionId(sessionData.id);
            }
          }
        } else {
          // Puzzle not solved - create a new session
          const sessionResponse = await fetch('/api/v1/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_type: 'daily-puzzle',
              user_id: 'anonymous',
              puzzle_id: data.id,
            }),
          });

          if (!sessionResponse.ok) {
            throw new Error('Failed to create session');
          }

          const sessionData = await sessionResponse.json();
          setSessionId(sessionData.id);
          trackEvent('session_start', { session_type: 'daily-puzzle', sessionId: sessionData.id });
        }
        
        // Load stats from localStorage
        const savedStats = localStorage.getItem('puzzleStats');
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    initializePuzzle();
  }, [trackEvent]);

  // Auto-resize all textareas on mount and window resize
  useEffect(() => {
    const resizeTextareas = () => {
      const textareas = document.querySelectorAll('.auto-resizing-textarea');
      textareas.forEach((textarea) => {
        const element = textarea as HTMLTextAreaElement;
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      });
    };

    resizeTextareas();
    window.addEventListener('resize', resizeTextareas);
    return () => window.removeEventListener('resize', resizeTextareas);
  }, []);

  // Global keydown listener to auto-focus input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't focus if riddle is solved or submitting
      if (solved || submitting) return;
      
      // Don't focus if user is pressing modifier keys only
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
      
      // Don't focus if user is pressing special keys
      if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'F5') return;
      
      // If the textarea is not already focused, focus it
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [solved, submitting]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift, allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || solved || submitting) return;

    setSubmitting(true);
    setError(null);

    // Reset textarea height before clearing input
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      // Use the unified submission endpoint
      const response = await fetch(`/api/v1/puzzles/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_text: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit');
      }
      
      const data = await response.json();
      
      // Update component progress if available
      if (data.solved_components !== undefined && data.total_components !== undefined) {
        setSolvedComponents(data.solved_components);
        setTotalComponents(data.total_components);
      }
      
      // Add to history
      const historyItem: HistoryItem = {
        text: input,
        response: data.response,
        type: data.submission_type,
        isCorrect: data.is_correct
      };
      
      setHistory([...history, historyItem]);
      setInput('');
      
      // Increment attempt count for all submissions
      setAttemptCount(prev => prev + 1);
      
      // Handle correct solution
      if (data.submission_type === 'solution' && data.is_correct) {
        setSolved(true);
        setShowConfetti(true);
        
        // Store the full solution if provided
        if (data.full_solution) {
          setFullSolution(data.full_solution);
        }
        
        // Save solved state to localStorage for anonymous users
        if (puzzle) {
          const puzzleDate = puzzle.date;
          const solvedKey = `puzzle_solved_${puzzleDate}`;
          const historyKey = `puzzle_history_${puzzleDate}`;
          const attemptCountKey = `puzzle_attempts_${puzzleDate}`;
          
          localStorage.setItem(solvedKey, 'true');
          localStorage.setItem(historyKey, JSON.stringify([...history, historyItem]));
          localStorage.setItem(attemptCountKey, String(attemptCount));
        }
        
        // Update stats with attempt count
        const newTotalQuestions = stats.totalQuestions + attemptCount;
        const newRiddlesSolved = stats.riddlesSolved + 1;
        const newStats: Stats = {
          streak: stats.streak + 1,
          riddlesSolved: newRiddlesSolved,
          totalQuestions: newTotalQuestions
        };
        setStats(newStats);
        localStorage.setItem('puzzleStats', JSON.stringify(newStats));
        
        // Calculate time for confetti to fall off screen
        // Confetti falls at ~3 pixels per frame at 60fps
        // Window height / fall speed = time to fall
        // Add 1 second buffer to ensure all pieces are off screen
        const windowHeight = window.innerHeight;
        const fallTime = (windowHeight / 180) * 1000 + 1000; // ~3px per frame * 60fps = 180px/sec
        setTimeout(() => setShowConfetti(false), fallTime);
        
        trackEvent('session_complete', { sessionId, puzzleId: puzzle?.id });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setSubmitting(false);
      // Auto-focus the input after submission (unless riddle is solved)
      if (!solved) {
        inputRef.current?.focus();
      }
    }
  };

  const handleRegeneratePuzzle = async () => {
    if (regenerating) return;
    
    setRegenerating(true);
    try {
      const response = await fetch('/api/v1/puzzles/generate-now', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate new puzzle');
      }
      
      // Reload the page to fetch the new puzzle
      window.location.reload();
    } catch (err) {
      console.error('Error regenerating puzzle:', err);
      setError('Failed to generate new puzzle');
    } finally {
      setRegenerating(false);
    }
  };

  // Calculate average attempts per solve
  const avgAttempts = stats.riddlesSolved > 0
    ? (stats.totalQuestions / stats.riddlesSolved).toFixed(1)
    : '0.0';

  return (
    <div className={`wizard-container ${styles.container}`}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      {loading && <p>Loading puzzle...</p>}
      {error && <p className={styles.error}>{error}</p>}
      
      {puzzle && sessionId && (
        <>
          <div className={styles.riddleDisplay}>
            <div className={styles.dateInfo}>
              <span className={styles.fullDate}>{formattedDate}</span>
              <div className={styles.countdown} title="Time until next puzzle">
                {timeUntilMidnight}
              </div>
            </div>
            <h1 className={styles.title}>Daily Puzzle</h1>
            <p className={styles.riddleText}>
              {displayedPuzzleText}
              {isTransitioning && <span className={styles.cursor}>|</span>}
            </p>
          </div>

          <ClueCardContainer
            solvedComponents={solvedComponents}
            totalComponents={totalComponents}
            componentData={componentData}
          />

          <div className={styles.history}>
            <div className={styles.historyHeaderContainer}>
              <h2 className={styles.historyHeader}>Question History</h2>
              <span className={styles.questionCount}>Attempts: {attemptCount}</span>
            </div>
            <div className={styles.historyContent}>
              {history.length === 0 ? (
                <p className={styles.emptyHistory}>
                  No questions asked yet. Ask yes/no questions or submit your answer!
                </p>
              ) : (
                history.map((item, index) => (
                  <div key={index} className={styles.historyItem}>
                    <span className={styles.historyText}>{item.text}</span>
                    <span
                      className={`${styles.response} ${
                        item.type === 'solution'
                          ? item.isCorrect ? styles.correct : styles.incorrect
                          : styles[item.response.toLowerCase()]
                      }`}
                    >
                      {item.response}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {solved && fullSolution && (
            <div className={styles.solutionOverlay} onClick={() => setFullSolution(null)}>
              <div className={styles.solutionModal} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.closeButton}
                  onClick={() => setFullSolution(null)}
                  aria-label="Close solution"
                >
                  ×
                </button>
                <h3 className={styles.solutionHeader}>Solution</h3>
                <p className={styles.solutionText}>{fullSolution}</p>
              </div>
            </div>
          )}

          <div className={styles.formsContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={(e) => syncTextareaHeights(e)}
                onKeyDown={handleKeyDown}
                placeholder={solved ? "Puzzle solved!" : "Ask a question or submit your answer"}
                className={`${styles.input} auto-resizing-textarea`}
                disabled={solved || submitting}
                rows={1}
              />
              <button
                type="submit"
                className={styles.button}
                disabled={solved || submitting || !input.trim()}
              >
                {submitting ? '...' : 'Submit'}
              </button>
            </form>
          </div>

          <div className={styles.stats}>
            <h3>Your Stats</h3>
            <p>
              Streak: {stats.streak} days • Riddles Solved: {stats.riddlesSolved} • Avg. Attempts: {avgAttempts}
            </p>
            <button
              onClick={handleRegeneratePuzzle}
              disabled={regenerating}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#C85A54',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: regenerating ? 'not-allowed' : 'pointer',
                opacity: regenerating ? 0.6 : 1
              }}
            >
              {regenerating ? 'Generating...' : '🔄 Generate New Puzzle (Testing)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LateralThinkingPuzzlesPage;