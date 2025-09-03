import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playSound, initSounds } from "./sounds";

// Game modes
export type GameMode = "offline" | "multiplayer" | null;

// Game status
export type GameStatus = "waiting" | "playing" | "finished";

// Player types
export type PlayerType = "X" | "O";

// Define the structure for a room
export interface Room {
  id: string;
  name: string;
  joinCode: string;
  players: number;
  maxPlayers: number;
}

// Define the game state
export interface GameState {
  mode: GameMode;
  status: GameStatus;
  board: (PlayerType | null)[];
  currentPlayer: PlayerType;
  winner: PlayerType | "draw" | null;
  roomId: string | null;
  rooms: Room[];
}

// Define actions for the store
interface GameStore extends GameState {
  resetGame: () => void;
  quitGame: () => void;
  makeMove: (index: number) => void;
  setGameMode: (mode: GameMode) => void;
  createRoom: (name: string) => void;
  joinRoom: (joinCode: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
}

// Initial state
const initialState: GameState = {
  mode: null,
  status: "waiting",
  board: Array(9).fill(null),
  currentPlayer: "X",
  winner: null,
  roomId: null,
  rooms: [],
};

// Helper function to check for winner
const checkWinner = (
  board: (PlayerType | null)[]
): PlayerType | "draw" | null => {
  // Define winning combinations
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  // Check for winner
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as PlayerType;
    }
  }

  // Check for draw
  if (board.every((cell) => cell !== null)) {
    return "draw";
  }

  return null;
};

// Create the store with persistence
export const useGameStore = create<GameStore>()(
  persist(
    (set) => {
      // Initialize sounds
      initSounds();

      return {
        // Initial state
        ...initialState,
        quitGame: () => set(initialState),
        // Actions
        resetGame: () =>
          set((state) => ({
            ...state,
            board: Array(9).fill(null),
            currentPlayer: "X",
            status: "playing",
            winner: null,
          })),

        makeMove: (index) =>
          set((state) => {
            // Check if the cell is already filled or game is finished
            if (state.board[index] || state.status === "finished") {
              return state;
            }

            // Create a new board with the move
            const newBoard = [...state.board];
            newBoard[index] = state.currentPlayer;

            // Check for winner
            const winner = checkWinner(newBoard);
            const newStatus = winner ? "finished" : "playing";

            // Play appropriate sound effect
            playSound("move");
            if (winner === "draw") {
              playSound("draw");
            } else if (winner) {
              playSound("win");
            }

            return {
              ...state,
              board: newBoard,
              currentPlayer: state.currentPlayer === "X" ? "O" : "X",
              status: newStatus,
              winner,
            };
          }),

        setGameMode: (mode) =>
          set(() => {
            if (mode === "multiplayer") {
              // Generate mock rooms for UI demonstration
              const mockRooms = [
                {
                  id: "1",
                  name: "Room 1",
                  joinCode: "ABC123",
                  players: 1,
                  maxPlayers: 2,
                },
                {
                  id: "2",
                  name: "Room 2",
                  joinCode: "DEF456",
                  players: 0,
                  maxPlayers: 2,
                },
                {
                  id: "3",
                  name: "Room 3",
                  joinCode: "GHI789",
                  players: 1,
                  maxPlayers: 2,
                },
              ];

              return {
                ...initialState,
                mode,
                rooms: mockRooms,
              };
            } else {
              return {
                ...initialState,
                mode,
                status: "playing",
              };
            }
          }),

        createRoom: (name) =>
          set((state) => {
            const joinCode = Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase();
            const newRoom = {
              id: Date.now().toString(),
              name,
              joinCode,
              players: 1,
              maxPlayers: 2,
            };

            return {
              ...state,
              rooms: [...state.rooms, newRoom],
              roomId: newRoom.id,
              status: "waiting",
            };
          }),

        joinRoom: (joinCode) =>
          set((state) => {
            const room = state.rooms.find((r) => r.joinCode === joinCode);
            if (room && room.players < room.maxPlayers) {
              return {
                ...state,
                roomId: room.id,
                status: "playing",
              };
            }
            return state;
          }),

        leaveRoom: () =>
          set((state) => ({
            ...state,
            roomId: null,
            status: "waiting",
          })),

        sendMessage: (_message: string) => {
          // This is just a mock function for now
          console.log("Message sent:", _message);
        },
      };
    },
    {
      name: "row3-game-storage", // unique name for localStorage
      version: 1, // version number for storage schema
    }
  )
);
