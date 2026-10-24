import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MatchState } from './src/types/scoreboard';
import { createInitialRoomState } from './src/utils/initialState';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '15mb' }));

// ============================================================================
// REALTIME MULTI-DEVICE ROOM ENGINE (Server-Authoritative State + SSE Stream)
// ============================================================================

const roomsState = new Map<string, MatchState>();
const roomOverlayTimestamp = new Map<string, number>();
const roomClients = new Map<string, Set<Response>>();

function normalizeRoomId(raw: string): string {
  const cleaned = (raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 12);
  if (!cleaned || cleaned === 'FUTSAL-2026') return 'JONG26';
  return cleaned;
}

function getOrCreateRoom(roomId: string): MatchState {
  const id = normalizeRoomId(roomId);
  let state = roomsState.get(id);
  if (!state) {
    state = createInitialRoomState(id);
    roomsState.set(id, state);
  }
  return state;
}

function getConnectedCount(roomId: string): number {
  const id = normalizeRoomId(roomId);
  return roomClients.get(id)?.size || 0;
}

function broadcastToRoom(roomId: string, payload: Record<string, any>): void {
  const id = normalizeRoomId(roomId);
  const clients = roomClients.get(id);
  if (!clients || clients.size === 0) return;

  const message = `data: ${JSON.stringify({
    ...payload,
    connectedDevices: clients.size,
  })}\n\n`;

  for (const clientRes of clients) {
    try {
      clientRes.write(message);
    } catch {
      clients.delete(clientRes);
    }
  }
}

// Server-Authoritative 1s Timer & Overlay Cleanup Loop
setInterval(() => {
  const now = Date.now();

  for (const [roomId, state] of roomsState.entries()) {
    let changed = false;
    let nextState = state;

    // Auto-clear overlay after 4.2 seconds so late joiners or displays clear cleanly
    if (nextState.activeOverlay) {
      const overlayStart = roomOverlayTimestamp.get(roomId) || now;
      if (now - overlayStart >= 4300) {
        nextState = {
          ...nextState,
          activeOverlay: null,
          lastUpdated: now,
        };
        roomOverlayTimestamp.delete(roomId);
        changed = true;
      }
    }

    // Server-authoritative countdown timer tick
    if (nextState.timer.isRunning) {
      const { minutes, seconds } = nextState.timer;

      if (minutes === 0 && seconds <= 1) {
        const timeUpOverlay = {
          id: now,
          type: 'timeup' as const,
          title: 'WAKTU HABIS',
          subtitle: 'Babak Selesai',
        };
        nextState = {
          ...nextState,
          timer: {
            ...nextState.timer,
            minutes: 0,
            seconds: 0,
            isRunning: false,
          },
          activeOverlay: timeUpOverlay,
          lastUpdated: now,
        };
        roomOverlayTimestamp.set(roomId, now);
        roomsState.set(roomId, nextState);

        // Broadcast both buzzer sound trigger and updated state to all devices in the room
        broadcastToRoom(roomId, {
          type: 'BUZZER',
          duration: 2.2,
          timestamp: now,
        });
        broadcastToRoom(roomId, {
          type: 'STATE_UPDATE',
          state: nextState,
          senderId: 'SERVER_TIMER',
        });
        continue;
      } else {
        let newMins = minutes;
        let newSecs = seconds - 1;
        if (newSecs < 0) {
          newMins = Math.max(0, minutes - 1);
          newSecs = 59;
        }
        nextState = {
          ...nextState,
          timer: {
            ...nextState.timer,
            minutes: newMins,
            seconds: newSecs,
          },
          lastUpdated: now,
        };
        changed = true;
      }
    }

    if (changed) {
      roomsState.set(roomId, nextState);
      broadcastToRoom(roomId, {
        type: 'STATE_UPDATE',
        state: nextState,
        senderId: 'SERVER_TIMER',
      });
    }
  }
}, 1000);

// Heartbeat every 15s to keep SSE connections alive across proxies/mobile networks
setInterval(() => {
  for (const [, clients] of roomClients.entries()) {
    for (const res of clients) {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clients.delete(res);
      }
    }
  }
}, 15000);

// 1. SSE Realtime Stream for a Room
app.get('/api/rooms/:roomId/events', (req: Request, res: Response) => {
  const roomId = normalizeRoomId(String(req.params.roomId || 'JONG26'));
  const state = getOrCreateRoom(roomId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set());
  }
  const clients = roomClients.get(roomId)!;
  clients.add(res);

  // Send immediate initial state to this device
  res.write(
    `data: ${JSON.stringify({
      type: 'INIT',
      state,
      connectedDevices: clients.size,
    })}\n\n`
  );

  // Notify all other devices in the room about updated presence count
  broadcastToRoom(roomId, {
    type: 'PRESENCE',
    connectedDevices: clients.size,
  });

  req.on('close', () => {
    clients.delete(res);
    broadcastToRoom(roomId, {
      type: 'PRESENCE',
      connectedDevices: clients.size,
    });
  });
});

// 2. Get Current Room State (Initial load / Polling fallback)
app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const roomId = normalizeRoomId(String(req.params.roomId || 'JONG26'));
  const state = getOrCreateRoom(roomId);
  res.json({
    success: true,
    state,
    connectedDevices: getConnectedCount(roomId),
  });
});

// 3. Mutate / Sync Room State from any Controller or Display
app.post('/api/rooms/:roomId/sync', (req: Request, res: Response) => {
  try {
    const roomId = normalizeRoomId(String(req.params.roomId || 'JONG26'));
    const current = getOrCreateRoom(roomId);
    const { state: incomingPartial, senderId } = req.body || {};

    if (!incomingPartial || typeof incomingPartial !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid state payload' });
      return;
    }

    const now = Date.now();
    const updatedState: MatchState = {
      ...current,
      ...incomingPartial,
      matchId: roomId,
      lastUpdated: now,
    };

    if (incomingPartial.activeOverlay) {
      roomOverlayTimestamp.set(roomId, now);
    } else if (incomingPartial.activeOverlay === null) {
      roomOverlayTimestamp.delete(roomId);
    }

    roomsState.set(roomId, updatedState);

    broadcastToRoom(roomId, {
      type: 'STATE_UPDATE',
      state: updatedState,
      senderId: senderId || null,
    });

    res.json({
      success: true,
      state: updatedState,
      connectedDevices: getConnectedCount(roomId),
    });
  } catch (error: any) {
    console.error('Error syncing room state:', error);
    res.status(500).json({ success: false, error: error?.message || 'Sync error' });
  }
});

// 4. Trigger Remote Stadium Buzzer across all devices in the Room
app.post('/api/rooms/:roomId/buzzer', (req: Request, res: Response) => {
  const roomId = normalizeRoomId(String(req.params.roomId || 'JONG26'));
  getOrCreateRoom(roomId);
  const { duration = 1.6, senderId = null } = req.body || {};

  broadcastToRoom(roomId, {
    type: 'BUZZER',
    duration,
    senderId,
    timestamp: Date.now(),
  });

  res.json({ success: true });
});

// ============================================================================
// GEMINI AI TACTICAL COMMENTARY & PRESS RELEASE ENDPOINT
// ============================================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    const { type, matchData } = req.body;

    const homeTeam = matchData.homeTeam || { name: 'Home Team', score: 0 };
    const awayTeam = matchData.awayTeam || { name: 'Away Team', score: 0 };
    const matchTitle = matchData.matchTitle || 'GAWANG MINI JONG CANO';
    const period = matchData.period || 1;
    const stats = matchData.stats || {
      home: { shots: 0, shotsOnTarget: 0, corners: 0, possession: 50 },
      away: { shots: 0, shotsOnTarget: 0, corners: 0, possession: 50 },
    };
    const penaltyMode = matchData.isPenaltyMode || false;
    const penalties = matchData.penalties || { home: [], away: [] };

    let prompt = '';
    let systemInstruction = '';

    if (type === 'commentary') {
      systemInstruction = `Anda adalah seorang komentator olahraga futsal & gawang mini profesional televisi Indonesia yang bersemangat, enerjik, analitis, dan memiliki wawasan taktik yang tajam (seperti bung Binder / Rendra Soedjono). Gunakan bahasa Indonesia yang hidup, penuh antusiasme olahraga, dan istilah taktis yang tepat (power play, pivot, flank, anchor, counter-attack, pressing ketat). Berikan ulasan dalam 2-3 paragraf padat.`;

      prompt = `
Analisis jalannya pertandingan turnamen "${matchTitle}" berikut sebagai komentator TV:
- Skor Sementara / Akhir: ${homeTeam.name} (${homeTeam.score}) vs (${awayTeam.score}) ${awayTeam.name}
- Babak: ${period === 1 ? 'Babak Pertama' : period === 2 ? 'Babak Kedua' : period === 3 ? 'Perpanjangan Waktu (Extra Time)' : 'Adu Penalti'}
- Penguasaan Bola: ${homeTeam.name} ${stats.home?.possession || 50}% vs ${stats.away?.possession || 50}% ${awayTeam.name}
- Total Tembakan: ${homeTeam.name} ${stats.home?.shots || 0} (${stats.home?.shotsOnTarget || 0} on target) vs ${awayTeam.name} ${stats.away?.shots || 0} (${stats.away?.shotsOnTarget || 0} on target)
- Pelanggaran (Fouls): ${homeTeam.name} ${homeTeam.fouls || 0} vs ${awayTeam.name} ${awayTeam.fouls || 0}
- Tendangan Sudut: ${homeTeam.name} ${stats.home?.corners || 0} vs ${stats.away?.corners || 0}
${penaltyMode ? `- Status Adu Penalti Home: ${JSON.stringify(penalties.home)}, Away: ${JSON.stringify(penalties.away)}` : ''}

Berikan:
1. Reaksi & Analisis Dinamika Pertandingan di ajang ${matchTitle} saat ini (highlight intensitas, tempo cepat, dan duel lapangan).
2. Sorotan Taktik Kunci (siapa yang mendominasi penguasaan, efektivitas transisi, dan kedisiplinan bertahan).
3. Prediksi & Catatan Penentu (apa yang harus diwaspadai di sisa menit / babak berikutnya).
`;
    } else {
      systemInstruction = `Anda adalah seorang jurnalis olahraga senior spesialis futsal dan mini soccer nasional yang menulis rilis berita resmi pertandingan pers untuk turnamen ${matchTitle}. Gaya penulisan formal, tajam, faktual, objektif, dan berstandar jurnalistik kantor berita olahraga (headline menarik + lead berita 5W1H + analisis jalannya laga + kutipan kesan pertandingan).`;

      prompt = `
Buatlah rilis berita resmi (Press Release) hasil pertandingan turnamen "${matchTitle}":
- Tim Bertanding: ${homeTeam.name} vs ${awayTeam.name}
- Skor Akhir: ${homeTeam.score} - ${awayTeam.score}
- Status Babak: ${period === 1 ? 'Paruh Waktu (Half Time)' : period >= 2 ? 'Penuh Waktu (Full Time)' : 'Sesi Adu Penalti'}
- Statistik Pertandingan:
  * Penguasaan Bola: ${stats.home?.possession || 50}% - ${stats.away?.possession || 50}%
  * Total Shots (On Target): ${stats.home?.shots || 0} (${stats.home?.shotsOnTarget || 0}) vs ${stats.away?.shots || 0} (${stats.away?.shotsOnTarget || 0})
  * Fouls: ${homeTeam.fouls || 0} vs ${awayTeam.fouls || 0}
  * Corners: ${stats.home?.corners || 0} vs ${stats.away?.corners || 0}

Susun dalam format:
1. [HEADLINE BERITA YANG MENGGELEGAR]
2. [LOKASI & TANGGAL] - Lead Berita ringkas 5W1H turnamen ${matchTitle}
3. Kronologi & Tekanan Lapangan (analisis permainan kedua kubu)
4. Evaluasi Angka Statistik & Kesimpulan Laga
`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const text = response.text || 'Tidak ada analisis yang dihasilkan.';
    res.json({ success: true, text });
  } catch (error: any) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal menghasilkan ulasan kecerdasan buatan.',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Futsal Scoreboard Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
