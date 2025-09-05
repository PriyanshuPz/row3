// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjpCEhA0h3n5HhBHIuNL-rJnHCYG1Si5g",
  authDomain: "p8labs-row3.firebaseapp.com",
  projectId: "p8labs-row3",
  storageBucket: "p8labs-row3.firebasestorage.app",
  messagingSenderId: "311978275984",
  appId: "1:311978275984:web:71aff52626717ce8be5415",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface Room {
  id?: string;
  name: string;
  code: string;
  answer: RTCSessionDescriptionInit | null;
  offer: RTCSessionDescriptionInit | null;
  createdAt: any;
  expiresAt: any;
}

/**
 * Creates a new room in Firebase with the offer from WebRTC
 * @param name Room name
 * @param offer WebRTC offer
 * @returns Room code for sharing
 */
export async function createFirebaseRoom(
  name: string,
  offer: RTCSessionDescriptionInit
): Promise<string | null> {
  try {
    const joinCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Calculate expiration time (1 hour from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

    const roomData: Room = {
      name,
      code: "R3" + joinCode,
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      answer: null,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt,
    };

    // Add room to Firestore collection
    const roomRef = await addDoc(collection(db, "rooms"), roomData);

    // Create a reference with the join code for easy lookup
    await setDoc(doc(db, "roomCodes", joinCode), {
      roomId: roomRef.id,
      expiresAt: expiresAt,
    });

    return joinCode;
  } catch (error) {
    console.error("Error creating room:", error);
    return null;
  }
}

/**
 * Finds a room by join code
 * @param joinCode The code to join the room
 * @returns Room data if found
 */
export async function findRoomByCode(joinCode: string): Promise<Room | null> {
  try {
    // Look up room ID from the join code
    const codeRef = doc(db, "roomCodes", joinCode);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      return null;
    }

    // Get the actual room data
    const roomId = codeDoc.data().roomId;
    const roomRef = doc(db, "rooms", roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      return null;
    }

    const roomData = roomDoc.data() as Room;
    roomData.id = roomDoc.id;

    // Check if room has expired
    if (
      roomData.expiresAt &&
      new Date() > new Date(roomData.expiresAt.toDate())
    ) {
      // Room has expired, clean it up
      await deleteExpiredRoom(joinCode, roomId);
      return null;
    }

    return roomData;
  } catch (error) {
    console.error("Error finding room:", error);
    return null;
  }
}

/**
 * Updates a room with the answer from the joining peer
 * @param joinCode Room code
 * @param answer WebRTC answer
 */
export async function updateRoomWithAnswer(
  joinCode: string,
  answer: RTCSessionDescriptionInit
): Promise<boolean> {
  try {
    // Find room ID from join code
    const codeRef = doc(db, "roomCodes", joinCode);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      return false;
    }

    const roomId = codeDoc.data().roomId;
    const roomRef = doc(db, "rooms", roomId);

    // Update the room with the answer
    await updateDoc(roomRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating room with answer:", error);
    return false;
  }
}

/**
 * Deletes a room and its code reference
 * @param joinCode Room code
 * @param roomId Room ID
 */
export async function deleteRoom(
  joinCode: string,
  roomId: string
): Promise<boolean> {
  try {
    // Delete the room and its code reference
    await deleteDoc(doc(db, "rooms", roomId));
    await deleteDoc(doc(db, "roomCodes", joinCode));
    return true;
  } catch (error) {
    console.error("Error deleting room:", error);
    return false;
  }
}

/**
 * Deletes an expired room
 * @param joinCode Room code
 * @param roomId Room ID
 */
async function deleteExpiredRoom(
  joinCode: string,
  roomId: string
): Promise<void> {
  try {
    await deleteRoom(joinCode, roomId);
    console.log(`Deleted expired room: ${joinCode}`);
  } catch (error) {
    console.error("Error deleting expired room:", error);
  }
}

/**
 * Clean up expired rooms - can be called manually or periodically
 */
export async function cleanupExpiredRooms(): Promise<void> {
  try {
    const now = new Date();

    // Find expired room codes
    const q = query(collection(db, "roomCodes"), where("expiresAt", "<=", now));

    const querySnapshot = await getDocs(q);

    // Delete each expired room
    querySnapshot.forEach(async (doc) => {
      const { roomId } = doc.data();
      await deleteRoom(doc.id, roomId);
    });
  } catch (error) {
    console.error("Error cleaning up expired rooms:", error);
  }
}
