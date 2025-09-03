import { useGame } from "../../context/GameContext";
import { cn } from "../../lib/utils";

export default function StatusView() {
  const { gameState } = useGame();
  const { currentPlayer, winner } = gameState;

  if (winner === "draw") {
    return (
      <div className="flex w-full">
        <span className="p-4 rounded-sm w-full text-4xl text-center bg-border font-bold text-text tracking-wide nmal-font">
          It's a Draw
        </span>
      </div>
    );
  } else if (winner) {
    return (
      <div className="flex w-full">
        <div
          className={cn(
            "rounded-sm w-full bg-border font-bold",
            "flex items-center"
          )}
        >
          <span
            className={cn(
              "p-4 px-6 rounded-r-sm text-4xl text-white w-20 text-center game-font",
              winner === "O" ? "bg-primary" : "bg-secondary"
            )}
          >
            {winner}
          </span>
          <span className="px-4 ml-4 text-4xl font-bold text-text/90 nmal-font tracking-wide">
            You Won!
          </span>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex w-full">
        <div
          className={cn(
            "rounded-sm w-full bg-border font-bold",
            "flex items-center justify-between"
          )}
        >
          <span className="px-4 text-4xl font-bold text-text/90 nmal-font tracking-wide">
            Your Turn
          </span>
          <span
            className={cn(
              "p-4 px-6 rounded-r-sm text-4xl text-white w-20 text-center game-font",
              currentPlayer === "X" ? "bg-primary" : "bg-secondary"
            )}
          >
            {currentPlayer}
          </span>
        </div>
      </div>
    );
  }
}
