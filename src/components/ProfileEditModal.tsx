import React, { useState, useEffect } from 'react';
import { MemberProfile, UserProfile } from '../types';
import { MAX_GENRES_PER_USER } from '../lib/genres';
import { X, Save, ExternalLink, Sparkles, HelpCircle, MessageSquare, AlertCircle, Tag } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  currentMemberProfile: MemberProfile | null;
  availableGenres: string[];
  onSave: (updatedData: {
    postName: string;
    substackUrl: string;
    bio: string;
    strengths: string;
    weaknesses: string;
    genres: string[];
  }) => Promise<void>;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  currentMemberProfile,
  availableGenres,
  onSave,
}) => {
  const [postName, setPostName] = useState('');
  const [substackUrl, setSubstackUrl] = useState('');
  const [bio, setBio] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 開いたときだけ初期化する。編集中の Firestore 再取得で入力が消えないようにする。
  useEffect(() => {
    if (!isOpen) return;
    setPostName(currentMemberProfile?.postName || currentUserProfile.postName || '');
    setSubstackUrl(currentMemberProfile?.substackUrl || currentUserProfile.substackUrl || '');
    setBio(currentMemberProfile?.bio || currentUserProfile.bio || '');
    setStrengths(currentMemberProfile?.strengths || currentUserProfile.strengths || '');
    setWeaknesses(currentMemberProfile?.weaknesses || currentUserProfile.weaknesses || '');
    setGenres(
      (currentMemberProfile?.genres || [])
        .filter((g) => availableGenres.includes(g))
        .slice(0, MAX_GENRES_PER_USER)
    );
    setErrorMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- モーダルを開いた瞬間の値だけ使う
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleGenre = (tag: string) => {
    setGenres((prev) => {
      if (prev.includes(tag)) return prev.filter((g) => g !== tag);
      if (prev.length >= MAX_GENRES_PER_USER) {
        setErrorMsg(`ジャンルは最大${MAX_GENRES_PER_USER}つまで選択できます。`);
        return prev;
      }
      setErrorMsg(null);
      return [...prev, tag];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postName.trim()) {
      setErrorMsg('伝言板で表示するお名前を入力してください。');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      await onSave({
        postName: postName.trim(),
        substackUrl: substackUrl.trim(),
        bio: bio.trim(),
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        genres,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'プロフィールの更新に失敗しました。';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-stone-700 rounded-2xl shadow-2xl overflow-hidden text-stone-100 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h2 className="text-lg font-bold text-amber-300 font-station-sign">
                自己紹介プロフィールの編集
              </h2>
              <p className="text-xs text-stone-400">
                参加者自己紹介ボードに掲載される内容を設定します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-lg text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 font-station-sign">
              伝言板表示名（お名前）<span className="text-rose-400 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={postName}
              onChange={(e) => setPostName(e.target.value)}
              placeholder="例: タカシ"
              maxLength={20}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-lg p-2.5 text-sm text-amber-100 placeholder-stone-600 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 font-station-sign flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              ジャンル（最大{MAX_GENRES_PER_USER}つ）
            </label>
            <p className="text-[11px] text-stone-400 mb-2">
              選択中: {genres.length} / {MAX_GENRES_PER_USER}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableGenres.map((tag) => {
                const selected = genres.includes(tag);
                const disabled = !selected && genres.length >= MAX_GENRES_PER_USER;
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleGenre(tag)}
                    disabled={disabled}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                      selected
                        ? 'bg-amber-400 text-stone-950 border-amber-300'
                        : disabled
                          ? 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'
                          : 'bg-stone-950 text-stone-300 border-stone-700 hover:border-amber-500 hover:text-amber-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 font-station-sign flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              Substack（サブスタック）トップページURL
            </label>
            <input
              type="text"
              value={substackUrl}
              onChange={(e) => setSubstackUrl(e.target.value)}
              placeholder="https://yourname.substack.com"
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-lg p-2.5 text-sm text-stone-200 placeholder-stone-600 outline-none font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1 font-station-sign flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
              自己紹介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="趣味や普段の活動などを自由にお書きください。改行も反映されます。"
              rows={4}
              maxLength={300}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-lg p-2.5 text-sm text-stone-200 placeholder-stone-600 outline-none transition-colors resize-y whitespace-pre-wrap"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-400 mb-1 font-station-sign flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              強み（自分が助けられること）
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="例: Webアプリ作成、イラスト制作 など"
              rows={3}
              maxLength={200}
              className="w-full bg-stone-950 border border-emerald-900 focus:border-emerald-400 rounded-lg p-2.5 text-sm text-emerald-100 placeholder-stone-600 outline-none transition-colors resize-y whitespace-pre-wrap"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-400 mb-1 font-station-sign flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
              弱み（みんなに助けて欲しいこと）
            </label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="例: デザインの配色アドバイス、文章の要約 など"
              rows={3}
              maxLength={200}
              className="w-full bg-stone-950 border border-rose-900 focus:border-rose-400 rounded-lg p-2.5 text-sm text-rose-100 placeholder-stone-600 outline-none transition-colors resize-y whitespace-pre-wrap"
            />
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-700 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : 'プロフィールを登録・保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
