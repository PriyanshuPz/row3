import { useState } from "react";
import { useGame } from "../context/GameContext";
import { LogOutIcon } from "lucide-react";

export default function MultiplayerLobby() {
  const { gameState, createRoom, joinRoom, leaveRoom, quitGame } = useGame();
  const { roomId } = gameState;

  const [inputText, setInputText] = useState("");

  // If user is in a room, show connecting/waiting screen
  if (roomId) {
    const connectionStatus = gameState.connectionStatus || "connecting";

    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl font-bold text-text">
          {connectionStatus === "connected"
            ? "Connected! Game starting..."
            : "Waiting for opponent..."}
        </h2>
        <p className="text-xl text-text">
          Share this code with a friend:{" "}
          <span className="font-bold">{roomId}</span>
        </p>
        <p className="text-sm text-text/70">Status: {connectionStatus}</p>
        <button
          onClick={leaveRoom}
          className="border-2 p-2 px-4 font-semibold rounded-4xl border-text text-text hover:bg-text hover:text-border transition-all"
        >
          Leave Room
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 max-w-md w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-3xl font-bold text-text nmal-font">
          Multiplayer Lobby
        </h2>
        <div>
          <button
            onClick={() => {
              quitGame();
            }}
            className="p-2 rounded-full hover:bg-border transition-all"
          >
            <LogOutIcon />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 p-6 bg-border/20 rounded-lg w-full">
        <h3 className="text-xl font-bold text-text">Join Room</h3>
        <input
          type="text"
          placeholder="Room Code"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="p-2 rounded-lg bg-border text-text w-full"
        />
        <div className="flex items-center gap-2 justify-center flex-row w-full">
          <button
            onClick={() => joinRoom(inputText)}
            disabled={!inputText.trim() || gameState.status == "connecting"}
            className="p-2 rounded-full hover:bg-border transition-all text-text border-2 px-4 disabled:border-muted disabled:text-muted disabled:hover:bg-white"
          >
            {gameState.status == "connecting" ? "Joining..." : "Join"}
          </button>
        </div>
        <span className="font-bold text-text">OR</span>
        <div className="flex items-center gap-2 justify-center flex-row w-full">
          <button
            onClick={() =>
              createRoom("Room " + Math.floor(Math.random() * 1000))
            }
            className="p-2 rounded-full hover:bg-border transition-all text-text border-2 px-4 disabled:border-muted disabled:text-muted disabled:hover:bg-white"
          >
            {gameState.status == "connecting" ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
