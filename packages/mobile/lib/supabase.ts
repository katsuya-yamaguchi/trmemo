import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import { AppState } from "react-native"
import Constants from "expo-constants"

// Replace with your Supabase URL and anon key
export const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || ''
export const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || ''
console.log(`supabaseUrl: ${supabaseUrl}`)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    // セッションを永続化する。セッション情報がストレージに保存される。
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// アプリがフォアグラウンドにある場合、Supabase Authにセッションを自動的に永続的に更新するように指示します
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
