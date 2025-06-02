export type RootStackParamList = {
  Auth: undefined; // ログイン・サインアップ画面などを含むスタック
  MainTabs: undefined; // メインのタブナビゲータ
  Profile: undefined;
  AccountInfo: undefined;
  PrivacySettings: undefined;
  HelpSupport: undefined;
  ContactUsScreen: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  WorkoutDetail: { workoutId: string }; // 例: ワークアウト詳細画面
  // ... 他の全てのスクリーンと、それらが期待するパラメータ
};
