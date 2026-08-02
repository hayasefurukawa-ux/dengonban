/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Post, AdminNotice, UserProfile, MemberProfile, ChalkColor } from './types';
import { StationHeader } from './components/StationHeader';
import { Chalkboard } from './components/Chalkboard';
import { ProfileBoard } from './components/ProfileBoard';
import { ProfileModal } from './components/ProfileModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { PostFormModal } from './components/PostFormModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { AdminNoticeModal } from './components/AdminNoticeModal';
import { Info, HelpCircle } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';


const LOCAL_STORAGE_USER_KEY = 'station_board_user_v1';
const LOCAL_STORAGE_STATION_KEY = 'station_board_name_v1';

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'board' | 'profiles'>('board');

  // Board Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [adminNotice, setAdminNotice] = useState<AdminNotice>({
    content: '【ゆっくり駅伝言板 管理人の一言】伝言板は皆様の温かい伝言で成り立っています。ごゆっくりどうぞ。',
    updatedAt: '',
    updatedBy: 'ゆっくり駅伝言板 管理人',
  });
  const [maxBoardLimit, setMaxBoardLimit] = useState<number>(20);
  const [maxUserLimit, setMaxUserLimit] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stationName, setStationName] = useState<string>('昭和中央駅');

  // Member Profiles State
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<MemberProfile | null>(null);

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up legacy hardcoded 'タカシ' if present
        if (parsed.postName === 'タカシ' && parsed.email === 'dailymemo@gmail.com' && !parsed.bio) {
          parsed.postName = '';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default logged in Google Account for instant playability
    return {
      id: 'user-dailymemo@gmail.com',
      email: 'dailymemo@gmail.com',
      googleName: 'Googleユーザー',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      postName: '',
      isAdmin: false,
    };
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Modals Control State
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isAdminNoticeModalOpen, setIsAdminNoticeModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState<boolean>(false);
  const [showRulesInfo, setShowRulesInfo] = useState<boolean>(false);

  // Fetch Member Profiles
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

  // Load Saved Station Name
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(LOCAL_STORAGE_STATION_KEY);
      if (savedName) setStationName(savedName);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save User to LocalStorage
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser]);

  // Fetch Board Data from API
  const fetchBoardData = useCallback(async () => {
    try {
      const response = await fetch('/api/board');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        if (data.adminNotice) setAdminNotice(data.adminNotice);
        if (data.maxBoardLimit) setMaxBoardLimit(data.maxBoardLimit);
        if (data.maxUserLimit) setMaxUserLimit(data.maxUserLimit);
      }
    } catch (err) {
      console.error('Failed to fetch board data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoardData();
    fetchProfiles();

    // Subscribe to real-time Firestore updates
    let unsubscribePosts: (() => void) | null = null;
    let unsubscribeProfiles: (() => void) | null = null;
    let unsubscribeNotice: (() => void) | null = null;

    try {
      // 1. Real-time Posts
      const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20));
      unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
        const livePosts: Post[] = [];
        snapshot.forEach((doc) => {
          livePosts.push(doc.data() as Post);
        });
        setPosts(livePosts);
        setIsLoading(false);
      }, (err) => {
        console.error('Firestore posts snapshot error:', err);
      });

      // 2. Real-time Profiles
      unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
        const liveProfiles: MemberProfile[] = [];
        snapshot.forEach((doc) => {
          liveProfiles.push(doc.data() as MemberProfile);
        });
        setMemberProfiles(liveProfiles);
      }, (err) => {
        console.error('Firestore profiles snapshot error:', err);
      });

      // 3. Real-time Admin Notice
      unsubscribeNotice = onSnapshot(doc(db, 'notices', 'station_notice'), (docSnap) => {
        if (docSnap.exists()) {
          setAdminNotice(docSnap.data() as AdminNotice);
        }
      }, (err) => {
        console.error('Firestore notice snapshot error:', err);
      });
    } catch (e) {
      console.error('Real-time subscription setup error:', e);
    }

    // Fallback interval check every 10s
    const interval = setInterval(() => {
      fetchBoardData();
      fetchProfiles();
    }, 10000);

    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeProfiles) unsubscribeProfiles();
      if (unsubscribeNotice) unsubscribeNotice();
      clearInterval(interval);
    };
  }, [fetchBoardData, fetchProfiles]);

  // Open Profile Modal by UserId (e.g. clicking name on chalkboard)
  const handleOpenProfileByUserId = (userId: string) => {
    const profile = memberProfiles.find((p) => p.userId === userId);
    if (profile) {
      setSelectedProfile(profile);
      setIsProfileModalOpen(true);
    } else {
      // Fallback: create temporary profile from post if not found in db
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

  // Save Profile Handler (Update Substack, bio, strengths, weaknesses, postName)
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        userEmail: currentUser.email,
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

    // Update currentUser state and localStorage
    const updatedUser: UserProfile = {
      ...currentUser,
      postName: updatedData.postName,
      substackUrl: updatedData.substackUrl,
      bio: updatedData.bio,
      strengths: updatedData.strengths,
      weaknesses: updatedData.weaknesses,
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.error(e);
    }

    if (selectedProfile?.userId === currentUser.id && result.profile) {
      setSelectedProfile(result.profile);
    }

    // Refresh data
    await fetchProfiles();
    await fetchBoardData();
  };

  // Write Post Action
  const handleCreatePost = async (data: {
    postName: string;
    content: string;
    chalkColor: ChalkColor;
  }) => {
    if (!currentUser) return;

    // Update local postName if changed in form
    if (currentUser.postName !== data.postName) {
      const updatedUser = { ...currentUser, postName: data.postName };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userAvatar: currentUser.avatar,
        postName: data.postName,
        content: data.content,
        chalkColor: data.chalkColor,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '投稿に失敗しました。');
    }

    // Refresh board and profiles immediately
    await fetchBoardData();
    await fetchProfiles();
  };

  // Delete Post Action (黒板消し)
  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;

    if (!confirm('この伝言を黒板消しで消去しますか？')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          isAdmin,
        }),
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

  // Save Admin Notice Action
  const handleSaveAdminNotice = async (newNotice: string, updatedBy: string) => {
    const res = await fetch('/api/admin-notice', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newNotice,
        updatedBy,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      setAdminNotice(result.adminNotice);
    } else {
      alert('管理人の一言の更新に失敗しました。');
    }
  };

  // User Profile Name Change
  const handleSaveProfileName = (newPostName: string) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        postName: newPostName,
      });
    }
  };

  // Count active posts by current user
  const userActiveCount = currentUser
    ? posts.filter((p) => p.userId === currentUser.id).length
    : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col p-3 sm:p-6 select-none font-sans">
      
      {/* Header Section */}
      <StationHeader
        user={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenEditProfileModal={() => setIsProfileEditModalOpen(true)}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMyProfileEdit={() => setIsProfileEditModalOpen(true)}
      />

      {/* Main Content View Switch (伝言板 ↔ 自己紹介ボード) */}
      <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto">
        {activeTab === 'board' ? (
          isLoading ? (
            <div className="w-full h-96 wood-frame rounded-lg chalkboard-bg flex items-center justify-center text-amber-300 font-chalk text-2xl animate-pulse">
              黒板を読み込んでいます...
            </div>
          ) : (
            <Chalkboard
              posts={posts}
              adminNotice={adminNotice}
              currentUser={currentUser}
              isAdmin={isAdmin}
              profiles={memberProfiles}
              onOpenPostModal={() => setIsPostModalOpen(true)}
              onOpenAdminNoticeModal={() => setIsAdminNoticeModalOpen(true)}
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
              onOpenEditProfile={() => setIsProfileEditModalOpen(true)}
              onBackToMainBoard={() => setActiveTab('board')}
            />
          </div>
        )}

        {/* Bottom Quick Help Bar */}
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

        {/* Rules Guide Drawer */}
        {showRulesInfo && (
          <div className="w-full mt-3 bg-stone-900 border border-stone-800 rounded-xl p-4 text-xs space-y-2 text-stone-300 animate-fade-in">
            <div className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-1.5 font-station-sign">
              <Info className="w-4 h-4" />
              【伝言板 & 自己紹介ボードのご利用案内】
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc list-inside text-stone-300">
              <li><strong className="text-white">表示上限:</strong> 黒板上に表示できる伝言は最大<span className="text-amber-300 font-bold">20件</span>です。</li>
              <li><strong className="text-white">連続投稿制限:</strong> 1人（1アカウント）が同時に掲示できる伝言は最大<span className="text-amber-300 font-bold">2件</span>までです。</li>
              <li><strong className="text-white">Substackへの移動:</strong> 伝言板やボード上の名前をクリックすると、その方のSubstack（サブスタック）TOPページへ直接移動できます。</li>
              <li><strong className="text-white">自己紹介ボード:</strong> 上部タブ「👥 参加者 自己紹介ボード」から全員のプロフィール一覧がいつでも見られます。</li>
            </ul>
          </div>
        )}
      </main>

      {/* Modals */}
      <PostFormModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handleCreatePost}
        user={currentUser}
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

      <AdminNoticeModal
        isOpen={isAdminNoticeModalOpen}
        onClose={() => setIsAdminNoticeModalOpen(false)}
        adminNotice={adminNotice}
        onSaveAdminNotice={handleSaveAdminNotice}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={selectedProfile}
        userPosts={selectedProfile ? posts.filter((p) => p.userId === selectedProfile.userId) : []}
        isOwnProfile={currentUser?.id === selectedProfile?.userId}
        onOpenEditProfile={() => setIsProfileEditModalOpen(true)}
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
