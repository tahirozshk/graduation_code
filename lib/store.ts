import { PracticeSession } from '@/types'

/**
 * Simple global store to manage the current practice session data.
 * Useful for transferring state between the dashboard and the practice page.
 */
export const PracticeStore = {
  saveSession(session: PracticeSession) {
    if (typeof window !== 'undefined') {
       localStorage.setItem('current_practice_session', JSON.stringify(session))
    }
  },

  getSession(): PracticeSession | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('current_practice_session')
      return data ? JSON.parse(data) : null
    }
    return null
  },

  clearSession() {
     if (typeof window !== 'undefined') {
       localStorage.removeItem('current_practice_session')
     }
  }
}
