import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

function getGeminiClient() {
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
}

app.post('/api/vault/scan', async (req, res) => {
  try {
    const { text, fileData, mimeType, fileName } = req.body as {
      text?: string;
      fileData?: string;
      mimeType?: string;
      fileName?: string;
    };

    if ((!text || !text.trim()) && (!fileData || !mimeType)) {
      return res.status(400).json({
        error: 'Provide either document text or an uploaded image/PDF file to scan.',
      });
    }

    const ai = getGeminiClient();

    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

    if (fileData && mimeType) {
      const cleanBase64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptLines = [
      'Extract structured personal asset, policy, warranty, legal document, digital credential, or beneficiary contact details from the provided document.',
      'Return valid JSON strictly conforming to the schema.',
      'Use ISO YYYY-MM-DD format for issueDate and expirationDate when present (or empty string if absent).',
      'For category, pick exactly one of: policy_warranty, legal_identity, digital_credential, beneficiary_contact.',
      'For valueAmount, return a numeric dollar value if coverage or asset value is stated, otherwise 0.',
      fileName ? `Source filename: ${fileName}` : '',
      text && text.trim() ? `Document text:\n${text.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    parts.push({ text: promptLines });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction:
          'You are a meticulous personal document and policy extraction engine for LifeVault System. Extract factual metadata concisely without inventing missing identifiers.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description:
                'One of: policy_warranty, legal_identity, digital_credential, beneficiary_contact',
            },
            title: {
              type: Type.STRING,
              description: 'Concise descriptive title of the policy, document, credential, or contact.',
            },
            subType: {
              type: Type.STRING,
              description: 'Specific type such as Homeowners Policy, Property Deed, Government ID, Master Recovery Key, or Primary Beneficiary.',
            },
            providerOrIssuer: {
              type: Type.STRING,
              description: 'Insurer, government agency, vendor, service provider, or relationship.',
            },
            sensitiveIdentifier: {
              type: Type.STRING,
              description: 'Policy number, serial number, document ID, recovery key, or direct phone number.',
            },
            secondarySecret: {
              type: Type.STRING,
              description: 'Optional claim PIN, parcel ID, passphrase hint, or email address.',
            },
            valueAmount: {
              type: Type.NUMBER,
              description: 'Monetary coverage or asset value in USD, or 0 if not applicable.',
            },
            issueDate: {
              type: Type.STRING,
              description: 'Effective or issue date in YYYY-MM-DD format, or empty string.',
            },
            expirationDate: {
              type: Type.STRING,
              description: 'Expiration or next renewal/review date in YYYY-MM-DD format, or empty string.',
            },
            autoRenew: {
              type: Type.BOOLEAN,
              description: 'Whether the document indicates automatic renewal.',
            },
            locationOrStorage: {
              type: Type.STRING,
              description: 'Suggested physical or digital storage location.',
            },
            notes: {
              type: Type.STRING,
              description: 'Concise summary of key coverage riders, terms, or verification notes.',
            },
            confidenceNote: {
              type: Type.STRING,
              description: 'Short 1-sentence note summarizing what fields were extracted.',
            },
          },
          required: [
            'category',
            'title',
            'subType',
            'providerOrIssuer',
            'sensitiveIdentifier',
            'secondarySecret',
            'valueAmount',
            'issueDate',
            'expirationDate',
            'autoRenew',
            'locationOrStorage',
            'notes',
            'confidenceNote',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    const validCategories = new Set([
      'policy_warranty',
      'legal_identity',
      'digital_credential',
      'beneficiary_contact',
    ]);
    if (!validCategories.has(parsed.category)) {
      parsed.category = 'policy_warranty';
    }

    return res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Document extraction failed.';
    const status =
      message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')
        ? 403
        : message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : 500;
    return res.status(status).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeVault System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
