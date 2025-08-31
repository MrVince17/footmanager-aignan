// src/utils/storage.ts
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Import the Firestore instance
import { Player, Performance, Team, Unavailability } from '../types';

// Helper to remove undefined values recursively from objects/arrays before Firestore writes
function sanitizeObject<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return (obj
      .map((item) => (item && typeof item === 'object' ? sanitizeObject(item as any) : item))
      .filter((item) => item !== undefined)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const clean: Record<string, any> = {};
    Object.entries(obj as Record<string, any>).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        clean[key] = sanitizeObject(value);
      } else if (value && typeof value === 'object') {
        clean[key] = sanitizeObject(value);
      } else {
        clean[key] = value;
      }
    });
    return clean as T;
  }
  return obj;
}

const PLAYERS_COLLECTION = 'players';
const playersCollectionRef = collection(db, PLAYERS_COLLECTION);

export const storage = {
  // READ all players
  getPlayers: async (): Promise<Player[]> => {
    try {
      const querySnapshot = await getDocs(playersCollectionRef);
      const players = querySnapshot.docs.map(doc => {
        const player = doc.data() as Player;
        // Map 'Senior 1' and 'Senior 2' to 'Senior' and remove duplicates
        if (player.teams) {
          const mappedTeams = player.teams.map(team => {
            if ((team as string) === 'Senior 1' || (team as string) === 'Senior 2') {
              return 'Senior';
            }
            return team;
          });
          player.teams = [...new Set(mappedTeams)] as Team[];
        }
        return player;
      });
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
      await setDoc(playerDocRef, sanitizeObject(player));
    } catch (error) {
      console.error("Error adding player: ", error);
    }
  },

  // UPDATE a single player
  updatePlayer: async (updatedPlayer: Player): Promise<void> => {
    try {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, updatedPlayer.id);
      // 'merge: true' prevents overwriting fields that are not in the updatedPlayer object
      await setDoc(playerDocRef, sanitizeObject(updatedPlayer), { merge: true });
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
      batch.set(playerDocRef, sanitizeObject(player));
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
  },

  updateMatchDetails: async (originalPerf: Performance, updatedData: Partial<Performance>): Promise<void> => {
    const allPlayers = await storage.getPlayers();
    const batch = writeBatch(db);

    // Pre-compute per-player counts from updated arrays if provided
    const goalsCountByPlayer: Record<string, number> = {};
    const assistsCountByPlayer: Record<string, number> = {};
    const yellowCountByPlayer: Record<string, number> = {};
    const redCountByPlayer: Record<string, number> = {};

    if (updatedData.scorers) {
      updatedData.scorers.forEach(s => {
        if (s.playerId) goalsCountByPlayer[s.playerId] = (goalsCountByPlayer[s.playerId] || 0) + 1;
      });
    }
    if (updatedData.assisters) {
      updatedData.assisters.forEach(a => {
        if (a.playerId) assistsCountByPlayer[a.playerId] = (assistsCountByPlayer[a.playerId] || 0) + 1;
      });
    }
    if (updatedData.yellowCardsDetails) {
      updatedData.yellowCardsDetails.forEach(yc => {
        if (yc.playerId) yellowCountByPlayer[yc.playerId] = (yellowCountByPlayer[yc.playerId] || 0) + 1;
      });
    }
    if (updatedData.redCardsDetails) {
      updatedData.redCardsDetails.forEach(rc => {
        if (rc.playerId) redCountByPlayer[rc.playerId] = (redCountByPlayer[rc.playerId] || 0) + 1;
      });
    }

    allPlayers.forEach(player => {
      const performances = player.performances || [];
      let performanceUpdated = false;
      const updatedPerformances = performances.map(p => {
        if (p.date === originalPerf.date && p.opponent === originalPerf.opponent && p.type === 'match') {
          performanceUpdated = true;
          const merged = { ...p, ...updatedData } as Performance;

          // If arrays are provided, sync numeric per-player stats accordingly
          // Only set for the involved player; others get 0 by default if arrays exist
          if (updatedData.scorers || updatedData.assisters || updatedData.yellowCardsDetails || updatedData.redCardsDetails) {
            const playerId = player.id;
            if (updatedData.scorers) {
              merged.goals = goalsCountByPlayer[playerId] || 0;
            }
            if (updatedData.assisters) {
              merged.assists = assistsCountByPlayer[playerId] || 0;
            }
            if (updatedData.yellowCardsDetails) {
              merged.yellowCards = yellowCountByPlayer[playerId] || 0;
            }
            if (updatedData.redCardsDetails) {
              merged.redCards = redCountByPlayer[playerId] || 0;
            }
            // If player appears in any list (goal/assist/card), mark present true
            const appearsInAny = !!(goalsCountByPlayer[playerId] || assistsCountByPlayer[playerId] || yellowCountByPlayer[playerId] || redCountByPlayer[playerId]);
            if (appearsInAny) {
              merged.present = true;
            }
          }

          return merged;
        }
        return p;
      });

      if (performanceUpdated) {
        const playerDocRef = doc(db, PLAYERS_COLLECTION, player.id);
        const sanitizedPerformances = sanitizeObject(updatedPerformances);
        batch.update(playerDocRef, { performances: sanitizedPerformances });
      }
    });

    try {
      await batch.commit();
      console.log("Batch match update successful!");
    } catch (error) {
      console.error("Error updating match details in batch:", error);
    }
  },

  // New: update per-player match performances (present, minutes, goals, etc.)
  updateMatchPerformances: async (originalPerf: Performance, performancesUpdate: Array<{ playerId: string; present: boolean; minutesPlayed: number; goals: number; assists: number; yellowCards: number; redCards: number; cleanSheet?: boolean; }>): Promise<void> => {
    const batch = writeBatch(db);

    for (const perfUpdate of performancesUpdate) {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, perfUpdate.playerId);
      try {
        const docSnap = await getDoc(playerDocRef);
        if (docSnap.exists()) {
          const player = docSnap.data() as Player;
          const performances = player.performances || [];

          let found = false;
          let updatedPerformances: Performance[] = performances.map(p => {
            if (p.type === 'match' && p.date === originalPerf.date && (p.opponent || '') === (originalPerf.opponent || '')) {
              found = true;
              const merged: Performance = sanitizeObject({
                ...p,
                present: perfUpdate.present,
                minutesPlayed: perfUpdate.present ? perfUpdate.minutesPlayed : 0,
                goals: perfUpdate.present ? perfUpdate.goals : 0,
                assists: perfUpdate.present ? perfUpdate.assists : 0,
                yellowCards: perfUpdate.present ? perfUpdate.yellowCards : 0,
                redCards: perfUpdate.present ? perfUpdate.redCards : 0,
                cleanSheet: perfUpdate.cleanSheet !== undefined ? !!perfUpdate.cleanSheet : p.cleanSheet,
                // propagate existing match metadata if present
                date: p.date,
                opponent: p.opponent,
                season: p.season,
                matchType: p.matchType,
                location: p.location,
                scoreHome: p.scoreHome,
                scoreAway: p.scoreAway,
              } as Performance);
              return merged;
            }
            return p;
          });

          if (!found) {
            const newPerf: Performance = sanitizeObject({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'match',
              date: originalPerf.date,
              opponent: originalPerf.opponent,
              season: originalPerf.season,
              matchType: originalPerf.matchType,
              location: originalPerf.location,
              present: perfUpdate.present,
              minutesPlayed: perfUpdate.present ? perfUpdate.minutesPlayed : 0,
              goals: perfUpdate.present ? perfUpdate.goals : 0,
              assists: perfUpdate.present ? perfUpdate.assists : 0,
              yellowCards: perfUpdate.present ? perfUpdate.yellowCards : 0,
              redCards: perfUpdate.present ? perfUpdate.redCards : 0,
              cleanSheet: perfUpdate.cleanSheet || false,
            } as Performance);
            updatedPerformances.push(newPerf);
          }

          // Sanitize all performances to strip undefined before writing
          const sanitizedPerformances = sanitizeObject(updatedPerformances);
          batch.update(playerDocRef, { performances: sanitizedPerformances });
        }
      } catch (error) {
        console.error('Error updating match performances for player', perfUpdate.playerId, error);
      }
    }

    try {
      await batch.commit();
      console.log('Batch match performances update successful');
    } catch (error) {
      console.error('Error committing match performances batch', error);
    }
  },

  // New: update per-player training presences
  updateTrainingPresence: async (trainingRef: Performance, presences: Array<{ playerId: string; present: boolean }>): Promise<void> => {
    const batch = writeBatch(db);

    for (const presence of presences) {
      const playerDocRef = doc(db, PLAYERS_COLLECTION, presence.playerId);
      try {
        const docSnap = await getDoc(playerDocRef);
        if (docSnap.exists()) {
          const player = docSnap.data() as Player;
          const performances = player.performances || [];

          let found = false;
          const updatedPerformances: Performance[] = performances.map(p => {
            if (p.type === 'training' && (p.id === trainingRef.id || p.date === trainingRef.date)) {
              found = true;
              return {
                ...p,
                present: presence.present,
              } as Performance;
            }
            return p;
          });

          if (!found) {
            const newPerf: Performance = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'training',
              date: trainingRef.date,
              season: trainingRef.season,
              present: presence.present,
            } as Performance;
            updatedPerformances.push(newPerf);
          }

          batch.update(playerDocRef, { performances: updatedPerformances });
        }
      } catch (error) {
        console.error('Error updating training presence for player', presence.playerId, error);
      }
    }

    try {
      await batch.commit();
      console.log('Batch training presence update successful');
    } catch (error) {
      console.error('Error committing training presence batch', error);
    }
  },

  deleteMatch: async (originalPerf: Performance): Promise<void> => {
    const allPlayers = await storage.getPlayers();
    const batch = writeBatch(db);

    allPlayers.forEach(player => {
        const performances = player.performances || [];
        let performanceDeleted = false;
        const updatedPerformances = performances.filter(p => {
            const isMatchToDelete = p.date === originalPerf.date && p.opponent === originalPerf.opponent && p.type === 'match';
            if (isMatchToDelete) {
                performanceDeleted = true;
            }
            return !isMatchToDelete;
        });

        if (performanceDeleted) {
            const playerDocRef = doc(db, PLAYERS_COLLECTION, player.id);
            batch.update(playerDocRef, { performances: updatedPerformances });
        }
    });

    try {
        await batch.commit();
        console.log("Batch match delete successful!");
    } catch (error) {
        console.error("Error deleting match details in batch:", error);
    }
  },

  deleteTraining: async (trainingDate: string): Promise<void> => {
    const allPlayers = await storage.getPlayers();
    const batch = writeBatch(db);

    allPlayers.forEach(player => {
        const performances = player.performances || [];
        let performanceDeleted = false;
        const updatedPerformances = performances.filter(p => {
            const isTrainingToDelete = p.date === trainingDate && p.type === 'training';
            if (isTrainingToDelete) {
                performanceDeleted = true;
            }
            return !isTrainingToDelete;
        });

        if (performanceDeleted) {
            const playerDocRef = doc(db, PLAYERS_COLLECTION, player.id);
            batch.update(playerDocRef, { performances: updatedPerformances });
        }
    });

    try {
        await batch.commit();
        console.log("Batch training delete successful!");
    } catch (error) {
        console.error("Error deleting training details in batch:", error);
    }
  },

  addUnavailability: async (playerId: string, unavailability: Unavailability): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
        const docSnap = await getDoc(playerDocRef);

        if (docSnap.exists()) {
            const player = docSnap.data() as Player;
            const existingUnavailabilities = player.unavailabilities || [];
            const updatedUnavailabilities = [...existingUnavailabilities, unavailability];
            await setDoc(playerDocRef, { unavailabilities: updatedUnavailabilities }, { merge: true });
        } else {
            console.error(`Player with id ${playerId} not found!`);
        }
    } catch (error) {
        console.error("Error adding unavailability:", error);
    }
  },

  deleteUnavailability: async (playerId: string, unavailabilityId: string): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
        const docSnap = await getDoc(playerDocRef);

        if (docSnap.exists()) {
            const player = docSnap.data() as Player;
            const updatedUnavailabilities = (player.unavailabilities || []).filter(u => u.id !== unavailabilityId);
            await setDoc(playerDocRef, { unavailabilities: updatedUnavailabilities }, { merge: true });
        } else {
            console.error(`Player with id ${playerId} not found!`);
        }
    } catch (error) {
        console.error("Error deleting unavailability:", error);
    }
  },

  // Payments management
  addPayment: async (playerId: string, payment: { id: string; date: string; season: string; amount: number; note?: string }): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
      const docSnap = await getDoc(playerDocRef);
      if (docSnap.exists()) {
        const player = docSnap.data() as Player;
        const existingPayments = Array.isArray(player.payments) ? player.payments : [];
        const updatedPayments = [...existingPayments, payment];
        await setDoc(playerDocRef, { payments: sanitizeObject(updatedPayments) }, { merge: true });
      } else {
        console.error(`Player with id ${playerId} not found!`);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  },

  deletePayment: async (playerId: string, paymentId: string): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
      const docSnap = await getDoc(playerDocRef);
      if (docSnap.exists()) {
        const player = docSnap.data() as Player;
        const updatedPayments = (Array.isArray(player.payments) ? player.payments : []).filter(p => p.id !== paymentId);
        await setDoc(playerDocRef, { payments: sanitizeObject(updatedPayments) }, { merge: true });
      } else {
        console.error(`Player with id ${playerId} not found!`);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  },

  setLicenseFee: async (playerId: string, licenseFee: number): Promise<void> => {
    const playerDocRef = doc(db, PLAYERS_COLLECTION, playerId);
    try {
      await setDoc(playerDocRef, { licenseFee }, { merge: true });
    } catch (error) {
      console.error('Error setting license fee:', error);
    }
  },
};

// Note: Any functions that used to be in storage.ts but were pure data
// manipulation (like recalculateAttendanceRates) should now be moved to a
// separate utility file (e.g., `src/utils/playerUtils.ts`) and would
// operate on player data fetched from Firestore.