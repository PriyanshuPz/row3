import { useState } from "react";
import { useGame } from "../context/GameContext";
import {
  LogOutIcon,
  Share2Icon,
  Users2Icon,
  PlusIcon,
  PlayIcon,
  Loader,
} from "lucide-react";
import { toast } from "sonner";

export default function MultiplayerLobby() {
  const { gameState, createRoom, joinRoom, leaveRoom, quitGame } = useGame();
  const { roomId } = gameState;

  const [inputText, setInputText] = useState("");

  if (roomId) {
    const connectionStatus = gameState.connectionStatus || "connecting";
    const isConnected = connectionStatus === "connected";

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md animate-fadeIn">
        <div className="w-full p-8">
          <div className="flex flex-col items-center gap-6">
            <div className={`relative flex items-center justify-center`}>
              <div
                className={`w-16 h-16 rounded-full ${
                  isConnected ? "bg-secondary/10" : "bg-primary/10"
                }`}
              ></div>
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
                  isConnected ? "bg-secondary" : "bg-primary"
                }`}
              >
                <Users2Icon size={24} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-medium text-text">
              {isConnected ? "Connected!" : "Waiting for opponent..."}
            </h2>

            <div className="w-full p-4 bg-border/20 rounded-lg flex items-center justify-between">
              <p className="text-text">
                Room Code:{" "}
                <span className="font-bold tracking-wide">{roomId}</span>
              </p>
              <button
                className="p-2 rounded-full hover:bg-border transition-colors"
                title="Copy to clipboard"
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  toast.info("Room code copied!");
                }}
              >
                <Share2Icon size={18} className="text-primary" />
              </button>
            </div>

            <div className="text-sm text-text/60">
              Status:{" "}
              <span
                className={`font-medium ${
                  isConnected ? "text-secondary" : "text-primary"
                }`}
              >
                {connectionStatus}
              </span>
            </div>

            <button
              onClick={leaveRoom}
              className="w-full mt-2 py-3 rounded-lg bg-text/5 text-text hover:bg-text/10 transition-all font-medium"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md animate-fadeIn">
      <div className="flex items-center justify-between w-full mb-6 px-1">
        <h2 className="text-2xl font-bold text-text">Multiplayer</h2>
        <button
          onClick={quitGame}
          className="p-2 rounded-full hover:bg-border transition-all"
          aria-label="Quit game"
        >
          <LogOutIcon size={20} className="text-text/70" />
        </button>
      </div>

      <div className="w-full p-6">
        <div className="flex flex-col gap-4 mb-6">
          <h3 className="text-lg font-medium text-text">Join a Room</h3>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Enter room code"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-1 py-2 pl-4 pr-12 rounded-sm bg-border/10 ring-1 ring-secondary/10 border-border text-text focus:outline-none focus:ring-secondary transition-all"
            />
            <button
              onClick={() => joinRoom(inputText)}
              disabled={!inputText.trim() || gameState.status === "connecting"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 transition-all disabled:text-muted text-secondary bg-secondary/10 rounded-full disabled:bg-muted/10 hover:bg-secondary/10 hover:text-secondary/90"
            >
              {gameState.status === "connecting" ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <PlayIcon size={18} />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-border flex-grow"></div>
          <span className="text-xs text-text/40 uppercase font-medium">or</span>
          <div className="h-px bg-border flex-grow"></div>
        </div>

        <button
          onClick={() => createRoom("Room " + Math.floor(Math.random() * 1000))}
          disabled={gameState.status === "connecting"}
          className="w-full py-3 rounded-sm bg-secondary text-white hover:bg-secondary/90 transition-all disabled:bg-muted disabled:text-white/70 flex items-center justify-center gap-2"
        >
          <PlusIcon size={18} />
          <span>
            {gameState.status === "connecting"
              ? "Creating..."
              : "Create New Room"}
          </span>
        </button>
      </div>
    </div>
  );
}
