import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { cn } from "../lib/utils";
import StatusView from "./game/status-view";
import BoardView from "./game/board-view";
import SoundControl from "./SoundControl";
import { playSound } from "../lib/sounds";
import { LogOutIcon } from "lucide-react";

export default function MultiplayerGame() {
  const { gameState, sendMessage, quitGame } = useGame();
  const { chatMessages } = gameState;

  const [message, setMessage] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!document.hasFocus() && chatMessages.length > 0) {
      playSound("pop");
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex items-start justify-center gap-8 flex-col">
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

      <div className="flex items-start justify-center gap-8">
        <div className="flex flex-col items-center">
          <BoardView />
          <div className="mt-2" />
          <StatusView />
        </div>

        <div className="w-64 bg-border/20 rounded-lg p-1 flex flex-col">
          <h3 className="text-lg font-bold text-text mb-2">Chat</h3>
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto mb-2 max-h-[300px] min-h-[300px]"
          >
            {chatMessages &&
              chatMessages.map(
                (msg: { sender: string; text: string }, i: number) => (
                  <div key={i} className="mb-2">
                    <span
                      className={cn(
                        "font-bold",
                        msg.sender === "You"
                          ? "text-primary"
                          : msg.sender === "Peer"
                          ? "text-secondary"
                          : "text-text"
                      )}
                    >
                      {msg.sender}:
                    </span>{" "}
                    <span className="text-text">{msg.text}</span>
                  </div>
                )
              )}
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
    </div>
  );
}
