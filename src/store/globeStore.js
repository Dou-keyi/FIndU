// globeStore.js — Zustand store for GlobePage state to persist across navigations
import { create } from 'zustand';

export const useGlobeStore = create((set) => ({
  mode: 'globe', // 'globe' | 'swipe'
  nodes: [],
  employerJobs: [],
  swipeQueue: [],
  activeNode: null,
  hasFetched: false,

  setMode: (mode) => set({ mode }),
  setNodes: (updater) => set((state) => ({ nodes: typeof updater === 'function' ? updater(state.nodes) : updater })),
  setEmployerJobs: (jobs) => set({ employerJobs: jobs }),
  setSwipeQueue: (updater) => set((state) => ({ swipeQueue: typeof updater === 'function' ? updater(state.swipeQueue) : updater })),
  setActiveNode: (node) => set({ activeNode: node }),
  setHasFetched: (fetched) => set({ hasFetched: fetched }),
  
  resetGlobe: () => set({
    mode: 'globe',
    nodes: [],
    employerJobs: [],
    swipeQueue: [],
    activeNode: null,
    hasFetched: false,
  }),
}));
