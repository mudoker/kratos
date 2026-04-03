import { create } from 'zustand';

interface AppState {
  isCommandCenterOpen: boolean;
  setCommandCenterOpen: (open: boolean) => void;
  
  activeWorkoutId: number | null;
  setActiveWorkoutId: (id: number | null) => void;

  userProfile: {
    name: string;
    weightGoal: number;
    dailyKcals: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFats: number;
  };
}

export const useAppStore = create<AppState>((set) => ({
  isCommandCenterOpen: false,
  setCommandCenterOpen: (open) => set({ isCommandCenterOpen: open }),
  
  activeWorkoutId: null,
  setActiveWorkoutId: (id) => set({ activeWorkoutId: id }),

  userProfile: {
    name: 'Athlete',
    weightGoal: 85,
    dailyKcals: 3000,
    dailyProtein: 180,
    dailyCarbs: 350,
    dailyFats: 80,
  },
}));
