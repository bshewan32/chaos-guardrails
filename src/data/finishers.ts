import { MovementCategory, AxialCost, ErectorCost } from './exercises';

export interface Finisher {
  id: string;
  name: string;
  description: string;
  movementCategory: MovementCategory;
  axialCost: AxialCost;
  erectorCost: ErectorCost;
}

export const FINISHERS: Finisher[] = [
  {
    id: 'farmers-walk',
    name: "Farmer's Walk",
    description: "Grab the heaviest pair of dumbbells or handles you can manage. Walk for 3–4 rounds of 30–40 meters. Grip should be the first thing to fail.",
    movementCategory: 'posterior',
    axialCost: 'moderate',
    erectorCost: 'moderate',
  },
  {
    id: 'sled-push',
    name: 'Sled Push',
    description: "Load the sled heavy. Push for 4–6 lengths of 20 meters. Keep a consistent pace and don't stop until the end of the length.",
    movementCategory: 'squat',
    axialCost: 'low',
    erectorCost: 'low',
  },
  {
    id: 'sled-pull',
    name: 'Sled Pull',
    description: "Use a harness or rope. Pull the sled backward for 4–6 lengths of 20 meters. Focus on the quads and staying low.",
    movementCategory: 'squat',
    axialCost: 'low',
    erectorCost: 'low',
  },
  {
    id: 'suitcase-carry',
    name: 'Suitcase Carry',
    description: "Hold a heavy dumbbell in one hand only. Walk 30 meters, swap hands, and walk back. Do 3 rounds. Don't let the weight pull you to the side.",
    movementCategory: 'posterior',
    axialCost: 'low',
    erectorCost: 'moderate',
  },
  {
    id: 'zercher-carry',
    name: 'Zercher Carry',
    description: "Cradle a barbell or sandbag in the crooks of your elbows. Keep your chest up and walk for 3 rounds of 30 meters. Brutal on the core and upper back.",
    movementCategory: 'posterior',
    axialCost: 'moderate',
    erectorCost: 'high',
  },
  {
    id: 'sandbag-carry',
    name: 'Sandbag Carry',
    description: "Bear hug a heavy sandbag to your chest. Walk for 3–4 rounds of 40 meters. Breathe high in your chest and embrace the suck.",
    movementCategory: 'posterior',
    axialCost: 'moderate',
    erectorCost: 'moderate',
  },
];

/**
 * Selects a finisher based on the current session's load.
 * Avoids high erector/axial finishers if the session was already heavy.
 */
export function getTurboFinisher(sessionAxialCost: AxialCost, sessionErectorCost: ErectorCost): Finisher {
  let pool = FINISHERS;

  // If the session was high axial/erector, filter out high/moderate cost finishers
  if (sessionAxialCost === 'high' || sessionErectorCost === 'high') {
    pool = pool.filter(f => f.axialCost === 'low' && f.erectorCost !== 'high');
  }

  // Fallback to all if pool is empty (shouldn't happen with current data)
  if (pool.length === 0) pool = FINISHERS;

  return pool[Math.floor(Math.random() * pool.length)];
}
