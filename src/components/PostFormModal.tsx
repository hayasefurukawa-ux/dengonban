import React, { useState, useEffect } from 'react';
import { UserProfile, ChalkColor } from '../types';
import { X, PenTool, AlertTriangle, Check, UserCheck, Palette } from 'lucide-react';

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; chalkColor: ChalkColor }) => Promise<void>;
  user: UserProfile | null;
  displayName: string;
  userActiveCount: number;
  maxUserLimit: number;
}

export const PostFormModal: React.FC<PostFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  displayName,
  userActiveCount,
  maxUserLimit = 2,
}) => {
  const [content, setContent] = useState<string>('');
  const [chalkColor, setChalkColor] = useState<ChalkColor>('white');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setChalkColor('white');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLimitReached = userActiveCount >= maxUserLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage('伝言を書くにはGoogleアカウントでのログインが必要です。');
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('表示名がありません。自己紹介または投稿名を先に登録してください。');
      return;
    }

    if (!content.trim()) {
      setErrorMessage('伝言本文を入力してください。');
      return;
    }

    if (isLimitReached) {
      setErrorMessage(
        `1人で一度に掲示できる伝言は最大${maxUserLimit}件までです。既存の伝言を削除してください。`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        content: content.trim(),
        chalkColor,
      });
      setContent('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '伝言の書き込みに失敗しました。';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors: { id: ChalkColor; label: string; bgClass: string; borderClass: string }[] = [
    { id: 'white', label: '白チョーク', bgClass: 'bg-slate-100 text-slate-900', borderClass: 'border-white' },
    { id: 'yellow', label: '黄チョーク', bgClass: 'bg-yellow-200 text-yellow-950', borderClass: 'border-yellow-300' },
    { id: 'pink', label: '桃チョーク', bgClass: 'bg-pink-200 text-pink-950', borderClass: 'border-pink-300' },
    { id: 'cyan', label: '青チョーク', bgClass: 'bg-cyan-200 text-cyan-950', borderClass: 'border-cyan-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-stone-700 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg font-station-sign">
            <PenTool className="w-5 h-5 text-amber-400" />
            <span>伝言板に書き込む</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-stone-800/80 border border-stone-700 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-stone-300 font-bold flex items-center gap-1">
                <span>投稿者</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-amber-300 font-bold text-sm mt-0.5">{displayName || '（未設定）'}</div>
              <div className="text-stone-400 text-[11px] mt-1">
                あなたの掲示中伝言:{' '}
                <span
                  className={
                    isLimitReached ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'
                  }
                >
                  {userActiveCount}
                </span>{' '}
                / {maxUserLimit} 件
              </div>
            </div>
          </div>

          {isLimitReached && (
            <div className="flex items-start gap-2 bg-rose-950/80 border border-rose-600/50 text-rose-200 p-3 rounded-lg text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">投稿上限に達しています。</span>
                <p className="mt-0.5 text-rose-300/80">
                  既存の伝言を「黒板消し」で消去してから書き込んでください。
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-900/60 border border-rose-500/60 text-rose-200 text-xs p-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              チョークの色を選択
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setChalkColor(c.id)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    chalkColor === c.id
                      ? `${c.bgClass} ${c.borderClass} ring-2 ring-amber-400 shadow-md`
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500'
                  }`}
                >
                  {chalkColor === c.id && <Check className="w-3.5 h-3.5" />}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              伝言本文<span className="text-rose-400 ml-1">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: ケンジへ 先に行くね。18時に喫茶店で待ってる！"
              rows={3}
              maxLength={100}
              className="w-full bg-chalkboard chalkboard-bg font-chalk text-lg p-3 rounded-lg text-amber-200 border border-stone-700 focus:border-amber-400 focus:outline-none placeholder-stone-600 resize-none"
              required
            />
            <div className="flex justify-between items-center text-[11px] text-stone-500 mt-1">
              <span>※返信・いいね機能はありません</span>
              <span>{content.length} / 100文字</span>
            </div>
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
              disabled={isSubmitting || isLimitReached}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-all ${
                isLimitReached
                  ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-amber-400/20 active:scale-95'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'チョークで書く...' : '黒板に書き込む'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
