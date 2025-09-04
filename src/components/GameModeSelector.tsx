import { toast } from "sonner";
import { useGame } from "../context/GameContext";

export default function GameModeSelector() {
  const { setGameMode } = useGame();

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-6xl font-bold text-text tracking-wide game-font text-center leading-tight">
        Let's Play <br />
        <span className="text-secondary font-outline-2">Row</span>
        <span className="text-primary font-outline-2">3</span> Game!
      </h1>
      <div className="flex gap-4">
        <button
          onClick={() => setGameMode("offline")}
          className="border-2 p-3 px-6 font-semibold rounded-4xl border-primary text-primary hover:bg-primary hover:text-white transition-all"
        >
          Play Now
        </button>
        <button
          onClick={() => {
            toast.info("Comming Soon!");
            // setGameMode("multiplayer");
          }}
          className="border-2 p-3 px-6 font-semibold rounded-4xl border-secondary text-secondary hover:bg-secondary hover:text-white transition-all"
        >
          Play Online
        </button>
      </div>

      <a
        href="https://handwar.p8labs.tech"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 w-full max-w-md rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-border hover:border-secondary transition-all duration-300 hover:shadow-lg"
      >
        <div className="flex flex-col items-center">
          <div className="p-4 text-center">
            <h3 className="text-xl font-bold text-text game-font">
              Also, Try{" "}
              <span className="text-secondary font-outline-2">Hand</span>
              <span className="text-primary font-outline-2">War</span>!
            </h3>
            <p className="text-text/80 mt-1">
              Challenge friends in this exciting new game!
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}
