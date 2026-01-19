
import { Upgrade } from './types.ts';

export const UPGRADES: Upgrade[] = [
  {
    id: 'resonance',
    name: 'Resonance',
    description: 'Enhances your neural connection to the Aether.',
    baseCost: 15,
    costMultiplier: 1.15,
    type: 'click',
    power: 1,
  },
  {
    id: 'collector',
    name: 'Flux Collector',
    description: 'A basic automated system for harvesting idle Aether.',
    baseCost: 100,
    costMultiplier: 1.15,
    type: 'auto',
    power: 1,
  },
  {
    id: 'harvester',
    name: 'Quantum Harvester',
    description: 'More efficient, extracting flux from nearby dimensions.',
    baseCost: 1100,
    costMultiplier: 1.15,
    type: 'auto',
    power: 8,
  },
  {
    id: 'refinery',
    name: 'Spectral Refinery',
    description: 'Refines raw Aether into high-purity energy.',
    baseCost: 12000,
    costMultiplier: 1.15,
    type: 'auto',
    power: 47,
  },
  {
    id: 'conduit',
    name: 'Primal Conduit',
    description: 'A direct link to the core of the Aether stream.',
    baseCost: 130000,
    costMultiplier: 1.15,
    type: 'auto',
    power: 260,
  },
  {
    id: 'forge',
    name: 'Singularity Forge',
    description: 'Collapses reality to generate massive energy output.',
    baseCost: 1400000,
    costMultiplier: 1.15,
    type: 'auto',
    power: 1400,
  }
];

export const INITIAL_STATE = {
  aether: 0,
  totalAetherEarned: 0,
  clickCount: 0,
  upgrades: {
    resonance: 0,
    collector: 0,
    harvester: 0,
    refinery: 0,
    conduit: 0,
    forge: 0,
  },
  lastSave: Date.now(),
};

export const SAVE_KEY = 'aether_game_save_v1';
