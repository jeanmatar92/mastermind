import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Utility to generate a random 4-digit sequence with unique digits
function generateSecret(): number[] {
  const digits = Array.from({ length: 10 }, (_, i) => i);
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4);
}

function evaluateGuess(secret: number[], guess: number[]): { green: number; orange: number } {
  let green = 0;
  let orange = 0;
  const secretCopy = [...secret];
  const guessCopy = [...guess];

  // First pass: check for correct place (green)
  for (let i = 0; i < 4; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      green++;
      secretCopy[i] = guessCopy[i] = null as any;
    }
  }
  // Second pass: check for correct digit, wrong place (orange)
  for (let i = 0; i < 4; i++) {
    if (guessCopy[i] != null) {
      const idx = secretCopy.indexOf(guessCopy[i]);
      if (idx !== -1) {
        orange++;
        secretCopy[idx] = null as any;
      }
    }
  }
  return { green, orange };
}

const App: React.FC = () => {
  const [secret, setSecret] = useState<number[]>(generateSecret());
  const [input, setInput] = useState<string>('');
  const [guesses, setGuesses] = useState<{ guess: string; result: { green: number; orange: number } }[]>([]);
  const [won, setWon] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [hasRepeatedDigits, setHasRepeatedDigits] = useState(false);
  const guessesListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new guess is added
  useEffect(() => {
    if (guessesListRef.current) {
      guessesListRef.current.scrollTop = guessesListRef.current.scrollHeight;
    }
  }, [guesses]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (won) return;
      
      const key = e.key;
      
      // Handle digit keys (0-9)
      if (/^[0-9]$/.test(key)) {
        const digit = parseInt(key);
        handleDigitClick(digit);
      }
      // Handle backspace
      else if (key === 'Backspace') {
        handleBackspace();
      }
      // Handle enter
      else if (key === 'Enter') {
        handleGuess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [input, won]);

  const handleDigitClick = (digit: number) => {
    if (input.length >= 4) return;
    
    const newInput = input + digit.toString();
    setInput(newInput);
    
    // Check for repeated digits
    if (newInput.length > 0) {
      const digits = newInput.split('');
      const uniqueDigits = new Set(digits);
      setHasRepeatedDigits(uniqueDigits.size !== digits.length);
    }
  };

  const handleBackspace = () => {
    if (input.length > 0) {
      const newInput = input.slice(0, -1);
      setInput(newInput);
      
      // Recheck for repeated digits
      if (newInput.length > 0) {
        const digits = newInput.split('');
        const uniqueDigits = new Set(digits);
        setHasRepeatedDigits(uniqueDigits.size !== digits.length);
      } else {
        setHasRepeatedDigits(false);
      }
    }
  };

  const handleGuess = () => {
    if (input.length !== 4 || hasRepeatedDigits) return;
    const guessArr = input.split('').map(Number);
    const result = evaluateGuess(secret, guessArr);
    setGuesses([...guesses, { guess: input, result }]);
    setInput('');
    setHasRepeatedDigits(false);
    if (result.green === 4) {
      setWon(true);
      setShowWinPopup(true);
    }
  };

  const handleRestart = () => {
    setSecret(generateSecret());
    setGuesses([]);
    setInput('');
    setWon(false);
    setShowWinPopup(false);
    setHasRepeatedDigits(false);
  };

  const closeWinPopup = () => {
    setShowWinPopup(false);
  };

  const isGuessValid = input.length === 4 && !hasRepeatedDigits;

  return (
    <div className="mastermind-bg">
      {/* Game Title - Moved outside main container */}
      <h1 className="title">🎲 Mastermind</h1>
      
      {/* TOP AREA - Game Content */}
      <div className="game-content">
        <div className="mastermind-container">
          <p className="subtitle">
            Guess the 4-digit code! No repeats.<br />
            Green = right place, Orange = right digit, wrong place.
          </p>
          
          <div className="guesses-list" ref={guessesListRef}>
            {guesses.map((guess, index) => (
              <div key={index} className="guess-row">
                <span className="guess-number">{guess.guess}</span>
                <div className="result-icons">
                  {[...Array(guess.result.green)].map((_, i) => (
                    <span key={`green-${i}`} className="icon green">🟩</span>
                  ))}
                  {[...Array(guess.result.orange)].map((_, i) => (
                    <span key={`orange-${i}`} className="icon orange">🟠</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM AREA - Input and Footer */}
      <div className="bottom-area">
        <div className="input-section">
          <div className="input-container">
            {/* Current Input Display */}
            <div className="input-display">
              {input.split('').map((digit, index) => (
                <span key={index} className="input-digit">{digit}</span>
              ))}
              {[...Array(4 - input.length)].map((_, index) => (
                <span key={`empty-${index}`} className="input-digit empty">_</span>
              ))}
            </div>
            
            {/* Warning Message */}
            <div className="warning-message">
              {hasRepeatedDigits && input.length > 0 && (
                <span>⚠️ Repeated digits are not allowed!</span>
              )}
            </div>
            
            {/* Digit Buttons */}
            <div className="digit-buttons">
              {/* Desktop Layout - 2 rows with action buttons on the right */}
              <div className="digit-row desktop-row">
                {[1, 2, 3, 4, 5].map(digit => (
                  <button
                    key={digit}
                    className="digit-btn"
                    onClick={() => handleDigitClick(digit)}
                    disabled={input.length >= 4 || won}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  className="action-btn backspace-btn"
                  onClick={handleBackspace}
                  disabled={input.length === 0 || won}
                >
                  ←
                </button>
              </div>
              <div className="digit-row desktop-row">
                {[6, 7, 8, 9, 0].map(digit => (
                  <button
                    key={digit}
                    className="digit-btn"
                    onClick={() => handleDigitClick(digit)}
                    disabled={input.length >= 4 || won}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  className="action-btn submit-btn"
                  onClick={handleGuess}
                  disabled={!isGuessValid || won}
                >
                  Submit
                </button>
              </div>
            </div>
            
            {/* Mobile Layout - 4 rows like phone keypad */}
            <div className="mobile-rows">
              <div className="mobile-row">
                {[1, 2, 3].map(digit => (
                  <button
                    key={digit}
                    className="digit-btn mobile-digit"
                    onClick={() => handleDigitClick(digit)}
                    disabled={input.length >= 4 || won}
                  >
                    {digit}
                  </button>
                ))}
              </div>
              <div className="mobile-row">
                {[4, 5, 6].map(digit => (
                  <button
                    key={digit}
                    className="digit-btn mobile-digit"
                    onClick={() => handleDigitClick(digit)}
                    disabled={input.length >= 4 || won}
                  >
                    {digit}
                  </button>
                ))}
              </div>
              <div className="mobile-row">
                {[7, 8, 9].map(digit => (
                  <button
                    key={digit}
                    className="digit-btn mobile-digit"
                    onClick={() => handleDigitClick(digit)}
                    disabled={input.length >= 4 || won}
                  >
                    {digit}
                  </button>
                ))}
              </div>
              <div className="mobile-row">
                <button
                  className="digit-btn mobile-action backspace-btn"
                  onClick={handleBackspace}
                  disabled={input.length === 0 || won}
                >
                  ←
                </button>
                <button
                  className="digit-btn mobile-digit"
                  onClick={() => handleDigitClick(0)}
                  disabled={input.length >= 4 || won}
                >
                  0
                </button>
                <button
                  className="digit-btn mobile-action submit-btn"
                  onClick={handleGuess}
                  disabled={!isGuessValid || won}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Popup */}
      {showWinPopup && (
        <div className="popup-overlay" onClick={closeWinPopup}>
          <div className="win-popup" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You've cracked the code!</p>
            <button className="restart-btn" onClick={handleRestart}>
              Play Again
            </button>
            <button className="close-btn" onClick={closeWinPopup}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
