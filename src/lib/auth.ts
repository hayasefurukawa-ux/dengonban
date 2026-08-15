import { auth } from './firebase';

/** ログイン中ユーザーの ID トークンを取得（未ログイン時は null） */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/** API 呼び出し用ヘッダー（認証付き） */
export async function authHeaders(extra: Record<string, string> = {}): Promise<HeadersInit> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
