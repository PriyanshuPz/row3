import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useGameStore } from "../lib/store";
import type { GameMode, GameStatus, PlayerType, Room } from "../lib/store";

// Define the game state interface
interface GameState {
  mode: GameMode;
  status: GameStatus;
  board: (PlayerType | null)[];
  currentPlayer: PlayerType;
  winner: PlayerType | "draw" | null;
  roomId: string | null;
  rooms: Room[];
}

// Define the context interface
interface GameContextProps {
  gameState: GameState;
  resetGame: () => void;
  makeMove: (index: number) => void;
  setGameMode: (mode: GameMode) => void;
  quitGame: () => void;
  createRoom: (name: string) => void;
  joinRoom: (joinCode: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
}

// Create the context
export const GameContext = createContext<GameContextProps | undefined>(
  undefined
);

// Game provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const store = useGameStore();

  const contextValue: GameContextProps = {
    gameState: {
      mode: store.mode,
      status: store.status,
      board: store.board,
      currentPlayer: store.currentPlayer,
      winner: store.winner,
      roomId: store.roomId,
      rooms: store.rooms,
    },
    resetGame: store.resetGame,
    makeMove: store.makeMove,
    quitGame: store.quitGame,
    setGameMode: store.setGameMode,
    createRoom: store.createRoom,
    joinRoom: store.joinRoom,
    leaveRoom: store.leaveRoom,
    sendMessage: store.sendMessage,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
