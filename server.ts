import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { DEFAULT_GENRES, MAX_GENRES_PER_USER, normalizeGenres } from "./src/lib/genres.ts";

interface Post {
  id: string;
  userId: string;
  userEmail: string;
  userAvatar: string;
  postName: string;
  content: string;
  chalkColor: 'white' | 'yellow' | 'pink' | 'cyan';
  createdAt: string;
  timestamp: number;
}

interface AdminNotice {
  content: string;
  updatedAt: string;
  updatedBy: string;
}

interface MemberProfile {
  userId: string;
  userEmail: string;
  userAvatar: string;
  postName: string;
  googleName?: string;
  substackUrl: string;
  bio: string;
  strengths: string;
  weaknesses: string;
  genres: string[];
  updatedAt: string;
}

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Maximum board capacity: 20 posts
const MAX_BOARD_LIMIT = 20;
// Maximum posts per user: 2 posts
const MAX_USER_LIMIT = 2;

interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

let firebaseApiKey = "";

// Initialize Firebase Firestore
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    firebaseApiKey = firebaseConfig.apiKey || "";
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("[Firebase] Firestore connected successfully.");
  }
} catch (e) {
  console.error("[Firebase] Firestore initialization failed, fallback to memory:", e);
}

/** Firebase ID トークンを検証してユーザー情報を返す */
async function verifyIdToken(idToken: string): Promise<AuthUser | null> {
  if (!firebaseApiKey || !idToken) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{
        localId: string;
        email?: string;
        displayName?: string;
        photoUrl?: string;
      }>;
    };
    const user = data.users?.[0];
    if (!user?.localId) return null;
    return {
      uid: user.localId,
      email: user.email,
      name: user.displayName,
      picture: user.photoUrl,
    };
  } catch (e) {
    console.error("[Auth] Token verification failed:", e);
    return null;
  }
}

/** 書き込み系 API 用の認証ミドルウェア */
async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Googleログインが必要です。" });
    return;
  }
  const token = header.slice(7);
  const authUser = await verifyIdToken(token);
  if (!authUser) {
    res.status(401).json({ error: "認証に失敗しました。再度ログインしてください。" });
    return;
  }
  (req as express.Request & { authUser: AuthUser }).authUser = authUser;
  next();
}

// In-Memory fallback storage
let profiles: Record<string, MemberProfile> = {};
let adminNotice: AdminNotice = {
  content: "【ゆっくり駅伝言板 管理人の一言】伝言板は皆様の温かい伝言で成り立っています。用件が済みましたら各自消去にご協力ください。本日もごゆっくりどうぞ。",
  updatedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  updatedBy: "ゆっくり駅伝言板 管理人",
};
let posts: Post[] = [];
let genreTags: string[] = [...DEFAULT_GENRES];

// Firestore Helper Functions
async function loadPosts(): Promise<Post[]> {
  if (!db) return posts;
  try {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(MAX_BOARD_LIMIT));
    const snap = await getDocs(q);
    const fetchedPosts: Post[] = [];
    snap.forEach((d) => {
      fetchedPosts.push(d.data() as Post);
    });
    posts = fetchedPosts;
    return fetchedPosts;
  } catch (e) {
    console.error("Failed to load posts from Firestore:", e);
    return posts;
  }
}

async function loadProfiles(): Promise<Record<string, MemberProfile>> {
  if (!db) return profiles;
  try {
    const snap = await getDocs(collection(db, "profiles"));
    const fetchedProfiles: Record<string, MemberProfile> = {};
    snap.forEach((d) => {
      const p = d.data() as MemberProfile;
      if (p.userId) {
        fetchedProfiles[p.userId] = {
          ...p,
          genres: Array.isArray(p.genres) ? p.genres : [],
        };
      }
    });
    profiles = fetchedProfiles;
    return fetchedProfiles;
  } catch (e) {
    console.error("Failed to load profiles from Firestore:", e);
    return profiles;
  }
}

async function loadAdminNotice(): Promise<AdminNotice> {
  if (!db) return adminNotice;
  try {
    const snap = await getDoc(doc(db, "notices", "station_notice"));
    if (snap.exists()) {
      adminNotice = snap.data() as AdminNotice;
    }
    return adminNotice;
  } catch (e) {
    console.error("Failed to load admin notice from Firestore:", e);
    return adminNotice;
  }
}

async function loadGenreTags(): Promise<string[]> {
  if (!db) return genreTags;
  try {
    const snap = await getDoc(doc(db, "settings", "genres"));
    if (snap.exists()) {
      const tags = (snap.data() as { tags?: unknown }).tags;
      if (Array.isArray(tags) && tags.length > 0) {
        genreTags = tags.map((t) => String(t).trim()).filter(Boolean);
        return genreTags;
      }
    }
    await setDoc(doc(db, "settings", "genres"), { tags: [...DEFAULT_GENRES] });
    genreTags = [...DEFAULT_GENRES];
    return genreTags;
  } catch (e) {
    console.error("Failed to load genre tags from Firestore:", e);
    return genreTags;
  }
}

// Format current time into classic station board format (HH:MM 筆)
function formatStationTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} 筆`;
}

// === API ROUTES === //

// 1. Get Board Data (Posts + Admin Notice)
app.get("/api/board", async (req, res) => {
  const currentPosts = await loadPosts();
  const currentNotice = await loadAdminNotice();
  res.json({
    posts: currentPosts.slice(0, MAX_BOARD_LIMIT),
    adminNotice: currentNotice,
    maxBoardLimit: MAX_BOARD_LIMIT,
    maxUserLimit: MAX_USER_LIMIT,
  });
});

// 2. Create New Post (要 Google ログイン)
app.post("/api/posts", requireAuth, async (req, res) => {
  const authUser = (req as express.Request & { authUser: AuthUser }).authUser;
  const { postName, content, chalkColor } = req.body;
  const userId = authUser.uid;
  const userEmail = authUser.email || userId;
  const userAvatar =
    authUser.picture ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "伝言内容を入力してください。" });
    return;
  }

  const cleanContent = content.trim();
  if (cleanContent.length > 100) {
    res.status(400).json({ error: "伝言は100文字以内で入力してください。" });
    return;
  }

  const currentPosts = await loadPosts();

  // Count active posts for this user
  const userActivePostCount = currentPosts.filter((p) => p.userId === userId).length;
  if (userActivePostCount >= MAX_USER_LIMIT) {
    res.status(400).json({
      error: `一人で一度に掲示できる伝言は最大${MAX_USER_LIMIT}件までです。不要になった伝言を削除してください。`,
    });
    return;
  }

  const currentProfiles = await loadProfiles();
  const existingProfile = currentProfiles[userId];
  const resolvedPostName =
    (typeof postName === "string" && postName.trim()) ||
    existingProfile?.postName?.trim() ||
    authUser.name?.trim() ||
    "名無し駅員";

  const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newPost: Post = {
    id: postId,
    userId,
    userEmail,
    userAvatar,
    postName: resolvedPostName,
    content: cleanContent,
    chalkColor: chalkColor || "white",
    createdAt: formatStationTime(),
    timestamp: Date.now(),
  };

  // Save to Firestore
  if (db) {
    try {
      await setDoc(doc(db, "posts", postId), newPost);
    } catch (e) {
      console.error("Failed to save post to Firestore:", e);
    }
  }

  // Update memory
  posts.unshift(newPost);
  if (posts.length > MAX_BOARD_LIMIT) {
    posts = posts.slice(0, MAX_BOARD_LIMIT);
  }

  // Ensure member profile exists or updates postName for this user
  let updatedProfile: MemberProfile;
  if (!existingProfile) {
    updatedProfile = {
      userId,
      userEmail,
      userAvatar,
      postName: resolvedPostName,
      googleName: authUser.name || "",
      substackUrl: "",
      bio: "",
      strengths: "",
      weaknesses: "",
      genres: [],
      updatedAt: new Date().toLocaleDateString("ja-JP"),
    };
  } else {
    updatedProfile = {
      ...existingProfile,
      postName: existingProfile.postName?.trim() || resolvedPostName,
      userAvatar: userAvatar || existingProfile.userAvatar,
      googleName: authUser.name || existingProfile.googleName || "",
      genres: Array.isArray(existingProfile.genres) ? existingProfile.genres : [],
    };
  }
  profiles[userId] = updatedProfile;

  if (db) {
    try {
      await setDoc(doc(db, "profiles", userId), updatedProfile);
    } catch (e) {
      console.error("Failed to save profile to Firestore:", e);
    }
  }

  const updatedPosts = await loadPosts();

  res.json({
    success: true,
    post: newPost,
    posts: updatedPosts,
    userPostCount: updatedPosts.filter((p) => p.userId === userId).length,
  });
});

// 3. Delete Post (要 Google ログイン)
app.delete("/api/posts/:id", requireAuth, async (req, res) => {
  const authUser = (req as express.Request & { authUser: AuthUser }).authUser;
  const { id } = req.params;
  const { isAdmin } = req.body || {};
  const userId = authUser.uid;

  const currentPosts = await loadPosts();
  const targetPost = currentPosts.find((p) => p.id === id);
  if (!targetPost) {
    res.status(404).json({ error: "該当の伝言が見つかりません。" });
    return;
  }

  // Check permission: post owner or admin
  if (targetPost.userId !== userId && !isAdmin) {
    res.status(403).json({ error: "自分の伝言のみ削除（黒板拭き）できます。" });
    return;
  }

  if (db) {
    try {
      await deleteDoc(doc(db, "posts", id));
    } catch (e) {
      console.error("Failed to delete post from Firestore:", e);
    }
  }

  posts = posts.filter((p) => p.id !== id);
  const updatedPosts = await loadPosts();

  res.json({
    success: true,
    posts: updatedPosts,
  });
});

// 4. Update Manager/Admin Corner (要 Google ログイン)
app.put("/api/admin-notice", requireAuth, async (req, res) => {
  const { content, updatedBy } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "管理人の一言を入力してください。" });
    return;
  }

  const newNotice: AdminNotice = {
    content: content.trim(),
    updatedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
    updatedBy: updatedBy?.trim() || "駅長（管理人）",
  };

  adminNotice = newNotice;

  if (db) {
    try {
      await setDoc(doc(db, "notices", "station_notice"), newNotice);
    } catch (e) {
      console.error("Failed to save notice to Firestore:", e);
    }
  }

  res.json({
    success: true,
    adminNotice: newNotice,
  });
});

// 5. Get All Member Profiles (自己紹介ボード用)
app.get("/api/profiles", async (req, res) => {
  const currentProfiles = await loadProfiles();
  const profileList = Object.values(currentProfiles);
  res.json({ profiles: profileList });
});

// 6. Get Single Member Profile
app.get("/api/profiles/:userId", async (req, res) => {
  const { userId } = req.params;
  const currentProfiles = await loadProfiles();
  const profile = currentProfiles[userId];
  if (!profile) {
    res.status(404).json({ error: "プロフィールが見つかりません。" });
    return;
  }
  res.json({ profile });
});

// 7. Create/Update Member Profile (要 Google ログイン)
app.put("/api/profiles/:userId", requireAuth, async (req, res) => {
  const authUser = (req as express.Request & { authUser: AuthUser }).authUser;
  const { userId } = req.params;
  const { userAvatar, postName, googleName, substackUrl, bio, strengths, weaknesses, genres } = req.body;

  if (!userId) {
    res.status(400).json({ error: "ユーザーIDが必要です。" });
    return;
  }

  if (userId !== authUser.uid) {
    res.status(403).json({ error: "自分のプロフィールのみ編集できます。" });
    return;
  }

  const currentTags = await loadGenreTags();
  const sanitizedGenres = normalizeGenres(genres, currentTags);
  if (Array.isArray(genres) && genres.length > MAX_GENRES_PER_USER) {
    res.status(400).json({ error: `ジャンルは最大${MAX_GENRES_PER_USER}つまで選択できます。` });
    return;
  }

  const currentProfiles = await loadProfiles();
  const existing: Partial<MemberProfile> = currentProfiles[userId] || {};

  const updatedProfile: MemberProfile = {
    userId,
    userEmail: authUser.email || existing.userEmail || userId,
    userAvatar: userAvatar || authUser.picture || existing.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    postName: postName?.trim() || existing.postName || authUser.name || "名無し",
    googleName: googleName || authUser.name || existing.googleName || "",
    substackUrl: substackUrl?.trim() || existing.substackUrl || "",
    bio: typeof bio === "string" ? bio.trim() : existing.bio || "",
    strengths: typeof strengths === "string" ? strengths.trim() : existing.strengths || "",
    weaknesses: typeof weaknesses === "string" ? weaknesses.trim() : existing.weaknesses || "",
    genres: sanitizedGenres,
    updatedAt: new Date().toLocaleDateString("ja-JP"),
  };

  profiles[userId] = updatedProfile;

  if (db) {
    try {
      await setDoc(doc(db, "profiles", userId), updatedProfile);
    } catch (e) {
      console.error("Failed to update profile in Firestore:", e);
    }
  }

  res.json({
    success: true,
    profile: updatedProfile,
  });
});

// 8. Get genre tags
app.get("/api/genres", async (_req, res) => {
  const tags = await loadGenreTags();
  res.json({ tags, maxPerUser: MAX_GENRES_PER_USER });
});

// 9. Add genre tag (要 Google ログイン + 駅長モード)
app.post("/api/genres", requireAuth, async (req, res) => {
  const { tag, isAdmin } = req.body || {};
  if (!isAdmin) {
    res.status(403).json({ error: "ジャンルタグの追加は駅長（管理人）のみ行えます。" });
    return;
  }

  const cleanTag = typeof tag === "string" ? tag.trim() : "";
  if (!cleanTag) {
    res.status(400).json({ error: "ジャンル名を入力してください。" });
    return;
  }
  if (cleanTag.length > 20) {
    res.status(400).json({ error: "ジャンル名は20文字以内で入力してください。" });
    return;
  }

  const currentTags = await loadGenreTags();
  if (currentTags.includes(cleanTag)) {
    res.status(400).json({ error: "同じジャンルはすでに登録されています。" });
    return;
  }

  const nextTags = [...currentTags, cleanTag];
  genreTags = nextTags;
  if (db) {
    try {
      await setDoc(doc(db, "settings", "genres"), { tags: nextTags });
    } catch (e) {
      console.error("Failed to save genre tags to Firestore:", e);
      res.status(500).json({ error: "ジャンルの保存に失敗しました。" });
      return;
    }
  }

  res.json({ success: true, tags: nextTags });
});

// === VITE MIDDLEWARE SETUP === //
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Station Board Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

