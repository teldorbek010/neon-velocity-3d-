/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { YouTubeTrack } from '../types/game';
import { Search, Play, Square, Link2, Music2, Volume2, Loader2 } from 'lucide-react';

interface PhoneYouTubeAppProps {
  activeTrack: YouTubeTrack | null;
  onSelectTrack: (track: YouTubeTrack | null) => void;
  subwooferLevel: 0 | 1 | 2;
  onSetSubwoofer: (level: 0 | 1 | 2) => void;
}

const UZBEK_QUICK_SEARCHES = [
  'Konsta Uzbek rap',
  'Jaloliddin Ahmadaliyev',
  'Munisa Rizayeva',
  'Shoxrux rap',
  'Benom guruhi',
  'Yalla Uzbek hit',
  'Uzbek Phonk bass',
];

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/i
  );
  return m ? m[1] : null;
}

export const PhoneYouTubeApp: React.FC<PhoneYouTubeAppProps> = ({
  activeTrack,
  onSelectTrack,
  subwooferLevel,
  onSetSubwoofer,
}) => {
  const [query, setQuery] = useState('Konsta Uzbek rap');
  const [results, setResults] = useState<YouTubeTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [directUrl, setDirectUrl] = useState('');

  const runSearch = async (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setLoading(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(clean)}`);
      const data = (await res.json()) as { ok?: boolean; tracks?: YouTubeTrack[] };
      if (data.tracks && data.tracks.length > 0) {
        setResults(data.tracks);
      } else {
        setResults([]);
        setSearchError('Natija topilmadi — boshqa qo‘shiqchi nomini yozing yoki YouTube linkini kiriting.');
      }
    } catch {
      setSearchError('Qidiruv xatosi — internet ulanishini tekshiring yoki link kiriting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch('Konsta Uzbek rap');
  }, []);

  const handlePlayUrl = () => {
    const vid = extractYouTubeId(directUrl);
    if (!vid) {
      setSearchError('To‘g‘ri YouTube video linkini kiriting (masalan: https://youtu.be/...)');
      return;
    }
    setSearchError('');
    onSelectTrack({
      videoId: vid,
      title: `YouTube Video (${vid})`,
      channel: 'To‘g‘ridan-to‘g‘ri havola',
      thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    });
    setDirectUrl('');
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Live Video Player Screen */}
      {activeTrack ? (
        <div className="rounded-2xl overflow-hidden bg-slate-950 border border-rose-500/60 shadow-lg flex flex-col">
          <div className="relative w-full aspect-video bg-black">
            <iframe
              key={activeTrack.videoId}
              src={`https://www.youtube.com/embed/${activeTrack.videoId}?autoplay=1&rel=0`}
              title={activeTrack.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-2.5 flex items-center justify-between gap-2 bg-slate-900">
            <div className="min-w-0">
              <div className="text-[11px] font-black text-white truncate">{activeTrack.title}</div>
              <div className="text-[10px] text-rose-300 truncate">▶ {activeTrack.channel} • Fon rejimida ham ishlaydi</div>
            </div>
            <button
              onClick={() => onSelectTrack(null)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>To‘xtatish</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-950/90 to-slate-900 border border-rose-500/50 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-xs font-black text-white">YouTube Haqiqiy Musiqa</div>
            <div className="text-[10px] text-rose-200">
              O‘zbek xitlarini qidiring yoki link tashlang — mashina haydashda ham chalinadi!
            </div>
          </div>
        </div>
      )}

      {/* Search YouTube Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="flex gap-1.5"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Qo‘shiqchi yoki trek nomi..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white outline-none focus:border-rose-400"
        />
        <button
          type="submit"
          className="px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center cursor-pointer"
          aria-label="Qidirish"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </form>

      {/* Quick Uzbek Artist Chips */}
      <div className="flex flex-wrap gap-1">
        {UZBEK_QUICK_SEARCHES.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              runSearch(chip);
            }}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-500/60 text-[10px] font-bold text-slate-200 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Direct YouTube URL Input */}
      <div className="flex gap-1.5 items-center">
        <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={directUrl}
          onChange={(e) => setDirectUrl(e.target.value)}
          placeholder="YouTube link (https://youtu.be/...)"
          className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-white outline-none focus:border-rose-400"
        />
        <button
          onClick={handlePlayUrl}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-white text-[10px] font-black cursor-pointer"
        >
          Ochish
        </button>
      </div>

      {/* Subwoofer Bass Boost Sync */}
      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-1">
        <span className="text-[10px] font-black text-fuchsia-300 flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5" /> SOMBUFER
        </span>
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => onSetSubwoofer(lv)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer ${
                subwooferLevel === lv ? 'bg-fuchsia-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {lv === 0 ? 'OFF' : lv === 1 ? 'ON' : 'MAX'}
            </button>
          ))}
        </div>
      </div>

      {searchError && (
        <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-500/40 text-[10px] text-amber-200">
          {searchError}
        </div>
      )}

      {/* Search Results */}
      <div className="flex flex-col gap-1.5">
        {results.map((item) => {
          const isPlaying = activeTrack?.videoId === item.videoId;
          return (
            <button
              key={item.videoId}
              onClick={() => onSelectTrack(item)}
              className={`w-full p-2 rounded-2xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                isPlaying
                  ? 'bg-rose-950/80 border-rose-400'
                  : 'bg-slate-900 border-slate-800 hover:border-rose-500/50'
              }`}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-10 rounded-lg object-cover bg-slate-950 shrink-0"
                />
              ) : (
                <div className="w-16 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <Music2 className="w-4 h-4 text-rose-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-white line-clamp-2 leading-tight">
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.channel}</div>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-[9px] font-black shrink-0 ${
                  isPlaying ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                {isPlaying ? 'IJRODA' : '▶'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
