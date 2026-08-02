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
  updatedAt: string;
}

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Maximum board capacity: 20 posts
const MAX_BOARD_LIMIT = 20;
// Maximum posts per user: 2 posts
const MAX_USER_LIMIT = 2;

// Initialize Firebase Firestore
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("[Firebase] Firestore connected successfully.");
  }
} catch (e) {
  console.error("[Firebase] Firestore initialization failed, fallback to memory:", e);
}

// In-Memory fallback storage
let profiles: Record<string, MemberProfile> = {};
let adminNotice: AdminNotice = {
  content: "【ゆっくり駅伝言板 管理人の一言】伝言板は皆様の温かい伝言で成り立っています。用件が済みましたら各自消去にご協力ください。本日もごゆっくりどうぞ。",
  updatedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  updatedBy: "ゆっくり駅伝言板 管理人",
};
let posts: Post[] = [];

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
      if (p.userId) fetchedProfiles[p.userId] = p;
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

// 2. Create New Post
app.post("/api/posts", async (req, res) => {
  const { userId, userEmail, userAvatar, postName, content, chalkColor } = req.body;

  if (!userId || !content || typeof content !== "string" || !content.trim()) {
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

  const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newPost: Post = {
    id: postId,
    userId,
    userEmail: userEmail || userId,
    userAvatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    postName: postName?.trim() || "名無し駅員",
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
  const currentProfiles = await loadProfiles();
  let updatedProfile: MemberProfile;
  if (!currentProfiles[userId]) {
    updatedProfile = {
      userId,
      userEmail: userEmail || userId,
      userAvatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      postName: postName?.trim() || "名無し",
      googleName: "",
      substackUrl: "",
      bio: "",
      strengths: "",
      weaknesses: "",
      updatedAt: new Date().toLocaleDateString("ja-JP"),
    };
  } else {
    updatedProfile = {
      ...currentProfiles[userId],
      postName: postName?.trim() || currentProfiles[userId].postName || "名無し",
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

// 3. Delete Post
app.delete("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { userId, isAdmin } = req.body || {};

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

// 4. Update Manager/Admin Corner
app.put("/api/admin-notice", async (req, res) => {
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

// 7. Create/Update Member Profile (自己紹介登録・更新)
app.put("/api/profiles/:userId", async (req, res) => {
  const { userId } = req.params;
  const { userEmail, userAvatar, postName, googleName, substackUrl, bio, strengths, weaknesses } = req.body;

  if (!userId) {
    res.status(400).json({ error: "ユーザーIDが必要です。" });
    return;
  }

  const currentProfiles = await loadProfiles();
  const existing: Partial<MemberProfile> = currentProfiles[userId] || {};

  const updatedProfile: MemberProfile = {
    userId,
    userEmail: userEmail || existing.userEmail || userId,
    userAvatar: userAvatar || existing.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    postName: postName?.trim() || existing.postName || "名無し",
    googleName: googleName || existing.googleName || "",
    substackUrl: substackUrl?.trim() || existing.substackUrl || "",
    bio: bio?.trim() || "",
    strengths: strengths?.trim() || "",
    weaknesses: weaknesses?.trim() || "",
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

