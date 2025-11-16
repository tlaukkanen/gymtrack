;(globalThis as any).localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null
  },
  setItem(key: string, value: string) {
    this.store[key] = value
  },
  removeItem(key: string) {
    delete this.store[key]
  },
}

import('../src/store/auth-store').then(({ useAuthStore }) => {
  console.log('initial hydrated', useAuthStore.getState().hydrated)
  setTimeout(() => {
    console.log('hydrated after timeout', useAuthStore.getState().hydrated)
    process.exit(0)
  }, 0)
})
