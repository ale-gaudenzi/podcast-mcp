import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { synthesizeNarration, VOICES, DEFAULT_VOICE } from "./tts.js";

// --- Config -----------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3000);
// URL pubblico di questo server (es. https://tuo-podcast.fly.dev o https://tuo-servizio.onrender.com)
// Deve essere raggiungibile via internet dai server di Claude per la connessione remota.
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");
const EPISODES_DIR = path.resolve(process.env.EPISODES_DIR ?? "./episodes");

// --- Core Generazione Podcast -----------------------------------------------

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "episodio"
  );
}

interface GenerateArgs {
  title: string;
  script: string;
  voice?: string;
  rate?: string;
}

interface GeneratedEpisode {
  id: string;
  title: string;
  url: string;
  durationSeconds: number;
  voice: string;
}

async function generateEpisode(args: GenerateArgs): Promise<GeneratedEpisode> {
  const id = `${slugify(args.title)}-${randomUUID().slice(0, 8)}`;
  const outPathNoExt = path.join(EPISODES_DIR, id);
  const voice = args.voice ?? DEFAULT_VOICE;

  const { durationSeconds, voiceUsed } = await synthesizeNarration({
    text: args.script,
    voice,
    rate: args.rate,
    outPathNoExt,
  });

  return {
    id,
    title: args.title,
    url: `${PUBLIC_BASE_URL}/episodes/${id}.mp3`,
    durationSeconds,
    voice: voiceUsed,
  };
}

// --- Server MCP -------------------------------------------------------------

function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: "podcast-generator",
    version: "0.2.0",
  });

  server.registerTool(
    "generate_podcast",
    {
      title: "Genera un episodio podcast audio (MP3)",
      description:
        "Converte uno script narrativo in un file podcast audio MP3 scaricabile e ascoltabile. " +
        "Scrivi prima tu stesso l'intero testo narrato in prosa piana fluida (evitando istruzioni di regia tra parentesi), " +
        "quindi passa il titolo e lo script a questo tool. " +
        "Restituisce un URL pubblico pronto per essere ascoltato o scaricato da smartphone o PC.",
      inputSchema: {
        title: z.string().describe("Titolo breve dell'episodio, usato per comporre il nome del file."),
        script: z
          .string()
          .describe(
            "Il testo completo da leggere ad alta voce. Prosa piana in italiano, numeri scritti a parole dove opportuno."
          ),
        voice: z
          .enum(Object.keys(VOICES) as [string, ...string[]])
          .optional()
          .describe(`Preset voce TTS. Default: "${DEFAULT_VOICE}". Voci: ${Object.keys(VOICES).join(", ")}`),
        rate: z
          .string()
          .optional()
          .describe("Regolazione velocita lettura (es. '0%', '+10%', '-5%'). Default: '0%'."),
      },
    },
    async ({ title, script, voice, rate }) => {
      const episode = await generateEpisode({ title, script, voice, rate });
      const mins = Math.floor(episode.durationSeconds / 60);
      const secs = episode.durationSeconds % 60;
      return {
        content: [
          {
            type: "text",
            text:
              `🎙️ Episodio Podcast pronto: "${episode.title}"\n` +
              `⏱️ Durata stimata: circa ${mins}m ${secs.toString().padStart(2, "0")}s\n` +
              `🗣️ Voce usata: ${episode.voice}\n` +
              `🔗 Ascolta / Scarica: ${episode.url}`,
          },
        ],
      };
    }
  );

  return server;
}

// --- Livello HTTP Express ----------------------------------------------------

const app = express();
app.use(express.json({ limit: "5mb" }));

// Servizio statico dei file MP3 generati
app.use(
  "/episodes",
  express.static(EPISODES_DIR, {
    setHeaders: (res) => {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, voices: Object.keys(VOICES), defaultVoice: DEFAULT_VOICE });
});

// Endpoint MCP Streamable HTTP (modalità stateless)
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Errore richiesta MCP:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Errore interno server" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Metodo non consentito. Usa POST con trasporto MCP Streamable HTTP." },
    id: null,
  });
});

app.listen(PORT, async () => {
  await fs.mkdir(EPISODES_DIR, { recursive: true });
  console.log(`\n🎧 Server Podcast MCP attivo!`);
  console.log(`  URL pubblico:   ${PUBLIC_BASE_URL}`);
  console.log(`  Endpoint MCP:   ${PUBLIC_BASE_URL}/mcp`);
  console.log(`  Cartella audio: ${EPISODES_DIR}`);
  console.log(`  Voce default:   ${DEFAULT_VOICE} (${VOICES[DEFAULT_VOICE]})\n`);
});

export { generateEpisode, isInitializeRequest };
