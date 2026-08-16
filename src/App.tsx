/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Post, UserProfile, MemberProfile, ChalkColor } from './types';
import { StationHeader } from './components/StationHeader';
import { Chalkboard } from './components/Chalkboard';
import { ProfileBoard } from './components/ProfileBoard';
import { ProfileModal } from './components/ProfileModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { PostFormModal } from './components/PostFormModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { Info, HelpCircle } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { authHeaders } from './lib/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

const LOCAL_STORAGE_STATION_KEY = 'station_board_name_v1';
const POST_NAME_STORAGE_PREFIX = 'station_board_postname_';

export default function App() {
  const [activeTab, setActiveTab] = useState<'board' | 'profiles'>('board');

  const [posts, setPosts] = useState<Post[]>([]);
  const [maxBoardLimit, setMaxBoardLimit] = useState<number>(20);
  const [maxUserLimit, setMaxUserLimit] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stationName, setStationName] = useState<string>('昭和中央駅');

  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<MemberProfile | null>(null);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState<boolean>(false);
  const [showRulesInfo, setShowRulesInfo] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.removeItem('station_board_user_v1');
    } catch {
      /* ignore */
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const savedPostName =
          localStorage.getItem(`${POST_NAME_STORAGE_PREFIX}${fbUser.uid}`) || '';
        setCurrentUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          googleName: fbUser.displayName || 'Googleユーザー',
          avatar:
            fbUser.photoURL ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          postName: savedPostName || fbUser.displayName || '',
          isAdmin: false,
        });
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser?.id && currentUser.postName) {
      try {
        localStorage.setItem(
          `${POST_NAME_STORAGE_PREFIX}${currentUser.id}`,
          currentUser.postName
        );
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser]);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setMemberProfiles(data.profiles || []);
      }
    } catch (e) {
      console.error('Failed to fetch profiles:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(LOCAL_STORAGE_STATION_KEY);
      if (savedName) setStationName(savedName);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchBoardData = useCallback(async () => {
    try {
      const response = await fetch('/api/board');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        if (data.maxBoardLimit) setMaxBoardLimit(data.maxBoardLimit);
        if (data.maxUserLimit) setMaxUserLimit(data.maxUserLimit);
      }
    } catch (e) {
      console.error('Failed to fetch board:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoardData();
    fetchProfiles();

    let unsubscribePosts: (() => void) | null = null;
    let unsubscribeProfiles: (() => void) | null = null;

    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20));
      unsubscribePosts = onSnapshot(
        postsQuery,
        (snapshot) => {
          const livePosts: Post[] = [];
          snapshot.forEach((d) => {
            livePosts.push(d.data() as Post);
          });
          setPosts(livePosts);
          setIsLoading(false);
        },
        (err) => {
          console.error('Firestore posts snapshot error:', err);
        }
      );

      unsubscribeProfiles = onSnapshot(
        collection(db, 'profiles'),
        (snapshot) => {
          const liveProfiles: MemberProfile[] = [];
          snapshot.forEach((d) => {
            liveProfiles.push(d.data() as MemberProfile);
          });
          setMemberProfiles(liveProfiles);
        },
        (err) => {
          console.error('Firestore profiles snapshot error:', err);
        }
      );
    } catch (e) {
      console.error('Real-time subscription setup error:', e);
    }

    const interval = setInterval(() => {
      fetchBoardData();
      fetchProfiles();
    }, 10000);

    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeProfiles) unsubscribeProfiles();
      clearInterval(interval);
    };
  }, [fetchBoardData, fetchProfiles]);

  const requireLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (e) {
      console.error(e);
      alert('ログアウトに失敗しました。');
    }
  };

  const handleOpenProfileByUserId = (userId: string) => {
    const profile = memberProfiles.find((p) => p.userId === userId);
    if (profile) {
      setSelectedProfile(profile);
      setIsProfileModalOpen(true);
    } else {
      const targetPost = posts.find((p) => p.userId === userId);
      if (targetPost) {
        setSelectedProfile({
          userId: targetPost.userId,
          userEmail: targetPost.userEmail,
          userAvatar: targetPost.userAvatar,
          postName: targetPost.postName,
          substackUrl: '',
          bio: 'まだ自己紹介が登録されていません。',
          strengths: '',
          weaknesses: '',
          updatedAt: '未登録',
        });
        setIsProfileModalOpen(true);
      }
    }
  };

  const handleSaveMemberProfile = async (updatedData: {
    postName: string;
    substackUrl: string;
    bio: string;
    strengths: string;
    weaknesses: string;
  }) => {
    if (!currentUser) return;

    const res = await fetch(`/api/profiles/${currentUser.id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify({
        userAvatar: currentUser.avatar,
        googleName: currentUser.googleName,
        postName: updatedData.postName,
        substackUrl: updatedData.substackUrl,
        bio: updatedData.bio,
        strengths: updatedData.strengths,
        weaknesses: updatedData.weaknesses,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'プロフィールの保存に失敗しました。');
    }

    setCurrentUser({
      ...currentUser,
      postName: updatedData.postName,
      substackUrl: updatedData.substackUrl,
      bio: updatedData.bio,
      strengths: updatedData.strengths,
      weaknesses: updatedData.weaknesses,
    });

    if (selectedProfile?.userId === currentUser.id && result.profile) {
      setSelectedProfile(result.profile);
    }

    await fetchProfiles();
    await fetchBoardData();
  };

  const handleCreatePost = async (data: {
    content: string;
    chalkColor: ChalkColor;
  }) => {
    if (!currentUser) {
      throw new Error('伝言を書くにはGoogleアカウントでのログインが必要です。');
    }

    const profile = memberProfiles.find((p) => p.userId === currentUser.id);
    const postName =
      profile?.postName?.trim() ||
      currentUser.postName?.trim() ||
      currentUser.googleName?.trim() ||
      '';

    if (!postName) {
      throw new Error('表示名がありません。自己紹介または投稿名を先に登録してください。');
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        postName,
        content: data.content,
        chalkColor: data.chalkColor,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '投稿に失敗しました。');
    }

    await fetchBoardData();
    await fetchProfiles();
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) {
      requireLogin();
      return;
    }

    if (!confirm('この伝言を黒板消しで消去しますか？')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: await authHeaders(),
        body: JSON.stringify({ isAdmin }),
      });

      if (res.ok) {
        fetchBoardData();
      } else {
        const result = await res.json();
        alert(result.error || '削除に失敗しました。');
      }
    } catch (err) {
      console.error(err);
      alert('削除処理中にエラーが発生しました。');
    }
  };

  const handleSaveProfileName = (newPostName: string) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        postName: newPostName,
      });
    }
  };

  const userActiveCount = currentUser
    ? posts.filter((p) => p.userId === currentUser.id).length
    : 0;

  const currentDisplayName = currentUser
    ? memberProfiles.find((p) => p.userId === currentUser.id)?.postName?.trim() ||
      currentUser.postName?.trim() ||
      currentUser.googleName?.trim() ||
      ''
    : '';

  if (!authReady) {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-300 flex items-center justify-center font-chalk text-xl">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col p-3 sm:p-6 select-none font-sans">
      <StationHeader
        user={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenEditProfileModal={() => {
          if (!currentUser) {
            requireLogin();
            return;
          }
          setIsEditProfileModalOpen(true);
        }}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMyProfileEdit={() => {
          if (!currentUser) {
            requireLogin();
            return;
          }
          setIsProfileEditModalOpen(true);
        }}
      />

      <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto">
        {activeTab === 'board' ? (
          isLoading ? (
            <div className="w-full h-96 wood-frame rounded-lg chalkboard-bg flex items-center justify-center text-amber-300 font-chalk text-2xl animate-pulse">
              黒板を読み込んでいます...
            </div>
          ) : (
            <Chalkboard
              posts={posts}
              currentUser={currentUser}
              isAdmin={isAdmin}
              profiles={memberProfiles}
              onOpenPostModal={() => {
                if (!currentUser) {
                  requireLogin();
                  return;
                }
                setIsPostModalOpen(true);
              }}
              onDeletePost={handleDeletePost}
              onOpenProfileByUserId={handleOpenProfileByUserId}
              maxBoardLimit={maxBoardLimit}
              maxUserLimit={maxUserLimit}
            />
          )
        ) : (
          <div className="w-full">
            <ProfileBoard
              profiles={memberProfiles}
              currentUserProfile={
                currentUser || {
                  id: 'guest',
                  email: '',
                  googleName: '',
                  avatar: '',
                  postName: '',
                  isAdmin: false,
                }
              }
              onSelectProfile={(profile) => {
                setSelectedProfile(profile);
                setIsProfileModalOpen(true);
              }}
              onOpenEditProfile={() => {
                if (!currentUser) {
                  requireLogin();
                  return;
                }
                setIsProfileEditModalOpen(true);
              }}
              onBackToMainBoard={() => setActiveTab('board')}
            />
          </div>
        )}

        <div className="w-full mt-6 flex items-center justify-between text-xs text-stone-400 border-t border-stone-800 pt-3 px-2">
          <button
            onClick={() => setShowRulesInfo(!showRulesInfo)}
            className="flex items-center gap-1.5 text-stone-400 hover:text-amber-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>駅の伝言板・自己紹介ボードの使い方ガイド</span>
          </button>

          <span className="text-[11px] text-stone-500 hidden sm:inline">
            昭和・平成レトロ 駅の伝言板 & 参加者自己紹介ボード Web App
          </span>
        </div>

        {showRulesInfo && (
          <div className="w-full mt-3 bg-stone-900 border border-stone-800 rounded-xl p-4 text-xs space-y-2 text-stone-300 animate-fade-in">
            <div className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-1.5 font-station-sign">
              <Info className="w-4 h-4" />
              【伝言板 & 自己紹介ボードのご利用案内】
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc list-inside text-stone-300">
              <li>
                <strong className="text-white">ログイン:</strong> 伝言の書き込み・削除・自己紹介登録には
                <span className="text-amber-300 font-bold">Googleログイン</span>が必要です。
              </li>
              <li>
                <strong className="text-white">表示上限:</strong> 黒板上に表示できる伝言は最大
                <span className="text-amber-300 font-bold">20件</span>です。
              </li>
              <li>
                <strong className="text-white">連続投稿制限:</strong> 1人が同時に掲示できる伝言は最大
                <span className="text-amber-300 font-bold">2件</span>までです。
              </li>
              <li>
                <strong className="text-white">自己紹介ボード:</strong> 上部タブから参加者プロフィールを見られます。
              </li>
            </ul>
          </div>
        )}
      </main>

      <PostFormModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handleCreatePost}
        user={currentUser}
        displayName={currentDisplayName}
        userActiveCount={userActiveCount}
        maxUserLimit={maxUserLimit}
      />

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(newUser) => setCurrentUser(newUser)}
        currentUser={currentUser}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={currentUser}
        onSaveProfile={handleSaveProfileName}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={selectedProfile}
        userPosts={selectedProfile ? posts.filter((p) => p.userId === selectedProfile.userId) : []}
        isOwnProfile={currentUser?.id === selectedProfile?.userId}
        onOpenEditProfile={() => {
          if (!currentUser) {
            requireLogin();
            return;
          }
          setIsProfileEditModalOpen(true);
        }}
      />

      {currentUser && (
        <ProfileEditModal
          isOpen={isProfileEditModalOpen}
          onClose={() => setIsProfileEditModalOpen(false)}
          currentUserProfile={currentUser}
          currentMemberProfile={memberProfiles.find((p) => p.userId === currentUser.id) || null}
          onSave={handleSaveMemberProfile}
        />
      )}
    </div>
  );
}
