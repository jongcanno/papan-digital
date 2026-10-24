import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Tactical Commentary and Press Release Endpoint
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    const { type, matchData } = req.body;

    const homeTeam = matchData.homeTeam || { name: 'Home Team', score: 0 };
    const awayTeam = matchData.awayTeam || { name: 'Away Team', score: 0 };
    const period = matchData.period || 1;
    const stats = matchData.stats || {
      home: { shots: 0, shotsOnTarget: 0, corners: 0, possession: 50 },
      away: { shots: 0, shotsOnTarget: 0, corners: 0, possession: 50 }
    };
    const penaltyMode = matchData.isPenaltyMode || false;
    const penalties = matchData.penalties || { home: [], away: [] };

    let prompt = '';
    let systemInstruction = '';

    if (type === 'commentary') {
      systemInstruction = `Anda adalah seorang komentator olahraga futsal profesional televisi Indonesia yang bersemangat, enerjik, analitis, dan memiliki wawasan taktik futsal yang tajam (seperti bung Binder / Rendra Soedjono). Gunakan bahasa Indonesia yang hidup, penuh antusiasme olahraga, dan istilah futsal yang tepat (power play, pivot, flank, anchor, counter-attack, pressing ketat). Berikan ulasan dalam 2-3 paragraf padat.`;
      
      prompt = `
Analisis jalannya pertandingan futsal berikut sebagai komentator TV:
- Skor Sementara / Akhir: ${homeTeam.name} (${homeTeam.score}) vs (${awayTeam.score}) ${awayTeam.name}
- Babak: ${period === 1 ? 'Babak Pertama' : period === 2 ? 'Babak Kedua' : period === 3 ? 'Perpanjangan Waktu (Extra Time)' : 'Adu Penalti'}
- Penguasaan Bola: ${homeTeam.name} ${stats.home?.possession || 50}% vs ${stats.away?.possession || 50}% ${awayTeam.name}
- Total Tembakan: ${homeTeam.name} ${stats.home?.shots || 0} (${stats.home?.shotsOnTarget || 0} on target) vs ${awayTeam.name} ${stats.away?.shots || 0} (${stats.away?.shotsOnTarget || 0} on target)
- Pelanggaran (Fouls): ${homeTeam.name} ${homeTeam.fouls || 0} vs ${awayTeam.name} ${awayTeam.fouls || 0}
- Tendangan Sudut: ${homeTeam.name} ${stats.home?.corners || 0} vs ${awayTeam.name} ${stats.away?.corners || 0}
${penaltyMode ? `- Status Adu Penalti Home: ${JSON.stringify(penalties.home)}, Away: ${JSON.stringify(penalties.away)}` : ''}

Berikan:
1. Reaksi & Analisis Dinamika Pertandingan saat ini (highlight intensitas, tempo cepat, dan duel lapangan).
2. Sorotan Taktik Kunci (siapa yang mendominasi penguasaan, efektivitas transisi, dan kedisiplinan bertahan).
3. Prediksi & Catatan Penentu (apa yang harus diwaspadai di sisa menit / babak berikutnya).
`;
    } else {
      systemInstruction = `Anda adalah seorang jurnalis olahraga senior spesialis futsal nasional yang menulis rilis berita resmi pertandingan pers. Gaya penulisan formal, tajam, faktual, objektif, dan berstandar jurnalistik kantor berita olahraga (headline menarik + lead berita 5W1H + analisis jalannya laga + kutipan kesan pertandingan).`;
      
      prompt = `
Buatlah rilis berita resmi (Press Release) hasil pertandingan futsal:
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
2. [LOKASI & TANGGAL] - Lead Berita ringkas 5W1H
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
      error: error?.message || 'Gagal menghasilkan ulasan kecerdasan buatan.'
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
