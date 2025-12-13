import { createWithEqualityFn } from 'zustand/traditional'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SettingsState {
  timerAudioMuted: boolean
  setTimerAudioMuted: (muted: boolean) => void
  toggleTimerAudioMuted: () => void
}

export const useSettingsStore = createWithEqualityFn<SettingsState>()(
  persist(
    (set) => ({
      timerAudioMuted: false,
      setTimerAudioMuted: (muted) => set({ timerAudioMuted: muted }),
      toggleTimerAudioMuted: () => set((state) => ({ timerAudioMuted: !state.timerAudioMuted })),
    }),
    {
      name: 'gymtrack-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ timerAudioMuted: state.timerAudioMuted }),
    },
  ),
  Object.is,
)

export const selectTimerAudioMuted = (state: SettingsState) => state.timerAudioMuted
export const selectToggleTimerAudioMuted = (state: SettingsState) => state.toggleTimerAudioMuted
