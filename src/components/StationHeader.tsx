import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Clock, Shield, LogIn, Edit2, Train, Volume2, VolumeX } from 'lucide-react';

interface StationHeaderProps {
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenEditProfileModal: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  activeTab: 'board' | 'profiles';
  onTabChange: (tab: 'board' | 'profiles') => void;
  onOpenMyProfileEdit: () => void;
}

export const StationHeader: React.FC<StationHeaderProps> = ({
  user,
  onOpenAuthModal,
  onOpenEditProfileModal,
  isAdmin,
  onToggleAdmin,
  activeTab,
  onTabChange,
  onOpenMyProfileEdit,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDate(
        now.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full max-w-5xl mx-auto mb-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 border-b border-stone-800 pb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-stone-800 text-amber-400 text-xs font-station-digital tracking-widest border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            {date} {time}
          </span>
        </div>

        {/* User Status Control */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                投稿名: {user.postName || '（未設定）'}
              </span>
              <button
                onClick={onOpenEditProfileModal}
                title="投稿名を変更"
                className="ml-1 p-1 hover:bg-stone-700 rounded text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>変更</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition-all border border-amber-400/30"
            >
              <LogIn className="w-3.5 h-3.5" />
              ログイン
            </button>
          )}

          {/* Admin Switcher */}
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isAdmin
                ? 'bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700 border border-stone-700'
            }`}
            title="駅長（管理者）モード切替"
          >
            <Shield className="w-3.5 h-3.5" />
            {isAdmin ? '駅長モード (ON)' : '管理者切替'}
          </button>
        </div>
      </div>

      {/* Navigation Tags Bar (伝言板 ↔ 自己紹介ボード 切り替えタグ) */}
      <div className="mt-3 bg-stone-900 border-2 border-emerald-700/80 rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTabChange('board')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'board'
                ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-station-sign border border-amber-300'
                : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-750 border border-stone-700'
            }`}
          >
            <Train className="w-4 h-4 text-emerald-500" />
            <span>🚉 伝言板 (黒板)</span>
          </button>

          <button
            onClick={() => onTabChange('profiles')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profiles'
                ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-station-sign border border-amber-300'
                : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-750 border border-stone-700'
            }`}
          >
            <span>👥 参加者 自己紹介ボード</span>
          </button>
        </div>

        <button
          onClick={onOpenMyProfileEdit}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors"
        >
          <span>✏️ 自分の自己紹介・Substack登録</span>
        </button>
      </div>
    </header>
  );
};
