import { useState } from "react";
import { useGame } from "../context/GameContext";
import RoughXO from "./game/x-o";
import { cn } from "../lib/utils";

export default function MultiplayerGame() {
  const { gameState, makeMove, resetGame, leaveRoom, sendMessage } = useGame();
  const { board, currentPlayer, winner, status } = gameState;

  const [message, setMessage] = useState("");
  // Mock chat for UI demonstration
  const [chatMessages, setChatMessages] = useState([
    { sender: "System", text: "Welcome to the game!" },
    { sender: "Opponent", text: "Hello there! Ready to play?" },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add the message to the chat
      setChatMessages((prev) => [...prev, { sender: "You", text: message }]);

      // Send the message (mock)
      sendMessage(message);

      // Clear the input
      setMessage("");

      // Simulate opponent response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { sender: "Opponent", text: "I'm thinking about my next move..." },
        ]);
      }, 1500);
    }
  };

  const renderCell = (index: number) => {
    const cell = board[index];
    return (
      <button
        key={index}
        onClick={() => makeMove(index)}
        disabled={cell !== null || status === "finished"}
        className={cn(
          "w-20 h-20 bg-border rounded-lg flex items-center justify-center",
          "transition-all duration-300 hover:bg-border/80",
          cell === null && status !== "finished" && "hover:scale-105"
        )}
      >
        {cell && (
          <RoughXO
            type={cell}
            color={cell === "X" ? "#4d6986" : "#d7bafb"}
            size={70}
          />
        )}
      </button>
    );
  };

  const renderStatus = () => {
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
              "flex items-center justify-between"
            )}
          >
            <span className="px-4 text-4xl font-bold text-text/90 nmal-font tracking-wide">
              Winner
            </span>
            <span
              className={cn(
                "p-4 px-6 rounded-r-sm text-4xl text-white w-20 text-center",
                winner === "O" ? "bg-primary" : "bg-secondary"
              )}
            >
              {winner}
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
                "p-4 px-6 rounded-r-sm text-4xl text-white w-20 text-center",
                currentPlayer === "X" ? "bg-primary" : "bg-secondary"
              )}
            >
              {currentPlayer}
            </span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex items-start justify-center gap-8">
      <div className="flex flex-col items-center">
        <div className="text-xl font-bold text-text mb-4">{renderStatus()}</div>
        <div className="grid grid-cols-3 grid-rows-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => renderCell(index))}
        </div>
        <div className="mt-4 flex gap-2">
          {status === "finished" && (
            <button
              onClick={resetGame}
              className="border-2 p-2 px-4 font-semibold rounded-4xl border-text text-text hover:bg-text hover:text-border transition-all"
            >
              Play Again
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="border-2 p-2 px-4 font-semibold rounded-4xl border-text text-text hover:bg-text hover:text-border transition-all"
          >
            Leave Game
          </button>
        </div>
      </div>

      <div className="w-64 bg-border/20 rounded-lg p-4 flex flex-col h-80">
        <h3 className="text-lg font-bold text-text mb-2">Chat</h3>
        <div className="flex-1 overflow-y-auto mb-2">
          {chatMessages.map((msg, i) => (
            <div key={i} className="mb-2">
              <span
                className={cn(
                  "font-bold",
                  msg.sender === "You"
                    ? "text-primary"
                    : msg.sender === "Opponent"
                    ? "text-secondary"
                    : "text-text"
                )}
              >
                {msg.sender}:
              </span>{" "}
              <span className="text-text">{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg bg-border text-text"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-text text-border rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
