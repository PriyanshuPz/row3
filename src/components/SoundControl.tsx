import { useState } from "react";
import { toggleMute, isMuted } from "../lib/sounds";
import { Volume2Icon, VolumeOffIcon } from "lucide-react";

export default function SoundControl() {
  const [muted, setMuted] = useState(isMuted());

  const handleToggleMute = () => {
    const newMutedState = toggleMute();
    setMuted(newMutedState);
  };

  return (
    <button
      onClick={handleToggleMute}
      className="p-2 rounded-full hover:bg-border transition-all"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      title={muted ? "Unmute sounds" : "Mute sounds"}
    >
      {muted ? <VolumeOffIcon /> : <Volume2Icon />}
    </button>
  );
}
