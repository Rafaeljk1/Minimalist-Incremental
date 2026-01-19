
export interface GameState {
  aether: number;
  totalAetherEarned: number;
  clickCount: number;
  upgrades: {
    [key: string]: number;
  };
  lastSave: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  type: 'click' | 'auto';
  power: number;
}
