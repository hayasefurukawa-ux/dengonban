import React from 'react';
import { MemberProfile, Post } from '../types';
import { X, ExternalLink, Heart, Sparkles, HelpCircle, Edit3, Mail, MessageSquare } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MemberProfile | null;
  userPosts: Post[];
  isOwnProfile: boolean;
  onOpenEditProfile: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  userPosts,
  isOwnProfile,
  onOpenEditProfile,
}) => {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-stone-700 rounded-2xl shadow-2xl overflow-hidden text-stone-100 max-h-[90vh] flex flex-col">
        
        {/* Header / Cover */}
        <div className="relative bg-gradient-to-r from-emerald-900 via-stone-900 to-amber-950 p-6 border-b border-stone-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                {profile.substackUrl ? (
                  <a
                    href={profile.substackUrl.startsWith('http') ? profile.substackUrl : `https://${profile.substackUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl font-bold text-amber-300 hover:text-amber-200 underline decoration-amber-400/60 font-station-sign flex items-center gap-2"
                    title={`${profile.postName}さんのSubstack TOPページを開く`}
                  >
                    <span>{profile.postName}</span>
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                  </a>
                ) : (
                  <h2 className="text-2xl font-bold text-amber-300 font-station-sign">
                    {profile.postName}
                  </h2>
                )}

                {isOwnProfile && (
                  <span className="text-[10px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                    あなた
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Substack Top Page Link Section */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-amber-400 font-station-sign flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                Substack（サブスタック）トップページ
              </span>
              {profile.substackUrl && (
                <span className="text-[10px] text-amber-200/80 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/30 font-mono">
                  公式ニュースレター
                </span>
              )}
            </div>

            {profile.substackUrl ? (
              <a
                href={profile.substackUrl.startsWith('http') ? profile.substackUrl : `https://${profile.substackUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between bg-stone-900 hover:bg-stone-800 border border-amber-500/30 p-3 rounded-lg text-sm text-amber-200 hover:text-white font-mono transition-all"
              >
                <span className="truncate underline underline-offset-4 decoration-amber-500/50 group-hover:decoration-amber-300">
                  {profile.substackUrl}
                </span>
                <span className="text-xs font-bold bg-amber-500 group-hover:bg-amber-400 text-stone-950 px-2.5 py-1 rounded flex items-center gap-1 shrink-0 ml-2">
                  訪問する
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ) : (
              <div className="text-xs text-stone-400 italic bg-stone-900/60 p-2.5 rounded border border-stone-800">
                Substack URLは未登録です。
              </div>
            )}
          </div>

          {/* Genre Tags */}
          {profile.genres && profile.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full"
                >
                  #{genre}
                </span>
              ))}
            </div>
          )}

          {/* Bio / 自己紹介 */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 mb-1.5 flex items-center gap-1 font-station-sign">
              <MessageSquare className="w-3.5 h-3.5 text-stone-300" />
              自己紹介
            </h3>
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-sm leading-relaxed text-stone-200 whitespace-pre-wrap">
              {profile.bio || '自己紹介はまだ記入されていません。'}
            </div>
          </div>

          {/* Strengths / 強み (助けられること) */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4">
            <h3 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5 font-station-sign">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              強み（自分が助けられること）
            </h3>
            <div className="text-sm text-emerald-100 font-medium leading-relaxed bg-stone-950/80 p-3 rounded-lg border border-emerald-800/40 whitespace-pre-wrap">
              {profile.strengths || '強み・助けられることは未登録です。'}
            </div>
          </div>

          {/* Weaknesses / 弱み (助けて欲しいこと) */}
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4">
            <h3 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5 font-station-sign">
              <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
              弱み（みんなに助けて欲しいこと）
            </h3>
            <div className="text-sm text-rose-100 font-medium leading-relaxed bg-stone-950/80 p-3 rounded-lg border border-rose-800/40 whitespace-pre-wrap">
              {profile.weaknesses || '弱み・助けて欲しいことは未登録です。'}
            </div>
          </div>

          {/* Active Messages on Board */}
          {userPosts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1 font-station-sign">
                <span>伝言板に掲示中のメッセージ ({userPosts.length}件)</span>
              </h3>
              <div className="space-y-2">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="chalkboard-bg p-3 rounded-lg border border-white/20 text-xs font-chalk text-white shadow-inner"
                  >
                    <div className="text-[10px] text-emerald-200/80 mb-1 font-mono">
                      {post.createdAt} 掲示
                    </div>
                    <p className="chalk-text-yellow text-sm whitespace-pre-wrap break-words">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            更新日: {profile.updatedAt || '未設定'}
          </span>

          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditProfile();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>自己紹介を編集</span>
              </button>
            )}
            <button
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
