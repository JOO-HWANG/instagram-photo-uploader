import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Support large payloads for image base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API: AI Instagram Caption Generator
app.post('/api/generate-caption', async (req, res) => {
  try {
    const { suburb, postcode, locationFull, locationName, productCode, productName, memo, imageBase64, mimeType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
    }

    const contents: Array<any> = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
당신은 시드니 힐스 디스트릭트(Hills District) 및 그레이터 시드니 프리미엄 블라인드 & 커튼 전문 브랜드인 'Hills Blind Lab'의 전문 SNS 마케터입니다.
현장 시공 사진과 메타데이터를 바탕으로 인스타그램에 바로 올릴 수 있는 세련되고 전문적인 포스팅 캡션과 해시태그를 작성해주세요.

[현장 정보]
- 지역/Suburb: ${suburb || 'Hills District'} (Postcode: ${postcode || '2154'})
- 시공 공간: ${locationName || locationFull || 'Living Room'} (${locationFull || ''})
- 제품: ${productName || productCode || 'Blinds/Curtains'} (코드: ${productCode || ''})
- 현장 메모/옵션: ${memo || '전문 실측 맞춤 제작 및 시공'}

[작성 가이드]
1. 인스타그램 스타일에 맞게 이모지와 함께 트렌디하고 정갈하게 작성하세요.
2. 한국어 본문 + 짧고 자연스러운 영문 요약(호주 현지 로컬 고객도 타겟)을 조화롭게 포함하세요.
3. 공간에 어울리는 채광 조절, 인테리어 무드, 맞춤 시공의 장점을 부각하세요.
4. 마지막에 Hills Blind Lab의 무료 방문 실측/견적 문의(DM 또는 프로필 링크) 콜투액션을 포함하세요.
5. 지역 맞춤 해시태그 (예: #HillsBlindLab #${suburb}Blinds #SydneyCurtains #HillsDistrict 등)를 15~20개 포함하세요.
`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: 'You are a professional social media marketing copywriter for Hills Blind Lab, an Australian premium custom blinds and curtains studio in Sydney.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: 'A catchy 1-line hook/title with emojis',
            },
            captionText: {
              type: Type.STRING,
              description: 'Full Instagram caption formatted with line breaks, Korean body, English summary, and CTA',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '15-20 relevant hashtags for Instagram',
            },
            keyFeatures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 key bullet points highlighting the installation features',
            },
          },
          required: ['headline', 'captionText', 'hashtags', 'keyFeatures'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Caption generation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate Instagram caption',
    });
  }
});

// API: Webhook Proxy (solves CORS issues for external n8n/webhook servers)
app.post('/api/webhook-proxy', async (req, res) => {
  try {
    const { webhookUrl, payload } = req.body;

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    // Call external webhook from server environment
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hills-Blind-Lab-Uploader/1.0',
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => ({}));
    } else {
      responseData = await response.text();
    }

    return res.status(response.status).json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Webhook proxy error:', error);
    return res.status(502).json({
      success: false,
      error: error.message || 'Network error connecting to webhook URL',
    });
  }
});

// API: Reverse Geocode (Lat/Lng -> Suburb, Postcode)
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const lat = req.query.lat as string;
    const lng = req.query.lng as string;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HillsBlindLab-FieldUploader/1.0',
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: 'Geocoding service unavailable' });
    }

    const data = await response.json();
    const address = data.address || {};
    const suburb =
      address.suburb ||
      address.neighbourhood ||
      address.town ||
      address.city_district ||
      address.village ||
      address.city ||
      '';
    const postcode = address.postcode || '';

    return res.json({
      suburb,
      postcode,
      state: address.state || '',
      country: address.country || '',
      displayName: data.display_name,
    });
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ error: error.message || 'Geocoding failed' });
  }
});

// Setup Vite in Dev or serve static in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        port: Number(port),
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
