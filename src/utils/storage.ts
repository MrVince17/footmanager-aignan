import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Import the Firestore instance
import { Player, Performance, Unavailability } from '../types';

const PLAYERS_COLLECTION = 'players';
const playersCollectionRef = collection(db, PLAYERS_COLLECTION);

export const storage = {
  // READ all players
  getPlayers: async (): Promise<Player[]> => {
    try {
      const querySnapshot = await getDocs(playersCollectionRef);
      const players = querySnapshot.docs.map(doc => doc.data() as Player);
      // Optional: Add client-side migration/data cleanup if needed
      return players;
    } catch (error) {
      console.error("Error fetching players: ", error);
      return []; // Return empty array on error
    }
  },

  // CREATE a single player
  addPlayer: async (player: Player): Promise<void> => {
    try {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, player.id);
      await setDoc(playerDocRef, player);
    } catch (error) {
      console.error("Error adding player: ", error);
    }
  },

  // UPDATE a single player
  updatePlayer: async (updatedPlayer: Player): Promise<void> => {
    try {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, updatedPlayer.id);
      await setDoc(playerDocRef, updatedPlayer, { merge: true }); // Use merge to avoid overwriting all fields if not provided
    } catch (error) {
      console.error("Error updating player: ", error);
    }
  },

  // DELETE a single player
  deletePlayer: async (playerId: string): Promise<void> => {
    try {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
      await deleteDoc(playerDocRef);
    } catch (error) {
      console.error("Error deleting player: ", error);
    }
  },

  // --- Batch operations for efficiency ---

  // DELETE multiple players
  deleteMultiplePlayers: async (playerIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    playerIds.forEach(id => {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, id);
      batch.delete(playerDocRef);
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error("Error deleting multiple players: ", error);
    }
  },

  // CREATE multiple players
  addMultiplePlayers: async (newPlayers: Player[]): Promise<void> => {
    const batch = writeBatch(db);
    newPlayers.forEach(player => {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, player.id);
      batch.set(playerDocRef, player);
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error("Error adding multiple players: ", error);
    }
  },

  // --- Example of updating a nested array ---
  // Note: This requires reading the doc, updating in-memory, then writing back.
  // Firestore doesn't have native "push to array" for complex objects without reading first.
  addPerformance: async (playerId: string, performance: Performance): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
        const docSnap = await getDoc(playerDocRef);

        if (docSnap.exists()) {
            const player = docSnap.data() as Player;
            const updatedPerformances = [...player.performances, performance];
            await setDoc(playerDocRef, { performances: updatedPerformances }, { merge: true });
        } else {
            console.error("Player not found!");
        }
    } catch (error) {
        console.error("Error adding performance:", error)
    }
  }
};

// Note: Functions like recalculateAttendanceRates, getTotalTeamEvents, etc.
// remain client-side logic. They will now consume data from the async
// getPlayers() function. For example:
// const allPlayers = await storage.getPlayers();
// storage.recalculateAttendanceRates(player, allPlayers);
// await storage.updatePlayer(player); // Save changes back to Firestore