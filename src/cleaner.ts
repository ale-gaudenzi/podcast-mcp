/**
 * Utility per la pulizia del testo e ottimizzazione fonetica per TTS
 */

// Mappa per la scanditura fonetica delle sigle tecniche e degli appalti
export const ACRONYMS: Record<string, string> = {
  // Categorie SOA e Opere
  "\\bOG1\\b": "O G 1",
  "\\bOG3\\b": "O G 3",
  "\\bOG6\\b": "O G 6",
  "\\bOG8\\b": "O G 8",
  "\\bOG10\\b": "O G 10",
  "\\bOG11\\b": "O G 11",
  "\\bOG13\\b": "O G 13",
  "\\bOS1\\b": "O S 1",
  "\\bOS10\\b": "O S 10",
  "\\bOS18-A\\b": "O S 18 A",
  "\\bOS18A\\b": "O S 18 A",
  "\\bOS21\\b": "O S 21",
  "\\bOS34\\b": "O S 34",

  // Appalti e Pubblica Amministrazione
  "\\bDGUE\\b": "D G U E",
  "\\bSOA\\b": "S O A",
  "\\bRUP\\b": "R U P",
  "\\bCUC\\b": "C U C",
  "\\bCPV\\b": "C P V",
  "\\bCCNL\\b": "C C N L",
  "\\bCIG\\b": "C I G",
  "\\bCUP\\b": "C U P",
  "\\bCAM\\b": "C A M",
  "\\bSINTEL\\b": "Sintel",
  "\\bANAC\\b": "Anac",
  "\\bTAR\\b": "Tar",
  "\\bMEF\\b": "M E F",
  "\\bMIT\\b": "M I T",

  // Formati e Sigle Informatiche
  "\\bPDF\\b": "P D F",
  "\\bXML\\b": "X M L",
  "\\bZIP\\b": "Zip",
  "\\bPEC\\b": "P E C",
  "\\bURL\\b": "U R L",
};

/**
 * Pulisce il testo da artefatti tipici generati dai Large Language Model
 * (istruzioni di regia, markdown, parentesi con pause, sigle)
 */
export function cleanScript(rawText: string): string {
  let text = rawText;

  // 1. Rimuove preamboli tipici di Claude (es. "Certamente! Ecco lo script del podcast:")
  text = text.replace(/^(?:Certamente!|Ecco|Di seguito|Qui c'è)\s+[^:\n]+:\s*\n*/i, "");

  // 2. Rimuove indicazioni di regia tra parentesi quadre: [Musica intro], [Pausa 2s], [Speaker 1]
  text = text.replace(/\[(?:Musica|Sigla|Pausa|Effetti sonore|Music|Sound effect|Intro|Outro|Speaker \d|Voce \d)[^\]]*\]/gi, "");
  text = text.replace(/\[[^\]]*(?:musica|sigla|music|sound|outro|intro|jingle)[^\]]*\]/gi, "");

  // 3. Rimuove indicazioni tra asterischi tipo *musica di sottofondo sfuma*
  text = text.replace(/\*(?:musica|sigla|pausa|effetti)[^*]*\*/gi, "");

  // 4. Rimuove indicazioni tra parentesi tonde tipo (musica in sottofondo) o (pausa)
  text = text.replace(/\((?:musica|sigla|pausa|silenzio)[^)]*\)/gi, "");

  // 5. Pulisce la formattazione Markdown
  // Rimuove intestazioni markdown (#, ##, ###) lasciando il testo del titolo
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1.");
  // Rimuove grassetto e corsivo markdown
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  // Converte elenchi puntati in frasi piane
  text = text.replace(/^\s*[-*•]\s+/gm, "");

  // 6. Conversione simboli comuni per migliore lettura TTS
  text = text.replace(/€\s*(\d+(?:[.,]\d+)?)/g, "$1 euro");
  text = text.replace(/(\d+(?:[.,]\d+)?)\s*€/g, "$1 euro");
  text = text.replace(/€/g, " euro ");
  text = text.replace(/(\d+(?:[.,]\d+)?)\s*%/g, "$1 per cento");
  text = text.replace(/%/g, " per cento ");
  text = text.replace(/§\s*(\d+)/g, "paragrafo $1");

  // 7. Scanditura fonetica delle sigle
  for (const [pattern, replacement] of Object.entries(ACRONYMS)) {
    text = text.replace(new RegExp(pattern, "g"), replacement);
  }

  // 8. Normalizzazione spaziature e righe vuote multiple
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
