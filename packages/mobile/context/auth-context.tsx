import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import type { Session, User, Provider } from "@supabase/supabase-js"
import { Alert, Linking, Platform } from "react-native"
import {
  GoogleSignin,
  statusCodes,
  User as GoogleUser,
} from '@react-native-google-signin/google-signin'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithSocial: (provider: Provider) => Promise<void>
  signInWithGoogle: () => Promise<void>
  authError: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Google Sign-In の設定 (YOUR_WEB_CLIENT_ID と YOUR_IOS_CLIENT_ID を置き換える)
GoogleSignin.configure({
  webClientId: '630405940634-qe28veqm4njvc0dmvo8mt65v11b0c014.apps.googleusercontent.com', // Google Cloud Console の Web クライアント ID
  iosClientId: '630405940634-6gps154odij7lt311lhnskn0ssuciebp.apps.googleusercontent.com', // Google Cloud Console の iOS クライアント ID
  // offlineAccess: true, // 必要に応じて
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setIsLoading(false)
    }).catch(err => {
      console.error('[DEBUG] useEffect: Failed to get session', err)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error: any) {
      Alert.alert("エラー", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const {
        error,
        data: { session },
      } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!session) Alert.alert("確認", "メールアドレスの確認をお願いします。")
    } catch (error: any) {
      Alert.alert("エラー", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await GoogleSignin.signOut()
      console.log('[DEBUG] Signed out from Google.')
    } catch (error) {
      console.error('Error signing out from Google:', error)
    } finally {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out from Supabase:', error)
        setAuthError(`Supabaseからのサインアウトエラー: ${error.message}`)
      } else {
        console.log('[DEBUG] Signed out from Supabase.')
        setSession(null)
        setUser(null)
        setAuthError(null)
      }
    }
  }

  const signInWithGoogle = async () => {
    setAuthError(null)
    try {
      console.log('[DEBUG] Starting Google Signin process...')
      await GoogleSignin.hasPlayServices()
      console.log('[DEBUG] Play Services checked.')
      const userInfo = await GoogleSignin.signIn()
      console.log('[DEBUG] Google Signin successful, userInfo:', userInfo)

      const idToken = userInfo?.data?.idToken

      if (idToken) {
        console.log('[DEBUG] Received idToken successfully.')
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })

        console.log('[DEBUG] Supabase signInWithIdToken response:', { data, error })

        if (error) {
          console.error('Error signing in with Supabase using ID token:', error)
          setAuthError(`Supabaseへのサインインに失敗しました: ${error.message}`)
          await GoogleSignin.signOut()
          return
        }
        if (!data?.session) {
          console.error('Supabase signInWithIdToken did not return a session.')
          setAuthError('Supabaseセッションの取得に失敗しました.')
          await GoogleSignin.signOut()
          return
        }

        console.log('[DEBUG] Supabase session established successfully.')
      } else {
        console.error('Google Signin response did not contain an ID token in the expected structure.')
        setAuthError('Googleからの応答にIDトークンが含まれていませんでした。')
      }
    } catch (error: any) {
      console.error('Google Signin error:', error)
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow')
        setAuthError('ログインがキャンセルされました.')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Signin in progress')
        setAuthError('ログイン処理が進行中です.')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated')
        setAuthError('Google Play開発者サービスが利用できないか、古いです.')
      } else {
        console.log('Some other error happened', error)
        setAuthError(`Googleログインエラー: ${error.message || error.code || '不明なエラー'}`)
      }
    }
  }

  const signInWithSocial = async (provider: Provider) => {
    if (provider === 'google') {
      await signInWithGoogle()
    } else {
      console.warn(`Provider ${provider} is not configured for native sign in.`)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithSocial,
        signInWithGoogle,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
