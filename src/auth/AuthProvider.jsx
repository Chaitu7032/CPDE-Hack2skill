import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { get, limitToLast, onValue, orderByChild, push, query, ref, serverTimestamp, set } from 'firebase/database'
import { auth, db, isFirebaseConfigured } from '../config/firebase.js'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileOffRef = useRef(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser || null)

      // Clear prior profile subscription.
      if (profileOffRef.current) {
        profileOffRef.current()
        profileOffRef.current = null
      }

      if (!nextUser || !db) {
        setProfile(null)
        setLoading(false)
        return
      }

      // Keep profile live.
      profileOffRef.current = onValue(ref(db, `users/${nextUser.uid}/profile`), (snap) => {
        setProfile(snap.val() || null)
      })

      // One-time, zero-break migration for existing demo farms.
      // Old storage: localStorage cpde:farmId, RTDB: /cpde/v1/farms/{farmId}
      try {
        const existingProfileSnap = await get(ref(db, `users/${nextUser.uid}/profile`))
        const existingFieldsSnap = await get(ref(db, `users/${nextUser.uid}/fields`))
        const hasAnyField = !!existingFieldsSnap.val()
        const hasProfile = !!existingProfileSnap.val()

        if (!hasProfile || !hasAnyField) {
          const oldFarmId = safeGetLocalStorage('cpde:farmId')
          if (oldFarmId) {
            const oldFarmSnap = await get(ref(db, `cpde/v1/farms/${oldFarmId}`))
            const oldFarm = oldFarmSnap.val()

            const oldProfile = oldFarm?.profile
            const oldPolygon = oldFarm?.field?.polygon

            if (!hasProfile && oldProfile && typeof oldProfile === 'object') {
              await set(ref(db, `users/${nextUser.uid}/profile`), {
                farmerName: oldProfile.farmerName || 'Farmer',
                farmName: oldProfile.farmName || 'Farm',
                email: nextUser.email || oldProfile.email || '',
                createdAt: oldProfile.createdAt || serverTimestamp(),
              })
            }

            if (!hasAnyField && Array.isArray(oldPolygon) && oldPolygon.length >= 3) {
              const fieldsRef = ref(db, `users/${nextUser.uid}/fields`)
              const newFieldRef = push(fieldsRef)
              await set(newFieldRef, {
                fieldName: oldProfile?.farmName || 'My Field',
                cropType: oldProfile?.cropType || 'Rice',
                geometry: oldPolygon,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            }

            // Migrate grid + variance for continuity (dashboard/analysis).
            if (oldFarm?.grid && typeof oldFarm.grid === 'object') {
              await set(ref(db, `users/${nextUser.uid}/grid`), oldFarm.grid)
            }
            if (oldFarm?.variance && typeof oldFarm.variance === 'object') {
              await set(ref(db, `users/${nextUser.uid}/variance`), oldFarm.variance)
            }

            safeRemoveLocalStorage('cpde:farmId')
          }
        }
      } catch {
        // ignore migration failures
      } finally {
        setLoading(false)
      }
    })

    return () => {
      unsubscribe()
      if (profileOffRef.current) {
        profileOffRef.current()
        profileOffRef.current = null
      }
    }
  }, [])

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

function safeGetLocalStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeRemoveLocalStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
