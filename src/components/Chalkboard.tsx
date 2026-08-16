import React from 'react';
import { Post, UserProfile, MemberProfile, ChalkColor } from '../types';
import { PenTool, Eraser, ExternalLink, CheckCircle2 } from 'lucide-react';

interface ChalkboardProps {
  posts: Post[];
  currentUser: UserProfile | null;
  isAdmin: boolean;
  profiles?: MemberProfile[];
  onOpenPostModal: () => void;
  onDeletePost: (postId: string) => void;
  onOpenProfileByUserId: (userId: string) => void;
  maxBoardLimit: number; // 20
  maxUserLimit: number; // 2
}

export const Chalkboard: React.FC<ChalkboardProps> = ({
  posts,
  currentUser,
  isAdmin,
  profiles = [],
  onOpenPostModal,
  onDeletePost,
  onOpenProfileByUserId,
  maxBoardLimit = 20,
  maxUserLimit = 2,
}) => {
  // Calculate current user's active posts
  const userActiveCount = currentUser
    ? posts.filter((p) => p.userId === currentUser.id).length
    : 0;

  const isUserLimitReached = userActiveCount >= maxUserLimit;

  // Chalk color helper class
  const getChalkClass = (color: ChalkColor) => {
    switch (color) {
      case 'yellow':
        return 'chalk-text-yellow';
      case 'pink':
        return 'chalk-text-pink';
      case 'cyan':
        return 'chalk-text-cyan';
      default:
        return 'chalk-text-white';
    }
  };

  // Author Name Click Handler: Navigate to Substack TOP or open profile
  const handleAuthorClick = (userId: string) => {
    const matchedProfile = profiles.find((p) => p.userId === userId);
    if (matchedProfile?.substackUrl && matchedProfile.substackUrl.trim().startsWith('http')) {
      window.open(matchedProfile.substackUrl.trim(), '_blank', 'noopener,noreferrer');
    } else {
      onOpenProfileByUserId(userId);
    }
  };

  // Build array of slots (filled posts + empty placeholders)
  const slots = Array.from({ length: maxBoardLimit }, (_, index) => posts[index] || null);

  return (
    <div className="w-full max-w-5xl mx-auto my-4">
      {/* Wood Framed Blackboard Canvas */}
      <div className="wood-frame rounded-lg overflow-hidden shadow-2xl transition-all">
        {/* Main Chalkboard Interior */}
        <div className="chalkboard-bg p-4 sm:p-6 text-stone-100 min-h-[580px] flex flex-col justify-between relative">
          
          {/* Subtle Chalk Dust Trace */}
          <div className="absolute inset-0 pointer-events-none chalk-erase-mark opacity-40" />

          <div>
            {/* Board Title & Rule Indicators */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 text-amber-300 p-2 rounded border border-amber-400/30">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-chalk text-2xl sm:text-3xl font-bold tracking-wider text-white chalk-text-white flex items-center gap-2">
                    ゆっ くり 駅 伝 言 板
                  </h2>
                  <p className="text-xs text-emerald-200/80 font-mono flex items-center gap-2 mt-0.5">
                    <span>表示上限: 最大20件</span>
                    <span>•</span>
                    <span>連続投稿: 1人上限2件</span>
                    <span>•</span>
                    <span className="text-amber-200 font-bold">返信・いいね不可</span>
                  </p>
                </div>
              </div>

              {/* Status & Action Control */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-stone-300 font-mono">
                    掲示数: <span className="text-amber-300 font-bold">{posts.length}</span> / {maxBoardLimit} 件
                  </div>
                  {currentUser && (
                    <div className="text-[11px] text-stone-400 font-mono">
                      あなたの投稿: <span className={userActiveCount >= maxUserLimit ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>{userActiveCount}</span> / {maxUserLimit} 件
                    </div>
                  )}
                </div>

                <button
                  onClick={onOpenPostModal}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg transition-all transform active:scale-95 ${
                    isUserLimitReached
                      ? 'bg-stone-700 text-stone-400 cursor-not-allowed border border-stone-600'
                      : 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-amber-400/20 hover:shadow-amber-400/30'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>チョークで伝言を書く</span>
                </button>
              </div>
            </div>

            {/* 伝言スロット */}
            <div className="space-y-3">
              {slots.map((post, index) => {
                const slotNumber = index + 1;

                if (!post) {
                  // Empty Slot Placeholder
                  return (
                    <div
                      key={`empty-slot-${slotNumber}`}
                      className="flex items-center justify-between p-3 rounded border border-dashed border-white/10 bg-black/10 text-stone-500/70 text-sm font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-800 text-stone-500 font-bold text-xs border border-stone-700">
                          {slotNumber}
                        </span>
                        <span>[ 伝言枠 {slotNumber} : 空き ]</span>
                      </div>
                      <span className="text-xs text-stone-600">※チョークで書き込み可能</span>
                    </div>
                  );
                }

                const isOwner = currentUser?.id === post.userId;
                const canDelete = isOwner || isAdmin;

                return (
                  <div
                    key={post.id}
                    className="group relative bg-black/25 hover:bg-black/40 border border-white/15 hover:border-white/30 rounded-lg p-3.5 transition-all shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                      {/* Author Info & Handle (投稿名) */}
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                          {slotNumber}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAuthorClick(post.userId)}
                            className="font-bold text-white text-base hover:text-amber-300 flex items-center gap-1.5 underline decoration-amber-400/50 hover:decoration-amber-300 transition-all cursor-pointer"
                            title={`${post.postName}さんのSubstack TOPページを開く`}
                          >
                            <span>{post.postName}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400 opacity-80" />
                          </button>

                          <button
                            onClick={() => onOpenProfileByUserId(post.userId)}
                            className="text-[10px] text-amber-200/90 hover:text-amber-100 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 px-2 py-0.5 rounded transition-colors"
                            title="自己紹介プロフィールを見る"
                          >
                            👤 プロフィール
                          </button>
                        </div>

                        {isOwner && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                            あなた
                          </span>
                        )}
                      </div>

                      {/* Timestamp & Eraser Action */}
                      <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                        <span className="text-emerald-200/90">{post.createdAt}</span>

                        {canDelete && (
                          <button
                            onClick={() => onDeletePost(post.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-rose-900/80 text-stone-300 hover:text-rose-200 border border-stone-700 hover:border-rose-500 rounded text-xs transition-colors"
                            title="黒板消しでこの伝言を消去"
                          >
                            <Eraser className="w-3.5 h-3.5 text-amber-400" />
                            <span>黒板消し</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content Body */}
                    <div className={`font-chalk text-lg sm:text-xl pl-2 py-1 ${getChalkClass(post.chalkColor)}`}>
                      {post.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Notice & Board Rules */}
          <div className="mt-6 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-stone-400 font-mono gap-2">
            <div>
              <span>※駅の伝言板ルール: 掲示最大{maxBoardLimit}件 / 1人最大{maxUserLimit}件まで</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>返信・いいね機能はついていません</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
