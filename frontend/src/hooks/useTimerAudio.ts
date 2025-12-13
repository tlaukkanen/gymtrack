import { useCallback, useRef } from 'react'
import { useSettingsStore, selectTimerAudioMuted } from '../store/settings-store'

/**
 * Hook that provides a function to play a beep sound for timer notifications.
 * Uses the Web Audio API to generate a simple beep tone.
 * Respects the user's mute preference from the settings store.
 */
export const useTimerAudio = () => {
  const isMuted = useSettingsStore(selectTimerAudioMuted)
  const audioContextRef = useRef<AudioContext | null>(null)

  const playBeep = useCallback(() => {
    if (isMuted) return

    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current

      // Resume context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      // Create oscillator for the beep tone
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure the beep sound
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note

      // Set volume and fade out
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      // Play beep
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch {
      // Silently fail if Web Audio API is not available
      console.warn('Web Audio API not available for timer beep')
    }
  }, [isMuted])

  return { playBeep }
}
