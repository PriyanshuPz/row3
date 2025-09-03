import { useGame } from "../context/GameContext";
import { playSound } from "../lib/sounds";
import SoundControl from "./SoundControl";
import { LogOutIcon } from "lucide-react";
import StatusView from "./game/status-view";
import BoardView from "./game/board-view";

export default function OfflineGame() {
  const { quitGame } = useGame();

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="flex justify-between w-full">
        <SoundControl />
        <button
          onClick={() => {
            playSound("click");
            quitGame();
          }}
          className="p-2 rounded-full hover:bg-border transition-all"
        >
          <LogOutIcon />
        </button>
      </div>

      <BoardView />
      <StatusView />
    </div>
  );
}
