import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Edit2, Check, UserCheck } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSaveProfile: (updatedPostName: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const [postName, setPostName] = useState<string>(user?.postName || '');

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postName.trim()) return;
    onSaveProfile(postName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2 font-bold text-base text-amber-400 font-station-sign">
            <Edit2 className="w-4 h-4" />
            <span>投稿名（表示名）の変更</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-stone-800 p-3 rounded-lg border border-stone-700 text-xs space-y-1">
            <div className="text-stone-400">ログイン中のGoogleアカウント:</div>
            <div className="font-bold text-stone-200 flex items-center gap-1.5">
              <img src={user.avatar} alt="avatar" className="w-5 h-5 rounded-full" />
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              伝言板に掲示される「投稿名」<span className="text-rose-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={postName}
              onChange={(e) => setPostName(e.target.value)}
              placeholder="例: たけし"
              maxLength={20}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
              required
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              ※誰が書いたか分かるようにご自身やお友達のニックネーム等を登録してください。
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>投稿名を保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
