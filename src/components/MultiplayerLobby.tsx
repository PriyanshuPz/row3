import { useState } from "react";
import { useGame } from "../context/GameContext";
import { Highlighter } from "./hightlighter";
import { LogOutIcon } from "lucide-react";

export default function MultiplayerLobby() {
  const { gameState, createRoom, joinRoom, leaveRoom, quitGame } = useGame();
  const { rooms, roomId } = gameState;

  const [inputText, setInputText] = useState("");

  // If user is in a room, show loading screen
  if (roomId) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl font-bold text-text">
          <Highlighter action="highlight" color="#41bdd6">
            Waiting for opponent...
          </Highlighter>
        </h2>
        <p className="text-xl text-text">
          Share this code with a friend:{" "}
          <span className="font-bold">
            {rooms.find((r) => r.id === roomId)?.joinCode || ""}
          </span>
        </p>
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
        <h3 className="text-xl font-bold text-text">Create a Room or Join</h3>
        <input
          type="text"
          placeholder="Room Name or Code"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="p-2 rounded-lg bg-border text-text w-full"
        />
        <div className="flex items-center gap-2 justify-end flex-row w-full">
          <button
            onClick={() => createRoom(inputText)}
            disabled={!inputText.trim()}
            className="p-2 rounded-full hover:bg-border transition-all text-text border-2 px-4 disabled:border-muted disabled:text-muted disabled:hover:bg-white"
          >
            Create
          </button>
          <button
            onClick={() => joinRoom(inputText)}
            disabled={!inputText.trim()}
            className="p-2 rounded-full hover:bg-border transition-all text-text border-2 px-4 disabled:border-muted disabled:text-muted disabled:hover:bg-white"
          >
            Join
          </button>
        </div>
      </div>

      <div className="w-full">
        <h3 className="text-xl font-bold text-text mb-2">Available Rooms</h3>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="p-3 bg-border rounded-lg flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-text">{room.name}</h4>
                <p className="text-sm text-text/70">
                  Players: {room.players}/{room.maxPlayers}
                </p>
              </div>
              <button
                onClick={() => joinRoom(room.joinCode)}
                disabled={room.players >= room.maxPlayers}
                className="border-2 p-1 px-3 text-sm font-semibold rounded-4xl border-text text-text hover:bg-text hover:text-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
