import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playSound, initSounds } from "./sounds";
import {
  closePeerConnection,
  completeConnection,
  createPeerConnection,
  isPeerConnected,
  joinPeerConnection,
  registerConnectionCallback,
  sendMessage as sendWebRTCMessage,
  unregisterConnectionCallback,
  type PeerConnection,
} from "./webrtc";
import {
  createFirebaseRoom,
  deleteRoom,
  findRoomByCode,
  updateRoomWithAnswer,
} from "./firebase";

// Game modes
export type GameMode = "offline" | "multiplayer" | null;

// Game status
export type GameStatus = "waiting" | "connecting" | "playing" | "finished";

// Player types
export type PlayerType = "X" | "O";

// Define message types for WebRTC
export interface GameMessage {
  type: "move" | "reset" | "chat" | "disconnect";
  data: any;
}

// Define the game state
export interface GameState {
  mode: GameMode;
  status: GameStatus;
  board: (PlayerType | null)[];
  currentPlayer: PlayerType;
  winner: PlayerType | "draw" | null;
  roomId: string | null;
  isHost: boolean;
  playerType: PlayerType | null;
  chatMessages: Array<{ sender: string; text: string }>;
  connectionStatus: string;
}

// WebRTC peer connection storage (not persisted)
let peerConnection: PeerConnection | null = null;

// Define actions for the store
interface GameStore extends GameState {
  resetGame: () => void;
  quitGame: () => void;
  makeMove: (index: number) => void;
  setGameMode: (mode: GameMode) => void;
  createRoom: (name: string) => Promise<void>;
  joinRoom: (joinCode: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendMessage: (message: string) => void;
  handlePeerMessage: (data: any) => void;
  handleConnectionEvent: (event: string, detail?: any) => void;
}

// Initial state
const initialState: GameState = {
  mode: null,
  status: "waiting",
  board: Array(9).fill(null),
  currentPlayer: "X",
  winner: null,
  roomId: null,
  isHost: false,
  playerType: null,
  chatMessages: [],
  connectionStatus: "disconnected",
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
    (set, get) => {
      // Initialize sounds
      initSounds();

      // Handle WebRTC connection events
      const handleConnectionEvent = (event: string, detail?: any) => {
        console.log(`WebRTC event: ${event}`, detail);

        // Add system message to chat based on the event
        let message = "";

        switch (event) {
          case "connection_lost":
            message = `Connection lost (${detail}). Please try reconnecting.`;
            break;
          case "ice_connection_failed":
            message = `Network connection issue (${detail}). Check your internet connection.`;
            break;
          case "channel_closed":
            message =
              "Communication channel closed. Opponent may have left the game.";
            break;
          case "channel_error":
            message = "Communication error. Game may be unstable.";
            break;
          case "connection_state_change":
            if (detail === "connected") {
              message = "Connection established successfully!";
              set((state) => ({
                ...state,
                connectionStatus: "connected",
              }));
            }
            break;
        }

        // Only add message if we have something to say
        if (message) {
          set((state) => ({
            ...state,
            chatMessages: [
              ...state.chatMessages,
              { sender: "System", text: message },
            ],
            connectionStatus:
              event === "connection_lost" ||
              event === "ice_connection_failed" ||
              event === "channel_closed"
                ? "disconnected"
                : state.connectionStatus,
          }));
        }
      };

      return {
        // Initial state
        ...initialState,
        handleConnectionEvent,
        quitGame: () => {
          // Unregister connection callback
          unregisterConnectionCallback();

          // Close connection if exists
          if (peerConnection) {
            closePeerConnection(peerConnection);
            peerConnection = null;
          }

          set(initialState);
        },
        // Actions
        resetGame: () =>
          set((state) => {
            // Send reset message in multiplayer mode
            if (
              state.mode === "multiplayer" &&
              peerConnection &&
              isPeerConnected(peerConnection)
            ) {
              const resetMessage: GameMessage = {
                type: "reset",
                data: {},
              };
              sendWebRTCMessage(peerConnection, resetMessage);
            }

            return {
              ...state,
              board: Array(9).fill(null),
              currentPlayer: "X",
              status: "playing",
              winner: null,
            };
          }),

        makeMove: (index) =>
          set((state) => {
            // Check if the cell is already filled or game is finished
            if (state.board[index] || state.status === "finished") {
              return state;
            }

            // In multiplayer mode, validate it's the player's turn
            if (
              state.mode === "multiplayer" &&
              state.playerType !== state.currentPlayer
            ) {
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

            // In multiplayer mode, send the move to the opponent
            if (
              state.mode === "multiplayer" &&
              peerConnection &&
              isPeerConnected(peerConnection)
            ) {
              const moveMessage: GameMessage = {
                type: "move",
                data: { index },
              };
              sendWebRTCMessage(peerConnection, moveMessage);
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
              return {
                ...initialState,
                mode,
              };
            } else {
              return {
                ...initialState,
                mode,
                status: "playing",
              };
            }
          }),

        createRoom: async (name) => {
          try {
            // Update state to connecting
            set((state) => ({
              ...state,
              status: "connecting",
              connectionStatus: "creating peer connection",
              isHost: true,
              playerType: "X", // Host is always X
            }));

            // Register connection event handler
            registerConnectionCallback(get().handleConnectionEvent);

            // Create WebRTC peer connection
            peerConnection = await createPeerConnection();

            // Wait for ICE candidates to gather
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Create a room in Firebase with the WebRTC offer
            if (peerConnection && peerConnection.connection.localDescription) {
              set((state) => ({
                ...state,
                connectionStatus: "creating room",
              }));

              const roomCode = await createFirebaseRoom(
                name,
                peerConnection.connection.localDescription
              );

              if (roomCode) {
                // Start polling for answer
                set((state) => ({
                  ...state,
                  roomId: roomCode,
                  connectionStatus: "waiting for opponent",
                  chatMessages: [
                    { sender: "System", text: "Room created successfully!" },
                    { sender: "System", text: `Share code: ${roomCode}` },
                    {
                      sender: "System",
                      text: "Waiting for opponent to join...",
                    },
                  ],
                }));

                // Poll for answer
                const checkForAnswer = async () => {
                  const room = await findRoomByCode(roomCode);

                  if (room && room.answer) {
                    // Complete the connection with the received answer
                    if (peerConnection) {
                      await completeConnection(peerConnection, room.answer);

                      // Setup data channel message handler
                      if (peerConnection.channel) {
                        peerConnection.channel.onmessage = (event) => {
                          const message = JSON.parse(event.data);
                          const getState = useGameStore.getState;
                          getState().handlePeerMessage(message);
                        };
                      }
                    }

                    set((state) => ({
                      ...state,
                      status: "playing",
                      connectionStatus: "connected",
                      chatMessages: [
                        ...state.chatMessages,
                        {
                          sender: "System",
                          text: "Opponent has joined! Game starting...",
                        },
                      ],
                    }));

                    return;
                  }

                  // Continue polling if no answer yet
                  setTimeout(checkForAnswer, 2000);
                };

                checkForAnswer();
              } else {
                // Failed to create room
                closePeerConnection(peerConnection);
                peerConnection = null;
                unregisterConnectionCallback();

                set((state) => ({
                  ...state,
                  status: "waiting",
                  connectionStatus: "disconnected",
                  chatMessages: [
                    ...state.chatMessages,
                    { sender: "System", text: "Failed to create room" },
                  ],
                }));
              }
            }
          } catch (error) {
            console.error("Error creating room:", error);

            // Clean up on error
            if (peerConnection) {
              closePeerConnection(peerConnection);
              peerConnection = null;
            }
            unregisterConnectionCallback();

            set((state) => ({
              ...state,
              status: "waiting",
              connectionStatus: "disconnected",
              chatMessages: [
                ...state.chatMessages,
                {
                  sender: "System",
                  text: "Failed to create room: " + (error as Error).message,
                },
              ],
            }));
          }
        },

        joinRoom: async (roomCode) => {
          try {
            // Update state to connecting
            set((state) => ({
              ...state,
              status: "connecting",
              connectionStatus: "finding room",
              isHost: false,
              playerType: "O", // Joiner is always O
            }));

            // Register connection event handler
            registerConnectionCallback(get().handleConnectionEvent);

            // Find the room in Firebase
            const room = await findRoomByCode(roomCode);

            if (room && room.offer) {
              set((state) => ({
                ...state,
                connectionStatus: "joining peer connection",
                roomId: roomCode,
              }));

              // Join the WebRTC peer connection
              peerConnection = await joinPeerConnection(room.offer);

              // Update room with answer
              if (
                peerConnection &&
                peerConnection.connection.localDescription
              ) {
                set((state) => ({
                  ...state,
                  connectionStatus: "sending answer",
                }));

                await updateRoomWithAnswer(
                  roomCode,
                  peerConnection.connection.localDescription
                );

                // Setup data channel message handler
                if (peerConnection && peerConnection.connection) {
                  peerConnection.connection.ondatachannel = (event) => {
                    if (peerConnection) {
                      peerConnection.channel = event.channel;
                      if (peerConnection.channel) {
                        peerConnection.channel.onmessage = (msgEvent) => {
                          const message = JSON.parse(msgEvent.data);
                          const getState = useGameStore.getState;
                          getState().handlePeerMessage(message);
                        };
                      }
                    }
                  };
                }

                set((state) => ({
                  ...state,
                  status: "playing",
                  connectionStatus: "connected",
                  chatMessages: [
                    { sender: "System", text: "Connected to room!" },
                    { sender: "System", text: "Game starting..." },
                  ],
                }));
              } else {
                throw new Error("Failed to create connection answer");
              }
            } else {
              throw new Error("Room not found or invalid");
            }
          } catch (error) {
            console.error("Error joining room:", error);

            // Clean up on error
            if (peerConnection) {
              closePeerConnection(peerConnection);
              peerConnection = null;
            }
            unregisterConnectionCallback();

            set((state) => ({
              ...state,
              roomId: null,
              status: "waiting",
              connectionStatus: "disconnected",
              chatMessages: [
                {
                  sender: "System",
                  text: "Failed to join room: " + (error as Error).message,
                },
              ],
            }));
          }
        },

        leaveRoom: async () => {
          // Send disconnect message if possible
          if (peerConnection && isPeerConnected(peerConnection)) {
            try {
              const disconnectMessage: GameMessage = {
                type: "disconnect",
                data: { reason: "user_left" },
              };
              sendWebRTCMessage(peerConnection, disconnectMessage);
            } catch (e) {
              console.error("Error sending disconnect message:", e);
            }
          }

          // Clean up WebRTC connection
          if (peerConnection) {
            closePeerConnection(peerConnection);
            peerConnection = null;
          }
          unregisterConnectionCallback();

          // If host, delete the room from Firebase
          const state = get();
          if (state.isHost && state.roomId) {
            try {
              await deleteRoom(state.roomId, state.roomId);
            } catch (error) {
              console.error("Error deleting room:", error);
            }
          }

          // Reset state
          set((state) => ({
            ...state,
            roomId: null,
            status: "waiting",
            board: Array(9).fill(null),
            currentPlayer: "X",
            winner: null,
            isHost: false,
            playerType: null,
            chatMessages: [],
            connectionStatus: "disconnected",
          }));

          return Promise.resolve();
        },

        sendMessage: (message: string) => {
          // Add message to local chat
          set((state) => ({
            ...state,
            chatMessages: [
              ...state.chatMessages,
              { sender: "You", text: message },
            ],
          }));

          // Send message through WebRTC if connected
          if (peerConnection && isPeerConnected(peerConnection)) {
            const messageObj: GameMessage = {
              type: "chat",
              data: { text: message },
            };
            sendWebRTCMessage(peerConnection, messageObj);
          }
        },

        handlePeerMessage: (message: GameMessage) => {
          const state = get();

          switch (message.type) {
            case "move":
              // Only process move if it's not our turn
              if (state.currentPlayer !== state.playerType) {
                const index = message.data.index;
                // Use local makeMove function but first check validity
                if (index >= 0 && index < 9 && !state.board[index]) {
                  set((state) => {
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
                  });
                }
              }
              break;

            case "chat":
              // Add message to chat
              set((state) => ({
                ...state,
                chatMessages: [
                  ...state.chatMessages,
                  { sender: "Peer", text: message.data.text },
                ],
              }));
              break;

            case "reset":
              // Reset the board
              set((state) => ({
                ...state,
                board: Array(9).fill(null),
                currentPlayer: "X",
                status: "playing",
                winner: null,
                chatMessages: [
                  ...state.chatMessages,
                  {
                    sender: "System",
                    text: "Game has been reset by opponent.",
                  },
                ],
              }));
              break;

            case "disconnect":
              // Handle peer disconnection
              set((state) => ({
                ...state,
                connectionStatus: "disconnected",
                chatMessages: [
                  ...state.chatMessages,
                  { sender: "System", text: "Opponent has left the game." },
                ],
              }));
              break;

            default:
              console.warn("Unknown message type:", message.type);
          }
        },
      };
    },
    {
      name: "row3-game-storage",
      version: 1,
      partialize: (state) => ({
        // Don't persist these WebRTC related states
        ...state,
        chatMessages: undefined,
        connectionStatus: undefined,
      }),
    }
  )
);
