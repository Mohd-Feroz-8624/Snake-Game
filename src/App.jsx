import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";

const BLOCK = 50; // px
const INITIAL_SPEED = 160; // ms

export default function App() {
  const boardRef = useRef(null);
  // snake positions using (row, col)
  const [snake, setSnake] = useState([
    { row: 3, col: 5 },
    { row: 4, col: 5 },
    { row: 5, col: 5 },
  ]);
  const [direction, setDirection] = useState("top");
  const [nextDirection, setNextDirection] = useState("left"); // To prevent rapid direction changes

  const [cols, setCols] = useState(1);
  const [rows, setRows] = useState(1);
  const [count, setCount] = useState(0);

  const [food, setFood] = useState({ row: 2, col: 2 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0); // in seconds

  useEffect(() => {
    const dom = boardRef.current;
    if (!dom) return;

    function calculate() {
      const clientWidth = dom.clientWidth;
      const clientHeight = dom.clientHeight;
      const newCols = Math.max(1, Math.floor(clientWidth / BLOCK));
      const newRows = Math.max(1, Math.floor(clientHeight / BLOCK));

      setCols(newCols);
      setRows(newRows);
      setCount(newCols * newRows);

      // Check if food is out of bounds and regenerate if needed
      const snakeSet = new Set();
      snake.forEach((s) => snakeSet.add(`${s.row}-${s.col}`));
      if (
        food.row >= newRows ||
        food.col >= newCols ||
        food.row < 0 ||
        food.col < 0
      ) {
        let newFood;
        do {
          newFood = {
            row: Math.floor(Math.random() * newRows),
            col: Math.floor(Math.random() * newCols),
          };
        } while (snakeSet.has(`${newFood.row}-${newFood.col}`));
        setFood(newFood);
      }
    }

    calculate();
    window.addEventListener("resize", calculate);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(calculate);
      resizeObserver.observe(dom);
    }

    return () => {
      window.removeEventListener("resize", calculate);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [snake, food]); // Added dependencies to recalculate when snake or food changes, but since it's in calculate, it's fine

  // fast lookup for snake positions
  const snakeSet = useMemo(() => {
    const newSnake = new Set();
    snake.forEach((s) => newSnake.add(`${s.row}-${s.col}`));
    return newSnake;
  }, [snake]);

  // Generate random food position not on snake
  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols),
      };
    } while (snakeSet.has(`${newFood.row}-${newFood.col}`));
    setFood(newFood);
  }, [rows, cols, snakeSet]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return;

    setDirection(nextDirection);
    const head = snake[0];
    let newHead;
    if (nextDirection === "left") {
      newHead = { row: head.row, col: head.col - 1 };
    } else if (nextDirection === "right") {
      newHead = { row: head.row, col: head.col + 1 };
    } else if (nextDirection === "up") {
      newHead = { row: head.row - 1, col: head.col };
    } else if (nextDirection === "down") {
      newHead = { row: head.row + 1, col: head.col };
    }

    // Check wall collision
    if (
      newHead.row < 0 ||
      newHead.row >= rows ||
      newHead.col < 0 ||
      newHead.col >= cols
    ) {
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    // Check self collision
    if (snakeSet.has(`${newHead.row}-${newHead.col}`)) {
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    const newSnake = [newHead, ...snake];

    // Check if food eaten
    if (newHead.row === food.row && newHead.col === food.col) {
      setScore(score + 1);
      generateFood();
    } else {
      newSnake.pop(); // Remove tail if no food
    }

    setSnake(newSnake);
  }, [
    snake,
    nextDirection,
    rows,
    cols,
    snakeSet,
    food,
    score,
    gameOver,
    isPlaying,
    generateFood,
  ]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake, isPlaying, gameOver]);

  // Timer
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, gameOver]);

  // Spacebar controls
  useEffect(() => {
    function handleKey(e) {
      if (e.code === "Space") {
        e.preventDefault(); // stops page from scrolling
        setIsPlaying((prev) => !prev);
      }
      if (e.code === "Escape") {
        e.preventDefault();
        setFood({ row: 2, col: 2 });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      if (e.key === "ArrowLeft" && direction !== "right") {
        setNextDirection("left");
      } else if (e.key === "ArrowRight" && direction !== "left") {
        setNextDirection("right");
      } else if (e.key === "ArrowUp" && direction !== "down") {
        setNextDirection("up");
      } else if (e.key === "ArrowDown" && direction !== "up") {
        setNextDirection("down");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, isPlaying]);

  // Reset game
  const resetGame = () => {
    setSnake([
      { row: 3, col: 5 },
      { row: 4, col: 5 },
      { row: 5, col: 5 },
    ]);
    setDirection("left");
    setNextDirection("left");
    // Generate food instead of fixed position
    const snakeSet = new Set();
    snake.forEach((p) => snakeSet.add(`${p.row}-${p.col}`));
    let newFood;
    do {
      newFood = {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols),
      };
    } while (snakeSet.has(`${newFood.row}-${newFood.col}`));
    setFood(newFood);
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
    setTime(0);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Touch controls
  const handleDirection = (dir) => {
    if (!isPlaying || gameOver) return;
    if (dir === "left" && direction !== "right") {
      setNextDirection("left");
    } else if (dir === "right" && direction !== "left") {
      setNextDirection("right");
    } else if (dir === "up" && direction !== "down") {
      setNextDirection("up");
    } else if (dir === "down" && direction !== "up") {
      setNextDirection("down");
    }
  };

  return (
    <div className="h-[90vh] w-screen m-auto gap-1 flex flex-col py-2">
      <div
        ref={boardRef}
        className={`m-auto mt-3 board w-[99%] overflow-hidden border ${
          gameOver ? "blur-sm" : ""
        }`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(${BLOCK}px, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(${BLOCK}px, 1fr))`,
          gap: "3px",
          height: "100%",
          width: "100%",
          margin: "auto",
        }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const row = Math.floor(i / (cols || 1));
          const col = i % (cols || 1);
          const key = `${row}-${col}`;
          const isSnake = snakeSet.has(key);
          const isFood = food.row === row && food.col === col;

          return (
            <div
              key={key}
              className={`flex items-center justify-center text-[10px] ${
                isSnake
                  ? "bg-white text-black"
                  : isFood
                  ? "bg-red-500 text-white"
                  : "bg-violet-900 text-white"
              } border`}
              style={{
                width: `${BLOCK}px`,
                height: `${BLOCK}px`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {gameOver && isSnake ? "💀" : isFood ? "🍎" : ""}
            </div>
          );
        })}
      </div>

      {/* Touch Controls */}
      <div className="  sm:hidden flex flex-col items-center mt-4 ">
        <div className="grid   grid-cols-3 gap-2 mb-4   border-amber-200">
          <div></div>
          <button
            onClick={() => handleDirection("up")}
            className="w-16 h-16 bg-blue-500 text-white text-2xl rounded-full hover:bg-blue-600 disabled:opacity-50"
            disabled={!isPlaying || gameOver}
          >
            ↑
          </button>
          <div></div>
          <button
            onClick={() => handleDirection("left")}
            className="w-16 h-16 bg-blue-500 text-white text-2xl rounded-full hover:bg-blue-600 disabled:opacity-50"
            disabled={!isPlaying || gameOver}
          >
            ←
          </button>
          <div></div>
          <button
            onClick={() => handleDirection("right")}
            className="w-16 h-16 bg-blue-500 text-white text-2xl rounded-full hover:bg-blue-600 disabled:opacity-50"
            disabled={!isPlaying || gameOver}
          >
            →
          </button>
          <div></div>
          <button
            onClick={() => handleDirection("down")}
            className="w-16 h-16 bg-blue-500 text-white text-2xl rounded-full hover:bg-blue-600 disabled:opacity-50"
            disabled={!isPlaying || gameOver}
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      <div className="flex justify-evenly items-center w-full mt-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-3 h-9  flex justify-center bg-green-600 w-19 text-white text-2xl rounded hover:bg-green-800 disabled:opacity-50"
          disabled={gameOver}
        >
          {isPlaying && !gameOver ? "Pause" : "Play"}
        </button>
        <div className="score px-10  py-3 h-9  flex  justify-center bg-blue-600 w-29 text-white text-2xl rounded hover:bg-blue-900 cursor-pointer">
          Score:{score}
        </div>
        <div className="px-6  py-3 h-9  flex justify-center bg-amber-600 w-19 text-white text-2xl rounded hover:bg-green-800 time  disabled:opacity-50">
          {formatTime(time)}
        </div>
      </div>
      <div className="text-center mt-2 hidden  md:block">
        Use arrow keys or touch controls to change direction. Space or play
        button to pause/play.
      </div>

      {gameOver && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white h-50 flex  gap-4 flex-col items-center justify-center w-60 rounded-lg text-center shadow-lg  ">
            <h2 className="text-4xl text-black mb-4">Game Over!</h2>
            <p className="text-2xl text-black mb-4">Final Score: {score}</p>

            <button
              onClick={resetGame}
              className="px-6 py-4 h-10 w-40 bg-green-500 text-white text-2xl rounded hover:bg-green-600"
            >
              Start Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
