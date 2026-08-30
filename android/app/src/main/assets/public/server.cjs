var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in server environment.");
    }
    return new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/scan-items-image", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", instructions } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required." });
      }
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const ai = getAiClient();
      const prompt = `You are an expert Indian GST billing and inventory assistant.
Analyze this image (which may be a supplier invoice, printed receipt, product catalog, handwritten price list, wholesale quotation, shelf label, or item listing).
Extract all products, items, and services found in the image.

For each item, extract or smartly infer:
1. "name": Clean, descriptive product or service name (e.g. "Tata Salt 1kg", "Samsung 25W Fast Charger", "Cotton T-Shirt Blue L").
2. "itemCode": SKU, barcode, item code or serial if present (or empty string).
3. "itemType": "GOODS" for physical items, or "SERVICES" for labor/maintenance/consulting/services.
4. "hsnSacCode": 4 to 8 digit Indian GST HSN or SAC code if printed; if not printed, provide the most appropriate standard Indian HSN/SAC code (e.g. 847130 for laptops, 850440 for chargers, 610910 for t-shirts, 998311 for IT services).
5. "sellingPrice": Selling rate / MRP / unit price in Indian Rupees (\u20B9) as a positive number.
6. "purchasePrice": Purchase / cost / wholesale rate in \u20B9 if visible (otherwise 0).
7. "gstRate": Applicable Indian GST rate as a number (0, 5, 12, 18, or 28). If unclear, default to 18 for general goods or 5/12 for standard groceries/clothing.
8. "unit": Measurement unit code (e.g. "PCS", "KGS", "NOS", "BOX", "MTR", "LTR", "SET", "PKT", "BAG", "DOZ", "HRS"). Default to "PCS".
9. "openingStock": Quantity / stock count visible or default 1.
10. "minStockAlert": Reasonable low stock threshold (e.g. 5).
11. "description": Brief extra details or specifications if any.

${instructions ? `User extra instruction: ${instructions}` : ""}
Extract all valid items.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg"
              }
            },
            {
              text: prompt
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              detectedItems: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    name: { type: import_genai.Type.STRING },
                    itemCode: { type: import_genai.Type.STRING },
                    itemType: { type: import_genai.Type.STRING, enum: ["GOODS", "SERVICES"] },
                    hsnSacCode: { type: import_genai.Type.STRING },
                    sellingPrice: { type: import_genai.Type.NUMBER },
                    purchasePrice: { type: import_genai.Type.NUMBER },
                    gstRate: { type: import_genai.Type.NUMBER },
                    unit: { type: import_genai.Type.STRING },
                    openingStock: { type: import_genai.Type.NUMBER },
                    minStockAlert: { type: import_genai.Type.NUMBER },
                    description: { type: import_genai.Type.STRING }
                  },
                  required: ["name", "hsnSacCode", "sellingPrice", "gstRate", "unit"]
                }
              },
              summaryNotes: { type: import_genai.Type.STRING },
              confidenceRating: { type: import_genai.Type.STRING }
            },
            required: ["detectedItems"]
          }
        }
      });
      const rawText = response.text || "{}";
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        console.error("Failed to parse AI JSON response:", rawText);
        parsed = { detectedItems: [] };
      }
      return res.json({
        success: true,
        items: parsed.detectedItems || [],
        notes: parsed.summaryNotes || "",
        confidence: parsed.confidenceRating || "HIGH"
      });
    } catch (error) {
      console.error("Error scanning items image with Gemini:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to analyze image with AI vision."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GST Invoice Pro server active on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
});
//# sourceMappingURL=server.cjs.map
