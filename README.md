# 🎙️ Podcast MCP Server (con Voci Italiane ed Edge TTS)

Un server **MCP** (*Model Context Protocol*) remoto che permette a **Claude** (su Web o app mobile) di trasformare uno script narrativo in un **episodio podcast audio MP3** scaricabile e riproducibile direttamente via link.

* **TTS Engine:** Microsoft Edge TTS (qualità neurale naturale, 100% gratuito, nessuna API key richiesta).
* **Voci Italiane Native:** `it-male` (*Giuseppe*), `it-female` (*Elsa*), `it-diego` (*Diego*), `it-isabella` (*Isabella*).
* **Scanditura Sigle Tecniche:** normalizzazione automatica delle sigle dei contratti pubblici (`OG3` $\rightarrow$ *"O G 3"*, `DGUE` $\rightarrow$ *"D G U E"*, `SOA`, `RUP`, `CCNL`, `CIG`, ecc.).
* **Pulizia Automatica:** rimozione silenziosa di artefatti LLM (es. `[Musica di sottofondo]`, markdown, note di regia).
* **Trasporto:** MCP Streamable HTTP (compatibile al 100% con i Custom Connectors dell'app Claude).

---

## ⚡ Come funziona

1. Chiedi a Claude (sul telefono o via web): *"Fai un podcast di 5 minuti che mi spiega questo bando di gara..."*.
2. Claude redige l'intero script narrativo in prosa.
3. Claude chiama automaticamente il tool `generate_podcast(title, script, voice, rate)`.
4. Il server sintetizza l'audio in streaming MP3 e restituisce un **URL pubblico**.
5. Clicchi sul link dal tuo smartphone o PC e ascolti il podcast (in auto, con gli auricolari o salvandolo nella memoria).

---

## 🎙️ Voci disponibili

| Preset | Voce Edge TTS | Stile / Note |
|---|---|---|
| **`it-male`** *(Default)* | `it-IT-GiuseppeMultilingualNeural` | Molto naturale, perfetta per podcast e narrazione |
| **`it-female`** | `it-IT-ElsaNeural` | Calda, colloquiale e fluida |
| **`it-diego`** | `it-IT-DiegoNeural` | Più formale e istituzionale |
| **`it-isabella`** | `it-IT-IsabellaNeural` | Chiara e limpida |
| `en-male` / `en-female` | `en-US-AndrewNeural` / `AvaNeural` | Voci in lingua inglese |
| `fr-male` / `fr-female` | `fr-FR-HenriNeural` / `DeniseNeural` | Voci in lingua francese |
| `es-male` / `es-female` | `es-ES-AlvaroNeural` / `ElviraNeural` | Voci in lingua spagnola |

---

## 🚀 Esecuzione in Locale

Per testarlo in locale (ad esempio con l'MCP Inspector):

```bash
git clone https://github.com/ale-gaudenzi/podcast-mcp.git
cd podcast-mcp
npm install
npm run dev
```

Il server si avvia su `http://localhost:3000`. L'endpoint MCP è `http://localhost:3000/mcp`.

Puoi testarlo con l'Inspector MCP ufficiale:
```bash
npx @modelcontextprotocol/inspector
```
Seleziona trasporto **Streamable HTTP** e connettiti a `http://localhost:3000/mcp`.

---

## 🌐 Deploy Online (per collegarlo a Claude)

L'app di Claude effettua le chiamate dai server cloud di Anthropic, quindi per usarlo dal telefono il server deve avere un URL pubblico HTTPS.

### Opzione 1: Render (Consigliata, gratuita/rapida)
1. Vai su [render.com](https://render.com) e accedi con il tuo account GitHub.
2. Crea un **New Web Service** selezionando il repository `ale-gaudenzi/podcast-mcp`.
3. Render rileverà automaticamente la configurazione da `render.yaml`.
4. Aggiungi la variabile d'ambiente:
   * `PUBLIC_BASE_URL`: l'indirizzo HTTPS assegnato da Render (es. `https://podcast-mcp-xxxx.onrender.com`).
5. Clicca su **Deploy**.

### Opzione 2: Fly.io o Docker
È incluso il `Dockerfile` multi-stage:
```bash
fly launch
fly set secrets PUBLIC_BASE_URL="https://tuo-podcast.fly.dev"
fly deploy
```

---

## 📱 Collegamento con Claude

1. Apri l'app Claude (o su claude.ai da browser).
2. Vai su **Impostazioni** (o *Customize*) $\rightarrow$ **Connectors** (o *Integrazioni*).
3. Clicca su **"+"** (Aggiungi connettore custom).
4. Inserisci l'URL dell'endpoint:
   ```text
   https://TUO-SERVER-PUBBLICO/mcp
   ```
5. Ora chiedi a Claude:
   > *"Claude, scrivi un podcast di 5 minuti che riassume gli aspetti chiave di questo documento e crea l'audio per me."*
