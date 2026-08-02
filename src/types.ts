export type ChalkColor = 'white' | 'yellow' | 'pink' | 'cyan';

export interface Post {
  id: string;
  userId: string;
  userEmail: string;
  userAvatar: string;
  postName: string; // 各自設定する投稿名（表示名）
  content: string; // 伝言本文
  chalkColor: ChalkColor;
  createdAt: string; // 表示用時刻 (例: "17:45 筆")
  timestamp: number;
}

export interface AdminNotice {
  content: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserProfile {
  id: string;
  email: string;
  googleName: string;
  avatar: string;
  postName: string; // 投稿名
  isAdmin: boolean;
  substackUrl?: string; // サブスタックのトップページURL
  bio?: string; // 自己紹介
  strengths?: string; // 強み（助けられること）
  weaknesses?: string; // 弱み（助けて欲しいこと）
  updatedAt?: string;
}

export interface MemberProfile {
  userId: string;
  userEmail: string;
  userAvatar: string;
  postName: string;
  googleName?: string;
  substackUrl: string;
  bio: string;
  strengths: string;
  weaknesses: string;
  updatedAt: string;
}

export interface BoardDataResponse {
  posts: Post[];
  adminNotice: AdminNotice;
  maxBoardLimit: number; // 7
  maxUserLimit: number; // 3
}
