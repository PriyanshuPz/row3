import { useGame } from "../../context/GameContext";
import { playSound } from "../../lib/sounds";
import { cn } from "../../lib/utils";
import XO from "./x-o";

export default function BoardView() {
  const { gameState, makeMove, resetGame } = useGame();
  const { board, status, connectionStatus } = gameState;

  const renderCell = (index: number) => {
    const cell = board[index];
    return (
      <button
        key={index}
        onClick={() => {
          playSound("click");
          makeMove(index);
        }}
        disabled={
          cell !== null ||
          status === "finished" ||
          (gameState.mode == "multiplayer" && connectionStatus !== "connected")
        }
        className={cn(
          "w-24 h-24 bg-border rounded-lg flex items-center justify-center",
          "transition-all duration-300 hover:bg-border/80",
          cell === null && status !== "finished" && "hover:scale-105"
        )}
      >
        {cell && (
          <XO
            type={cell}
            color={cell === "X" ? "#41bdd6" : "#d7bafb"}
            size={80}
          />
        )}
      </button>
    );
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "grid grid-cols-3 grid-rows-3 gap-2 transition-opacity duration-500",
          status === "finished" && "opacity-70"
        )}
      >
        {Array.from({ length: 9 }).map((_, index) => renderCell(index))}
      </div>

      {status === "finished" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-xs animate-fadeIn">
          <button
            onClick={() => {
              playSound("click");
              resetGame();
            }}
            className="px-6 py-4 bg-secondary/70 text-white rounded-md font-bold text-xl hover:bg-secondary transition-all duration-300 animate-bounceIn hover:scale-105 shadow-lg hover:shadow-secondary/30"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
