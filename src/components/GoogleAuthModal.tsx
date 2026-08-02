import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, User, Check, ShieldCheck } from 'lucide-react';

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
  currentUser,
}) => {
  const [postName, setPostName] = useState<string>(currentUser?.postName || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postName.trim()) return;

    const trimmedName = postName.trim();
    const newUser: UserProfile = {
      id: currentUser?.id || `user-${Date.now()}`,
      email: '',
      googleName: trimmedName,
      avatar: '',
      postName: trimmedName,
      isAdmin: false,
    };
    onLogin(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2 font-bold text-base text-stone-100 font-station-sign">
            <User className="w-5 h-5 text-amber-400" />
            <span>伝言板にログイン</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            駅の伝言板をご利用いただく際のお名前（投稿名）を設定してログインします。
          </p>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1">
              投稿名（伝言板に表示されるお名前）:
            </label>
            <input
              type="text"
              value={postName}
              onChange={(e) => setPostName(e.target.value)}
              placeholder="例: お名前を入力"
              maxLength={20}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-colors"
            >
              ログインして開始
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
