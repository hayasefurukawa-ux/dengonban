import React, { useState } from 'react';
import { MemberProfile, UserProfile } from '../types';
import { ExternalLink, Sparkles, HelpCircle, Edit3, Search, Users, ArrowRight } from 'lucide-react';

interface ProfileBoardProps {
  profiles: MemberProfile[];
  currentUserProfile: UserProfile;
  onSelectProfile: (profile: MemberProfile) => void;
  onOpenEditProfile: () => void;
  onBackToMainBoard: () => void;
}

export const ProfileBoard: React.FC<ProfileBoardProps> = ({
  profiles,
  currentUserProfile,
  onSelectProfile,
  onOpenEditProfile,
  onBackToMainBoard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.postName.toLowerCase().includes(term) ||
      p.bio.toLowerCase().includes(term) ||
      p.strengths.toLowerCase().includes(term) ||
      p.weaknesses.toLowerCase().includes(term) ||
      p.substackUrl.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-amber-950/60 to-stone-900 border-2 border-stone-700 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👥</span>
              <h2 className="text-2xl font-bold text-amber-300 font-station-sign tracking-wide">
                参加者 自己紹介ボード
              </h2>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
              伝言板に集うメンバーのプロフィール一覧です。Substack（サブスタック）のトップページ確認や、お互いの「強み（助けられること）」「弱み（助けて欲しいこと）」を確認できます。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenEditProfile}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all transform active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>自分の自己紹介を登録・編集</span>
            </button>
            <button
              onClick={onBackToMainBoard}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 transition-colors"
            >
              <span>伝言板に戻る</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="お名前、強み、弱み、キーワードでメンバーを検索..."
            className="w-full bg-stone-950/80 border border-stone-700 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-200 placeholder-stone-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => {
            const isSelf = profile.userId === currentUserProfile.id;

            return (
              <div
                key={profile.userId}
                onClick={() => onSelectProfile(profile)}
                className="group relative bg-stone-900 hover:bg-stone-850 border-2 border-stone-800 hover:border-amber-500/60 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {profile.substackUrl ? (
                            <a
                              href={profile.substackUrl.startsWith('http') ? profile.substackUrl : `https://${profile.substackUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-lg font-bold text-amber-200 hover:text-amber-300 underline decoration-amber-400/60 hover:decoration-amber-300 font-station-sign flex items-center gap-1.5"
                              title={`${profile.postName}さんのSubstack TOPページを開く`}
                            >
                              <span>{profile.postName}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                            </a>
                          ) : (
                            <h3 className="text-lg font-bold text-amber-200 font-station-sign">
                              {profile.postName}
                            </h3>
                          )}

                          {isSelf && (
                            <span className="text-[10px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                              あなた
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {profile.substackUrl && (
                      <a
                        href={profile.substackUrl.startsWith('http') ? profile.substackUrl : `https://${profile.substackUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-lg font-mono transition-colors shrink-0"
                      >
                        <span>Substack TOP</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Bio Preview */}
                  <p className="text-xs text-stone-300 line-clamp-2 mb-4 leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
                    {profile.bio || '自己紹介はまだ未記入です。'}
                  </p>

                  {/* Strengths & Weaknesses Chips */}
                  <div className="space-y-2">
                    {/* Strengths */}
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mb-1 font-station-sign">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>強み (助けられること)</span>
                      </div>
                      <p className="text-xs text-emerald-100 line-clamp-1 font-medium">
                        {profile.strengths || '未登録'}
                      </p>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1 mb-1 font-station-sign">
                        <HelpCircle className="w-3 h-3 text-rose-400" />
                        <span>弱み (助けて欲しいこと)</span>
                      </div>
                      <p className="text-xs text-rose-100 line-clamp-1 font-medium">
                        {profile.weaknesses || '未登録'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                  <span>クリックして詳細プロフィールを表示</span>
                  <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                    詳細を見る &rarr;
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-stone-900 border-2 border-dashed border-stone-800 rounded-2xl p-6">
            <Users className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <p className="text-sm text-stone-300 font-medium">
              該当するメンバーが見つかりませんでした。
            </p>
            <p className="text-xs text-stone-500 mt-1">
              検索ワードを変更するか、新しい自己紹介を投稿してみてください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
