// src/utils/storage.ts
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Import the Firestore instance
import { Player, Performance } from '../types';

const PLAYERS_COLLECTION = 'players';
const playersCollectionRef = collection(db, PLAYERS_COLLECTION);

export const storage = {
  // READ all players
  getPlayers: async (): Promise<Player[]> => {
    try {
      const querySnapshot = await getDocs(playersCollectionRef);
      const players = querySnapshot.docs.map(doc => doc.data() as Player);
      return players;
    } catch (error) {
      console.error("Error fetching players: ", error);
      return [];
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
      // 'merge: true' prevents overwriting fields that are not in the updatedPlayer object
      await setDoc(playerDocRef, updatedPlayer, { merge: true });
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

  // DELETE multiple players using a batch for efficiency
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

  // CREATE multiple players using a batch
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

  // Example of updating a nested array (e.g., adding a performance)
  addPerformance: async (playerId: string, performance: Performance): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
        const docSnap = await getDoc(playerDocRef);

        if (docSnap.exists()) {
            const player = docSnap.data() as Player;
            // Ensure performances array exists before spreading
            const existingPerformances = player.performances || [];
            const updatedPerformances = [...existingPerformances, performance];
            await setDoc(playerDocRef, { performances: updatedPerformances }, { merge: true });
        } else {
            console.error(`Player with id ${playerId} not found!`);
        }
    } catch (error) {
        console.error("Error adding performance:", error);
    }
  }
};

// Note: Any functions that used to be in storage.ts but were pure data
// manipulation (like recalculateAttendanceRates) should now be moved to a
// separate utility file (e.g., `src/utils/playerUtils.ts`) and would
// operate on player data fetched from Firestore.