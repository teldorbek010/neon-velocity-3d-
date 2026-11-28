/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { InstaAccount, InstaPost } from '../types/game';
import {
  Camera,
  Heart,
  MessageCircle,
  Send,
  LogOut,
  PlusSquare,
  ExternalLink,
  Image as ImageIcon,
  UserCheck,
  Link2,
} from 'lucide-react';

interface PhoneInstagramAppProps {
  driverName: string;
  onCaptureGamePhoto?: () => string;
  onLoginSuccess?: (username: string) => void;
}

const STORAGE_ACCOUNT_KEY = 'uz_racer_insta_account_v1';

function extractInstagramEmbedUrl(url: string): string | null {
  const m = url.trim().match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  return `https://www.instagram.com/p/${m[1]}/embed`;
}

export const PhoneInstagramApp: React.FC<PhoneInstagramAppProps> = ({
  driverName,
  onCaptureGamePhoto,
  onLoginSuccess,
}) => {
  const [account, setAccount] = useState<InstaAccount | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNT_KEY);
      if (raw) return JSON.parse(raw) as InstaAccount;
    } catch {
      // ignore
    }
    return null;
  });

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginDisplay, setLoginDisplay] = useState(driverName || '');
  const [loginBio, setLoginBio] = useState('🇺🇿 Toshkent | Damas & Matiz Racer');
  const [loginAvatar, setLoginAvatar] = useState('🚗');

  // Feed & Composer State
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState('');
  const [caption, setCaption] = useState('');
  const [realPostLink, setRealPostLink] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [embedModalUrl, setEmbedModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/insta/posts');
      if (res.ok) {
        const data = (await res.json()) as { posts: InstaPost[] };
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch {
      // ignore offline
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchPosts();
    }
  }, [account]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim().replace(/^@+/, '').toLowerCase();
    if (!cleanUser) return;
    const nextAccount: InstaAccount = {
      username: cleanUser,
      displayName: loginDisplay.trim() || `@${cleanUser}`,
      bio: loginBio.trim() || '🇺🇿 Toshkent Street Racer',
      avatarEmoji: loginAvatar || '🚗',
      realProfileLinked: true,
    };
    setAccount(nextAccount);
    try {
      localStorage.setItem(STORAGE_ACCOUNT_KEY, JSON.stringify(nextAccount));
    } catch {
      // ignore
    }
    onLoginSuccess?.(cleanUser);
  };

  const handleLogout = () => {
    setAccount(null);
    try {
      localStorage.removeItem(STORAGE_ACCOUNT_KEY);
    } catch {
      // ignore
    }
  };

  const handleCaptureInGame = () => {
    if (!onCaptureGamePhoto) return;
    const shot = onCaptureGamePhoto();
    if (shot) {
      setPreviewImg(shot);
      setComposerOpen(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewImg(reader.result);
        setComposerOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishPost = async () => {
    if (!account) return;
    const cleanLink = realPostLink.trim();
    if (!previewImg && !caption.trim() && !cleanLink) return;

    const payload = {
      username: account.username,
      displayName: account.displayName,
      avatarEmoji: account.avatarEmoji,
      imageDataUrl: previewImg,
      caption: caption.trim() || 'Toshkent ko‘chalarida sayohat 🌅',
      location: 'Toshkent • Chorsu',
      realInstaUrl: cleanLink || undefined,
    };

    try {
      const res = await fetch('/api/insta/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { post: InstaPost };
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch {
      // fallback local add
      setPosts((prev) => [
        {
          ...payload,
          id: `local_${Date.now()}`,
          likes: 1,
          comments: [],
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    }
    setPreviewImg('');
    setCaption('');
    setRealPostLink('');
    setComposerOpen(false);
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likedByMe ? p.likes : p.likes + 1, likedByMe: true }
          : p
      )
    );
    try {
      await fetch(`/api/insta/posts/${postId}/like`, { method: 'POST' });
    } catch {
      // ignore
    }
  };

  const handleComment = async (postId: string) => {
    if (!account) return;
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    try {
      const res = await fetch(`/api/insta/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: account.username, text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { post: InstaPost };
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      }
    } catch {
      // ignore
    }
  };

  // --- ACCOUNT LOGIN SCREEN ---
  if (!account) {
    return (
      <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-fuchsia-600/30 via-rose-600/20 to-amber-500/25 border border-pink-500/50 text-center">
          <div className="text-lg font-black text-white tracking-tight">Instagram</div>
          <p className="text-[11px] text-pink-200 mt-1">
            O‘zingizning Instagram akkauntingiz (@username) bilan kiring, haqiqiy post/Reels qo‘ying va do‘stlar bilan bo‘lishing!
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">
            Haqiqiy Instagram Username (@sizning_akkaunt)
          </label>
          <input
            type="text"
            required
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            placeholder="masalan: sardor_uzb"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white outline-none focus:border-pink-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">
            Ismingiz
          </label>
          <input
            type="text"
            value={loginDisplay}
            onChange={(e) => setLoginDisplay(e.target.value)}
            placeholder="Ismingiz..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white outline-none focus:border-pink-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase">
            Profil Belgisi
          </label>
          <div className="flex gap-1.5">
            {['🚗', '🚐', '🦁', '🔥', '🇺🇿', '😎'].map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setLoginAvatar(em)}
                className={`flex-1 h-9 rounded-xl border text-base cursor-pointer ${
                  loginAvatar === em
                    ? 'bg-pink-500/30 border-pink-400'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <UserCheck className="w-4 h-4" />
          AKKAUNTGA KIRISH
        </button>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
          Eslatma: Instagram xavfsizlik siyosati sababli boshqa sayt ichida to‘liq parolli sessiyani bloklaydi, ammo siz haqiqiy @username profilingizni ulashingiz, real Instagram post/Reels linklarini shu yerda ko‘rishingiz va jonli o‘yin rasmlarini joylashingiz mumkin.
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Logged-In Account Profile Bar */}
      <div className="p-2.5 rounded-2xl bg-slate-900 border border-pink-500/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-base">
              {account.avatarEmoji}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate">@{account.username}</div>
            <div className="text-[10px] text-pink-300 truncate">{account.displayName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`https://www.instagram.com/${encodeURIComponent(account.username)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1.5 rounded-xl bg-pink-500/20 border border-pink-400/50 text-pink-200 text-[10px] font-black flex items-center gap-1"
            title="Haqiqiy Instagram profilini ochish"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Haqiqiy IG</span>
          </a>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-400 cursor-pointer"
            title="Akkauntdan chiqish"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Create Bar: Live 3D Photo / Device Upload / Real IG Post Link */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={handleCaptureInGame}
          className="p-2 rounded-xl bg-gradient-to-r from-rose-500/25 to-amber-500/25 border border-rose-400/50 text-white text-[10px] font-black flex flex-col items-center gap-1 cursor-pointer active:scale-95"
        >
          <Camera className="w-4 h-4 text-rose-300" />
          <span>O‘yindan Rasm</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-black flex flex-col items-center gap-1 cursor-pointer active:scale-95"
        >
          <ImageIcon className="w-4 h-4 text-cyan-300" />
          <span>Galereyadan</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => setComposerOpen((o) => !o)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-black flex flex-col items-center gap-1 cursor-pointer active:scale-95"
        >
          <PlusSquare className="w-4 h-4 text-fuchsia-300" />
          <span>IG Link / Post</span>
        </button>
      </div>

      {/* Post Composer */}
      {composerOpen && (
        <div className="p-2.5 rounded-2xl bg-slate-900 border border-fuchsia-500/50 flex flex-col gap-2">
          {previewImg && (
            <img
              src={previewImg}
              alt="Post preview"
              className="w-full h-36 object-cover rounded-xl border border-slate-700"
            />
          )}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Post izohi (masalan: Chorsuda Damas!)"
            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-pink-400"
          />
          <div className="flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-pink-400 shrink-0" />
            <input
              type="text"
              value={realPostLink}
              onChange={(e) => setRealPostLink(e.target.value)}
              placeholder="Haqiqiy IG post/reel URL (ixtiyoriy)"
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-white outline-none focus:border-pink-400"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handlePublishPost}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white text-xs font-black cursor-pointer"
            >
              JOYLASH
            </button>
            <button
              onClick={() => setComposerOpen(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Bekor
            </button>
          </div>
        </div>
      )}

      {/* Real Instagram Post / Reel Embed Viewer */}
      {embedModalUrl && (
        <div className="p-2 rounded-2xl bg-white border border-pink-400 flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-900">Haqiqiy Instagram Post</span>
            <button
              onClick={() => setEmbedModalUrl(null)}
              className="text-[11px] font-black text-rose-600 cursor-pointer"
            >
              Yopish ✕
            </button>
          </div>
          <iframe
            src={embedModalUrl}
            title="Instagram Post Embed"
            className="w-full h-72 rounded-xl border-0"
            allowFullScreen
          />
        </div>
      )}

      {/* Feed Stream */}
      <div className="flex flex-col gap-2.5">
        {loadingPosts && posts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : posts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-center flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-300">
              Hali postlar yo‘q — birinchi bo‘lib rasm joylang!
            </div>
            <button
              onClick={handleCaptureInGame}
              className="mx-auto px-3 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-black cursor-pointer"
            >
              📸 Hozirgi manzarani joylash
            </button>
          </div>
        ) : (
          posts.map((post) => {
            const embedUrl = post.realInstaUrl ? extractInstagramEmbedUrl(post.realInstaUrl) : null;
            return (
              <div
                key={post.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col"
              >
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{post.avatarEmoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">@{post.username}</div>
                      <div className="text-[9px] text-slate-400 truncate">{post.location}</div>
                    </div>
                  </div>
                  {embedUrl && (
                    <button
                      onClick={() => setEmbedModalUrl(embedUrl)}
                      className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-[10px] font-black cursor-pointer"
                    >
                      IG Ochish
                    </button>
                  )}
                </div>

                {post.imageDataUrl && (
                  <img
                    src={post.imageDataUrl}
                    alt={post.caption}
                    className="w-full max-h-48 object-cover bg-slate-950"
                  />
                )}

                {embedUrl && !post.imageDataUrl && (
                  <iframe
                    src={embedUrl}
                    title={`IG ${post.id}`}
                    className="w-full h-64 bg-white border-0"
                  />
                )}

                <div className="p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 text-xs font-black cursor-pointer ${
                        post.likedByMe ? 'text-rose-400' : 'text-slate-300 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-rose-500' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 leading-snug">
                    <span className="font-black text-white mr-1.5">@{post.username}</span>
                    {post.caption}
                  </div>

                  {post.comments.slice(-2).map((c) => (
                    <div key={c.id} className="text-[11px] text-slate-300 pl-2 border-l border-slate-700">
                      <span className="font-black text-pink-300 mr-1">@{c.username}</span>
                      {c.text}
                    </div>
                  ))}

                  <div className="flex gap-1 pt-1">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="Izoh yozing..."
                      className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white outline-none focus:border-pink-400"
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="px-2.5 rounded-lg bg-pink-500 text-white flex items-center justify-center cursor-pointer"
                      aria-label="Yuborish"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
