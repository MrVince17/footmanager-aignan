import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Player, Performance, Unavailability } from '../types';

const PLAYERS_COLLECTION = 'players';

export const firestoreService = {
  getPlayers: async (): Promise<Player[]> => {
    const playersCol = collection(db, PLAYERS_COLLECTION);
    const playerSnapshot = await getDocs(playersCol);
    const playerList = playerSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Player));
    return playerList;
  },

  addPlayer: async (player: Omit<Player, 'id'>): Promise<string> => {
    const playersCol = collection(db, PLAYERS_COLLECTION);
    const docRef = await addDoc(playersCol, player);
    return docRef.id;
  },

  updatePlayer: async (playerId: string, player: Partial<Player>): Promise<void> => {
    const playerDoc = doc(db, PLAYERS_COLLECTION, playerId);
    await updateDoc(playerDoc, player);
  },

  deletePlayer: async (playerId: string): Promise<void> => {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, playerId));
  },

  addPerformance: async (playerId: string, performance: Omit<Performance, 'id'>): Promise<string> => {
    const performancesCol = collection(db, PLAYERS_COLLECTION, playerId, 'performances');
    const docRef = await addDoc(performancesCol, performance);
    return docRef.id;
  },

  addUnavailability: async (playerId: string, unavailability: Omit<Unavailability, 'id'>): Promise<string> => {
    const unavailabilitiesCol = collection(db, PLAYERS_COLLECTION, playerId, 'unavailabilities');
    const docRef = await addDoc(unavailabilitiesCol, unavailability);
    return docRef.id;
  },

  updateUnavailability: async (playerId: string, unavailabilityId: string, unavailability: Partial<Unavailability>): Promise<void> => {
    const unavailabilityDoc = doc(db, PLAYERS_COLLECTION, playerId, 'unavailabilities', unavailabilityId);
    await updateDoc(unavailabilityDoc, unavailability);
  },

  deleteUnavailability: async (playerId: string, unavailabilityId: string): Promise<void> => {
    const unavailabilityDoc = doc(db, PLAYERS_COLLECTION, playerId, 'unavailabilities', unavailabilityId);
    await deleteDoc(unavailabilityDoc);
  },

  getPerformances: async (playerId: string): Promise<Performance[]> => {
    const performancesCol = collection(db, PLAYERS_COLLECTION, playerId, 'performances');
    const performanceSnapshot = await getDocs(performancesCol);
    const performanceList = performanceSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Performance));
    return performanceList;
  },

  getUnavailabilities: async (playerId: string): Promise<Unavailability[]> => {
    const unavailabilitiesCol = collection(db, PLAYERS_COLLECTION, playerId, 'unavailabilities');
    const unavailabilitySnapshot = await getDocs(unavailabilitiesCol);
    const unavailabilityList = unavailabilitySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Unavailability));
    return unavailabilityList;
  },

  // TODO: Implement deleteMatch
};
