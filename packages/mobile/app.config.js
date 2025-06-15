import 'dotenv/config'

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      slug: 'trmemo-mobile',
      icon: "./assets/appstore.png",
      ios: {
        ...config.expo?.ios,
        bundleIdentifier: 'com.mini-schna.trmemo',
        buildNumber: config.expo?.ios?.buildNumber || "5",
        infoPlist: {
          ...config.expo?.ios?.infoPlist,
          ITSAppUsesNonExemptEncryption: false,
        },
      },
      android: {
        package: 'com.mini_schna.trmemo',
      },
      extra: {
        ...config.expo?.extra,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
        eas: {
          projectId: "6bc45026-9071-479e-bdcf-fd7661988797"
        }
      },
      plugins: [
        [
          "@react-native-google-signin/google-signin",
          {
            iosUrlScheme: "com.googleusercontent.apps.630405940634-6gps154odij7lt311lhnskn0ssuciebp",
          },
        ],
      ],
    }
  }
}
