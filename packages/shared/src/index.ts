// TrMemo 共有定数と型定義
export const APP_NAME = 'TrMemo';
export const API_VERSION = '0.1.0';

// 基本的な型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}