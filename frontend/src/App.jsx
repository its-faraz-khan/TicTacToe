import { useState } from 'react'
import './App.css'

const HUMAN = 'O'
const AI = 'X'
const API_URL = 'http://127.0.0.1:5000/api/move'

const emptyBoard = () => Array(9).fill('')
const initialStats = () => ({ youWins: 0, aiWins: 0, draws: 0, aiPoints: 0 })

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

// returns the AI move number (1-3) on which to deliberately blunder, or null
function planBlunder(diff, currentStats) {
  if (diff === 'hard') return null
  if (diff === 'easy') return Math.floor(Math.random() * 3) + 1
  // medium: only when human is behind, ~30% chance (~1 in 3 games)
  if (currentStats.youWins < currentStats.aiWins && Math.random() < 0.30) {
    return Math.floor(Math.random() * 3) + 1
  }
  return null
}

export default function App() {
  const [screen, setScreen] = useState('start')
  const [difficulty, setDifficulty] = useState('hard')
  const [board, setBoard] = useState(emptyBoard)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [winningLine, setWinningLine] = useState(null)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(initialStats)
  const [blunderOnMove, setBlunderOnMove] = useState(null)
  const [aiMoveCount, setAiMoveCount] = useState(0)

  const resetBoardWith = (diff, currentStats) => {
    setBoard(emptyBoard())
    setGameOver(false)
    setWinner(null)
    setWinningLine(null)
    setThinking(false)
    setError('')
    setAiMoveCount(0)
    setBlunderOnMove(planBlunder(diff, currentStats))
  }

  const resetBoard = () => resetBoardWith(difficulty, stats)

  const startGameWithDifficulty = (diff) => {
    setDifficulty(diff)
    resetBoardWith(diff, stats)
    setScreen('game')
  }

  const exitToStart = () => {
    resetBoard()
    setScreen('start')
  }

  const quit = () => {
    window.close()
    setTimeout(() => setScreen('start'), 50)
  }

  const recordResult = (w) => {
    setStats((s) => {
      if (w === HUMAN) return { ...s, youWins: s.youWins + 1, aiPoints: s.aiPoints - 10 }
      if (w === AI) return { ...s, aiWins: s.aiWins + 1, aiPoints: s.aiPoints + 10 }
      return { ...s, draws: s.draws + 1 }
    })
  }

  const handleClick = async (idx) => {
    if (board[idx] !== '' || gameOver || thinking) return
    const next = [...board]
    next[idx] = HUMAN
    setBoard(next)
    setThinking(true)
    setError('')

    const thisAiMove = aiMoveCount + 1
    const isBlunderTurn = blunderOnMove !== null && thisAiMove === blunderOnMove
    setAiMoveCount(thisAiMove)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: next,
          ai: AI,
          human: HUMAN,
          blunder: isBlunderTurn,
        }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setBoard(data.board)
      if (data.gameOver) {
        setGameOver(true)
        setWinner(data.winner)
        setWinningLine(data.winningLine)
        recordResult(data.winner)
      }
    } catch {
      setError('Cannot reach AI server. Start the Python backend on port 5000.')
    } finally {
      setThinking(false)
    }
  }

  if (screen === 'start') {
    return (
      <StartScreen
        onStart={() => setScreen('difficulty')}
        onInstructions={() => setScreen('instructions')}
        onQuit={quit}
      />
    )
  }

  if (screen === 'difficulty') {
    return (
      <DifficultyScreen
        onPick={startGameWithDifficulty}
        onBack={() => setScreen('start')}
      />
    )
  }

  if (screen === 'instructions') {
    return <InstructionsScreen onBack={() => setScreen('start')} />
  }

  return (
    <GameScreen
      board={board}
      gameOver={gameOver}
      winner={winner}
      winningLine={winningLine}
      thinking={thinking}
      error={error}
      stats={stats}
      difficulty={difficulty}
      onCellClick={handleClick}
      onPlayAgain={resetBoard}
      onExit={exitToStart}
      onReset={resetBoard}
      onChangeDifficulty={() => setScreen('difficulty')}
    />
  )
}

function StartScreen({ onStart, onInstructions, onQuit }) {
  return (
    <div className="screen">
      <h1 className="title">Unbeatable Tic-Tac-Toe</h1>
      <h2 className="brand">TunTunToe</h2>
      <div className="menu">
        <button className="menu-btn primary" onClick={onStart}>Start Game</button>
        <button className="menu-btn" onClick={onInstructions}>Instructions</button>
        <button className="menu-btn" onClick={onQuit}>Quit</button>
      </div>
    </div>
  )
}

function DifficultyScreen({ onPick, onBack }) {
  return (
    <div className="screen">
      <h1 className="title">Select Difficulty</h1>
      <div className="menu">
        <button className="menu-btn primary easy" onClick={() => onPick('easy')}>Easy</button>
        <button className="menu-btn primary medium" onClick={() => onPick('medium')}>Medium</button>
        <button className="menu-btn primary hard" onClick={() => onPick('hard')}>Hard</button>
        <button className="menu-btn" onClick={onBack}>Back</button>
      </div>
      <div className="instructions" style={{ maxWidth: 480 }}>
        <ul>
          <li><b>Easy</b> &mdash; AI makes one mistake every game.</li>
          <li><b>Medium</b> &mdash; AI occasionally slips when you&apos;re behind on wins.</li>
          <li><b>Hard</b> &mdash; Pure Minimax. AI never blunders.</li>
        </ul>
      </div>
    </div>
  )
}

function InstructionsScreen({ onBack }) {
  return (
    <div className="screen">
      <h1 className="title">How to Play</h1>
      <div className="instructions">
        <ul>
          <li>You play as <b style={{ color: '#E75480' }}>O</b>; the AI plays as <b>X</b>.</li>
          <li>You always go first. Click any empty cell to place your symbol.</li>
          <li>First to get 3 in a row, column, or diagonal wins.</li>
          <li>If the board fills with no winner, it&apos;s a draw.</li>
        </ul>
        <h3 className="subhead">Difficulty</h3>
        <ul>
          <li><b>Easy</b>: AI makes one blunder every game.</li>
          <li><b>Medium</b>: AI may blunder ~1 in 3 games when you&apos;re behind.</li>
          <li><b>Hard</b>: Unbeatable Minimax with Alpha-Beta pruning.</li>
        </ul>
        <h3 className="subhead">Scoring</h3>
        <ul>
          <li><b>+10</b> points to AI for an AI win.</li>
          <li><b>-10</b> points to AI for a user win.</li>
          <li><b>0</b> points for a draw.</li>
        </ul>
      </div>
      <button className="menu-btn primary" onClick={onBack}>Back</button>
    </div>
  )
}

function GameScreen({
  board, gameOver, winner, winningLine, thinking, error, stats, difficulty,
  onCellClick, onPlayAgain, onExit, onReset, onChangeDifficulty,
}) {
  const isWinCell = (i) => Array.isArray(winningLine) && winningLine.includes(i)
  const yourTurn = !gameOver && !thinking

  const endMessage = (() => {
    if (winner === 'draw') return "No Winner! It's a Draw"
    if (winner === HUMAN) return `You Win! (${HUMAN})`
    if (winner === AI) return `AI Wins! (${AI})`
    return ''
  })()

  const endDelta = (() => {
    if (winner === HUMAN) return '-10 to AI'
    if (winner === AI) return '+10 to AI'
    if (winner === 'draw') return '0 points'
    return ''
  })()

  return (
    <>
      {gameOver && (
        <div className="overlay">
          <div className="win-container">
            <h1 id="msg">{endMessage}</h1>
            <div className="delta">{endDelta}</div>
            <div className="overlay-actions">
              <button className="menu-btn primary" onClick={onPlayAgain}>Play Again</button>
              <button className="menu-btn" onClick={onExit}>Exit</button>
            </div>
          </div>
        </div>
      )}

      <h1 id="name">TunTunToe</h1>
      <div className="subtitle">Unbeatable Tic-Tac-Toe</div>

      <div className="difficulty-row">
        <span className={`diff-badge diff-${difficulty}`}>
          Difficulty: {DIFFICULTY_LABEL[difficulty]}
        </span>
        <button className="link-btn" onClick={onChangeDifficulty}>change</button>
      </div>

      <div className="stats">
        <div className="stat"><span>You</span><b>{stats.youWins}</b></div>
        <div className="stat"><span>AI</span><b>{stats.aiWins}</b></div>
        <div className="stat"><span>Draws</span><b>{stats.draws}</b></div>
        <div className="stat points"><span>AI Score</span><b>{stats.aiPoints >= 0 ? `+${stats.aiPoints}` : stats.aiPoints}</b></div>
      </div>

      <div className="turn-indicator">
        <span className={`turn ${yourTurn ? 'active' : ''}`}>
          <span className="dot you" /> Your Turn (O)
        </span>
        <span className={`turn ${thinking ? 'active' : ''}`}>
          <span className="dot ai" /> AI&apos;s Turn (X)
        </span>
      </div>

      <div className="container">
        <div className="game">
          {board.map((cell, i) => (
            <button
              key={i}
              className={`box ${isWinCell(i) ? 'win' : ''}`}
              onClick={() => onCellClick(i)}
              disabled={cell !== '' || gameOver || thinking}
              style={{ color: cell === HUMAN ? '#E75480' : '#000000' }}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>

      <div className="status">{error || (thinking ? 'AI is thinking...' : '')}</div>

      <div className="game-actions">
        <button className="btn" onClick={onReset}>Reset</button>
        <button className="btn menu" onClick={onExit}>Menu</button>
      </div>
    </>
  )
}
