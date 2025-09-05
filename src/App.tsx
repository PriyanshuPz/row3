import { GameProvider, useGame } from "./context/GameContext";
import GameModeSelector from "./components/GameModeSelector";
import OfflineGame from "./components/OfflineGame";
import MultiplayerLobby from "./components/MultiplayerLobby";
import MultiplayerGame from "./components/MultiplayerGame";
import { Toaster } from "sonner";

function GameContent() {
  const { gameState } = useGame();
  const { mode, status, roomId } = gameState;

  // If status is waiting and no specific mode is selected, show the mode selector
  if (status === "waiting" && mode !== "offline" && mode !== "multiplayer") {
    return <GameModeSelector />;
  }
  if (status === "connecting" && mode !== "offline" && mode !== "multiplayer") {
    return <GameModeSelector />;
  }

  // If offline mode is selected, show the offline game
  if (mode === "offline") {
    return <OfflineGame />;
  }

  // If multiplayer mode is selected and not in a room, show the lobby
  if (mode === "multiplayer" && !roomId) {
    return <MultiplayerLobby />;
  }

  // If in a multiplayer game and waiting for an opponent
  if (mode === "multiplayer" && roomId && status === "waiting") {
    return <MultiplayerLobby />;
  }

  if (mode === "multiplayer" && roomId && status === "connecting") {
    return <MultiplayerLobby />;
  }

  // If in a multiplayer game and playing
  if (
    mode === "multiplayer" &&
    roomId &&
    (status === "playing" || status === "finished")
  ) {
    return <MultiplayerGame />;
  }

  // Default to mode selector
  return <GameModeSelector />;
}

export default function App() {
  return (
    <GameProvider>
      <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Toaster
          expand={false}
          visibleToasts={1}
          position="top-center"
          toastOptions={{
            unstyled: true,
            classNames: {
              content: "text-center",
              toast:
                "bg-primary text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 w-full text-center",
              description: "text-xs mt-1 text-blue-200",
              title: "text-sm text-center",
            },
          }}
        />
        <GameContent />
      </div>
    </GameProvider>
  );
}
