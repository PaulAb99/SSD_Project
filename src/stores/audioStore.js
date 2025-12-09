import { create } from 'zustand';

const useAudioStore = create((set) => ({
  isPlaying: false,
  currentNode: null,
  currentTime: 0,
  duration: 0,
  audioElement: null,
  setAudioElement: (element) => set({ audioElement: element }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentNode: (node) => set({ currentNode: node }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  playAudio: (node) => set((state) => {
    if (state.audioElement) {
      state.audioElement.pause();
    }
    return { currentNode: node, isPlaying: true };
  }),
  pauseAudio: () => set({ isPlaying: false }),
  stopAudio: () => set({
    isPlaying: false,
    currentNode: null,
    currentTime: 0,
  }),
}));

export default useAudioStore;
