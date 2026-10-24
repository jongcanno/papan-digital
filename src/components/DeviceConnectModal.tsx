import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Smartphone,
  Monitor,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  Wifi,
  WifiOff,
  Users,
} from 'lucide-react';
import { ConnectionStatusInfo } from '../utils/syncManager';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionInfo: ConnectionStatusInfo;
  onJoinRoom: (roomId: string) => void;
  onCreateNewRoom: () => void;
}

export const DeviceConnectModal: React.FC<DeviceConnectModalProps> = ({
  isOpen,
  onClose,
  connectionInfo,
  onJoinRoom,
  onCreateNewRoom,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Build public-friendly remote URL (converts ais-dev- to ais-pre- so phones can open without dev auth)
  const getRemoteShareUrl = (roomId: string): string => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin.replace('//ais-dev-', '//ais-pre-');
    return `${origin}/?room=${encodeURIComponent(roomId)}&mode=remote`;
  };

  const remoteUrl = getRemoteShareUrl(connectionInfo.roomId);

  useEffect(() => {
    if (!isOpen || !remoteUrl) return;
    QRCode.toDataURL(remoteUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#080b11',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [isOpen, remoteUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(connectionInfo.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputRoomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!cleaned) return;
    onJoinRoom(cleaned);
    setInputRoomCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black font-outfit text-white tracking-wide uppercase">
                HUBUNGKAN PERANGKAT LAIN (REMOTE HP / TV)
              </h2>
              <span className="text-xs text-slate-400">
                Sinkronisasi Realtime Tanpa Login · Gawang Mini Jong Cano
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Modal Koneksi"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            {connectionInfo.status === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-400 uppercase tracking-wider">
                  TERHUBUNG KE SERVER REALTIME
                </span>
              </>
            ) : connectionInfo.status === 'connecting' ? (
              <>
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="font-bold text-amber-400 uppercase tracking-wider">
                  MENGHUBUNGKAN KE SERVER...
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-rose-400 uppercase tracking-wider">
                  MODE LOKAL (MENCOBA KONEKSI ULANG...)
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>{connectionInfo.connectedDevices} Perangkat Terhubung di Room Ini</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: QR Code Box */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code Room ${connectionInfo.roomId}`}
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-900 text-xs font-bold">
                    Memuat QR Code...
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-400 font-outfit uppercase">
                  <Smartphone className="w-4 h-4" />
                  <span>Scan dari Kamera HP</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Arahkan kamera HP/Tablet ke QR Code di atas untuk langsung membuka{' '}
                  <strong className="text-slate-200">Remote Operator</strong>.
                </p>
              </div>
            </div>

            {/* Right: 6-Character Room Code & Direct Link */}
            <div className="md:col-span-7 space-y-5">
              {/* Active Room Code Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    KODE ROOM AKTIF (6 KARAKTER)
                  </span>
                  <button
                    onClick={onCreateNewRoom}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                    title="Buat Kode Room Acak Baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Buat Room Baru
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-center">
                    <span className="text-4xl sm:text-5xl font-black font-digital tracking-[0.25em] text-cyan-400 neon-glow-cyan">
                      {connectionInfo.roomId}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-outfit flex flex-col items-center gap-1 border border-slate-700 transition shrink-0"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-cyan-400" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Copy Full Remote Link */}
                <div className="pt-2">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-outfit uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        Link Remote Berhasil Disalin! Kirim ke HP Anda
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin Link Remote untuk Dibuka di HP / Perangkat Lain
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Join Existing Room Input */}
              <form
                onSubmit={handleJoinSubmit}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5"
              >
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  MASUKKAN KODE ROOM DARI PERANGKAT LAIN:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: JONG26"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-digital text-base font-bold uppercase tracking-widest focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputRoomCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold font-outfit uppercase flex items-center gap-1.5 transition shrink-0"
                  >
                    <LogIn className="w-4 h-4" />
                    Hubungkan
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ketik kode 6 karakter yang tertera di layar TV/Laptop utama, lalu klik{' '}
                  <strong className="text-slate-300">Hubungkan</strong>.
                </p>
              </form>
            </div>
          </div>

          {/* Step-by-step Quick Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
              <Monitor className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">1. Layar Utama (Laptop / Smart TV)</span>
                <span className="text-slate-400 text-[11px]">
                  Biarkan perangkat ini dalam mode <strong>Layar Display</strong> (Fullscreen) untuk dilihat penonton & pemain.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
              <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">2. Remote Kontrol (HP / Tablet)</span>
                <span className="text-slate-400 text-[11px]">
                  Scan QR Code atau buka link di HP dengan kode room <strong>{connectionInfo.roomId}</strong> untuk mengontrol skor & waktu dari pinggir lapangan.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
