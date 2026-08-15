import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { UserProfile } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import { X, LogIn, Loader2 } from 'lucide-react';

const POST_NAME_STORAGE_PREFIX = 'station_board_postname_';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  currentUser: UserProfile | null;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const savedPostName =
        localStorage.getItem(`${POST_NAME_STORAGE_PREFIX}${fbUser.uid}`) || '';

      const newUser: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        googleName: fbUser.displayName || 'Googleユーザー',
        avatar:
          fbUser.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        postName: savedPostName || fbUser.displayName || '',
        isAdmin: false,
      };
      onLogin(newUser);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('ログインがキャンセルされました。');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'このドメインは Firebase で許可されていません。Firebase Console の「承認済みドメイン」に追加してください。'
        );
      } else {
        setErrorMessage('Googleログインに失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2 font-bold text-base text-stone-100 font-station-sign">
            <LogIn className="w-5 h-5 text-amber-400" />
            <span>Googleアカウントでログイン</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            伝言の書き込み・削除・自己紹介の登録には、Googleアカウントでのログインが必要です。
            閲覧のみの場合はログイン不要です。
          </p>

          {errorMessage && (
            <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-800 rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-stone-100 text-stone-900 font-bold text-sm rounded-lg shadow-md transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoading ? 'ログイン中...' : 'Googleでログイン'}</span>
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
