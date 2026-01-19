
import { Upgrade } from './types.ts';

export const UPGRADES: Upgrade[] = [
  {
    id: 'resonance',
    name: 'Neural Resonance',
    description: 'Increases the output of every manual interaction.',
    baseCost: 15,
    costMultiplier: 1.15,
    type: 'click',
    power: 1,
  },
  {
    id: 'collector',
    name: 'Flux Collector',
    description: 'Automated drones that harvest ambient energy fluctuations.',
    baseCost: 100,
    costMultiplier: 1.15,
    type: 'auto',
    power: 1,
  },
  {
    id: 'harvester',
    name: 'Quantum Harvester',
    description: 'Extracts energy from sub-atomic quantum vibrations.',
    baseCost: 1100,
    costMultiplier: 1.15,
    type: 'auto',
    power: 8,
  },
  {
    id: 'refinery',
    name: 'Spectral Refinery',
    description: 'Processes raw entropy into pure, usable Aether.',
    baseCost: 12000,
    costMultiplier: 1.15,
    type: 'auto',
    power: 47,
  },
  {
    id: 'conduit',
    name: 'Primal Conduit',
    description: 'A direct uplink to the core of the universal stream.',
    baseCost: 130000,
    costMultiplier: 1.15,
    type: 'auto',
    power: 260,
  },
  {
    id: 'forge',
    name: 'Singularity Forge',
    description: 'Uses micro-black holes to generate massive power output.',
    baseCost: 1400000,
    costMultiplier: 1.15,
    type: 'auto',
    power: 1400,
  },
  {
    id: 'void_engine',
    name: 'Void Engine',
    description: 'Harnesses the energy of non-existence to power the matrix.',
    baseCost: 20000000,
    costMultiplier: 1.14,
    type: 'auto',
    power: 7800,
  },
  {
    id: 'aether_array',
    name: 'Aether Array',
    description: 'Massive structures that span across galactic clusters.',
    baseCost: 330000000,
    costMultiplier: 1.13,
    type: 'auto',
    power: 44000,
  },
  {
    id: 'chronos_core',
    name: 'Chronos Core',
    description: 'Manipulates time to generate energy from future states.',
    baseCost: 5100000000,
    costMultiplier: 1.12,
    type: 'auto',
    power: 260000,
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
    void_engine: 0,
    aether_array: 0,
    chronos_core: 0,
  },
  lastSave: Date.now(),
};

export const SAVE_KEY = 'aether_game_save_v1';
