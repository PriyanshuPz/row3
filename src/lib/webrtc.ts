import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";

// Define types for WebRTC connection
export interface PeerConnection {
  connection: RTCPeerConnection;
  channel: RTCDataChannel | null;
  connectionState: string;
}

// WebRTC configuration with public STUN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

// Create a WebRTC peer connection as the room creator (host)
export async function createPeerConnection(): Promise<PeerConnection> {
  try {
    const connection = new RTCPeerConnection(rtcConfig);
    const channel = connection.createDataChannel("gameData");

    setupDataChannel(channel);

    const peerConnection: PeerConnection = {
      connection,
      channel,
      connectionState: "new",
    };

    // Update connection state when it changes
    connection.onconnectionstatechange = () => {
      peerConnection.connectionState = connection.connectionState;
    };

    // Create an offer to send to the other peer
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    return peerConnection;
  } catch (error) {
    console.error("Error creating peer connection:", error);
    throw error;
  }
}

// Join an existing room as the second player
export async function joinPeerConnection(
  offer: RTCSessionDescriptionInit
): Promise<PeerConnection> {
  try {
    const connection = new RTCPeerConnection(rtcConfig);
    const peerConnection: PeerConnection = {
      connection,
      channel: null,
      connectionState: "new",
    };

    // Set up data channel for the joining peer
    connection.ondatachannel = (event) => {
      peerConnection.channel = event.channel;
      setupDataChannel(event.channel);
    };

    // Update connection state when it changes
    connection.onconnectionstatechange = () => {
      peerConnection.connectionState = connection.connectionState;
    };

    // Set the remote description using the offer
    await connection.setRemoteDescription(offer);

    // Create an answer to respond to the offer
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    return peerConnection;
  } catch (error) {
    console.error("Error joining peer connection:", error);
    throw error;
  }
}

// Complete the connection from the host side
export async function completeConnection(
  peerConnection: PeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  try {
    await peerConnection.connection.setRemoteDescription(answer);
  } catch (error) {
    console.error("Error completing connection:", error);
    throw error;
  }
}

// Setup data channel event handlers
function setupDataChannel(channel: RTCDataChannel): void {
  channel.onopen = () => {
    console.log("Data channel is open");
  };

  channel.onclose = () => {
    console.log("Data channel is closed");
  };

  channel.onerror = (error) => {
    console.error("Data channel error:", error);
  };
}

// Send a message through the data channel
export function sendMessage(
  peerConnection: PeerConnection,
  message: any
): void {
  if (peerConnection.channel && peerConnection.channel.readyState === "open") {
    peerConnection.channel.send(JSON.stringify(message));
  } else {
    console.error("Cannot send message, data channel is not open");
  }
}

// Helper function to check if a peer is connected
export function isPeerConnected(
  peerConnection: PeerConnection | null
): boolean {
  return (
    !!peerConnection &&
    !!peerConnection.channel &&
    peerConnection.channel.readyState === "open" &&
    peerConnection.connectionState === "connected"
  );
}

// Fetch offer from Firebase for joining a room
export async function fetchRoomOffer(
  roomCode: string
): Promise<RTCSessionDescriptionInit | null> {
  try {
    const db = getFirestore();
    const roomsCollection = doc(db, "rooms", roomCode);
    const roomSnapshot = await getDoc(roomsCollection);

    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.data();
      return roomData.offer;
    }
    return null;
  } catch (error) {
    console.error("Error fetching room offer:", error);
    return null;
  }
}

// Update room with answer after joining
export async function updateRoomWithAnswer(
  roomCode: string,
  answer: RTCSessionDescriptionInit
): Promise<boolean> {
  try {
    const db = getFirestore();
    const roomRef = doc(db, "rooms", roomCode);
    await updateDoc(roomRef, {
      answer: answer,
    });
    return true;
  } catch (error) {
    console.error("Error updating room with answer:", error);
    return false;
  }
}

// Close and clean up the WebRTC connection
export function closePeerConnection(
  peerConnection: PeerConnection | null
): void {
  if (peerConnection) {
    if (peerConnection.channel) {
      sendMessage(peerConnection, { type: "disconnect", data: {} });
      peerConnection.channel.close();
    }
    peerConnection.connection.close();
  }
}
