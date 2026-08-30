import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 image uploads from gallery / camera
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini client on server
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Vision: Scan items from gallery image / photo / invoice / price list
  app.post('/api/scan-items-image', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', instructions } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required.' });
      }

      // Remove data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const ai = getAiClient();

      const prompt = `You are an expert Indian GST billing and inventory assistant.
Analyze this image (which may be a supplier invoice, printed receipt, product catalog, handwritten price list, wholesale quotation, shelf label, or item listing).
Extract all products, items, and services found in the image.

For each item, extract or smartly infer:
1. "name": Clean, descriptive product or service name (e.g. "Tata Salt 1kg", "Samsung 25W Fast Charger", "Cotton T-Shirt Blue L").
2. "itemCode": SKU, barcode, item code or serial if present (or empty string).
3. "itemType": "GOODS" for physical items, or "SERVICES" for labor/maintenance/consulting/services.
4. "hsnSacCode": 4 to 8 digit Indian GST HSN or SAC code if printed; if not printed, provide the most appropriate standard Indian HSN/SAC code (e.g. 847130 for laptops, 850440 for chargers, 610910 for t-shirts, 998311 for IT services).
5. "sellingPrice": Selling rate / MRP / unit price in Indian Rupees (₹) as a positive number.
6. "purchasePrice": Purchase / cost / wholesale rate in ₹ if visible (otherwise 0).
7. "gstRate": Applicable Indian GST rate as a number (0, 5, 12, 18, or 28). If unclear, default to 18 for general goods or 5/12 for standard groceries/clothing.
8. "unit": Measurement unit code (e.g. "PCS", "KGS", "NOS", "BOX", "MTR", "LTR", "SET", "PKT", "BAG", "DOZ", "HRS"). Default to "PCS".
9. "openingStock": Quantity / stock count visible or default 1.
10. "minStockAlert": Reasonable low stock threshold (e.g. 5).
11. "description": Brief extra details or specifications if any.

${instructions ? `User extra instruction: ${instructions}` : ''}
Extract all valid items.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    itemCode: { type: Type.STRING },
                    itemType: { type: Type.STRING, enum: ['GOODS', 'SERVICES'] },
                    hsnSacCode: { type: Type.STRING },
                    sellingPrice: { type: Type.NUMBER },
                    purchasePrice: { type: Type.NUMBER },
                    gstRate: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    openingStock: { type: Type.NUMBER },
                    minStockAlert: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                  },
                  required: ['name', 'hsnSacCode', 'sellingPrice', 'gstRate', 'unit'],
                },
              },
              summaryNotes: { type: Type.STRING },
              confidenceRating: { type: Type.STRING },
            },
            required: ['detectedItems'],
          },
        },
      });

      const rawText = response.text || '{}';
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        console.error('Failed to parse AI JSON response:', rawText);
        parsed = { detectedItems: [] };
      }

      return res.json({
        success: true,
        items: parsed.detectedItems || [],
        notes: parsed.summaryNotes || '',
        confidence: parsed.confidenceRating || 'HIGH',
      });
    } catch (error: any) {
      console.error('Error scanning items image with Gemini:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to analyze image with AI vision.',
      });
    }
  });

  // Vite middleware in dev mode / static in prod mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GST Invoice Pro server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
