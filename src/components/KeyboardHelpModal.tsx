import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Spasi', desc: 'Start / Pause Timer Pertandingan', category: 'Waktu' },
    { key: '↑ / ↓', desc: 'Tambah / Kurang Waktu (Menit)', category: 'Waktu' },
    { key: '→ / ←', desc: 'Tambah / Kurang Waktu (Detik)', category: 'Waktu' },
    { key: 'Q / A', desc: 'Tambah / Kurang Skor Tim Home (+1 / -1)', category: 'Skor' },
    { key: 'P / L', desc: 'Tambah / Kurang Skor Tim Away (+1 / -1)', category: 'Skor' },
    { key: 'K / J', desc: 'Maju / Mundur Babak (Period 1, 2, ET, Penalti)', category: 'Babak' },
    { key: 'T / G', desc: 'Catat Tendangan Penalti Tim Home (Gol / Gagal)', category: 'Penalti' },
    { key: 'Y / H', desc: 'Catat Tendangan Penalti Tim Away (Gol / Gagal)', category: 'Penalti' },
    { key: 'Z / X', desc: 'Kartu Kuning Cepat (Home: Z / Away: X)', category: 'Disiplin' },
    { key: 'C / V', desc: 'Kartu Merah Cepat (Home: C / Away: V)', category: 'Disiplin' },
    { key: 'PgUp / PgDn', desc: 'Menu Cepat Substitusi (Home: PgUp / Away: PgDn)', category: 'Pemain' },
    { key: 'M', desc: 'Buka / Tutup Panel Remote Controller Operator', category: 'Navigasi' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit text-white tracking-wide uppercase">
                PANDUAN SHORTCUT KEYBOARD
              </h2>
              <span className="text-xs text-slate-400">Kontrol Cepat Operator Lapangan Futsal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Bantuan Keyboard"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto divide-y divide-slate-800/60">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 min-w-[70px] text-center rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-sm font-bold shadow-sm">
                  {sc.key}
                </span>
                <span className="text-sm text-slate-200 font-medium">{sc.desc}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-outfit px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                {sc.category}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400">
          💡 Shortcut aktif secara global saat tampilan Scoreboard sedang difokuskan (tidak sedang mengetik pada input).
        </div>
      </div>
    </div>
  );
};
