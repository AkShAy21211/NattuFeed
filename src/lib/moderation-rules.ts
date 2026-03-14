/**
 * Deterministic Rules for Content Moderation
 * Moved out of components to keep the codebase "Shock-Free" for developers.
 */

export const BANNED_KEYWORDS = [
  // --- Malayalam (Manglish / Transliterated) ---
  // High Severity / Slurs
  "myru", "mairan", "myre", "mair", "thayoli", "thallayoli", "kundana", "kundan",
  "poori", "pooru", "pooran", "veshya", "vashya", "koothichi", "kazhuveriyamone",
  "pulayadi", "pelayadi", "kandaraoli", "avarathi", "punda", "vidoori", "pizha",
  
  // Anatomical / Aggressive
  "kunna", "kunne", "oombu", "oombi", "oombanam", "kotham", "kothil", "koondi", 
  "andi", "moonchi", "vaanam", "adiyana", "kadi", "kazhappu", "kambi", "vedi",

  // --- Malayalam (Native Script) ---
  "മൈര്", "മൈരൻ", "തഴോളി", "തള്ളയാളി", "കുണ്ടൻ", "പൂറി", "പൂറ്", "വേശ്യ", 
  "കൂത്തിച്ചി", "കഴുവേറി", "പുലയാടി", "പിഴ", "കുണ്ണ", "ഊമ്പ്", "കോന്തൻ", 
  "കോതം", "അണ്ടി", "മൂഞ്ചി", "വാണം", "വെടി", "തള്ളക്ക്",

  // --- English (High Severity & Slurs) ---
  "fuck", "fucker", "fucking", "motherfucker", "shit", "shitting", "asshole", 
  "bitch", "cunt", "bastard", "dick", "pussy", "slut", "whore", "nigger", 
  "retard", "faggot", "twat", "dickhead", "bullshit", "cocksucker"
];

/**
 * Normalizes text for comparison by removing common punctuation used to bypass filters.
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.*\-+?^${}()|[\]\\_\s!@#$%^&]/g, ''); // Removes spaces and special chars
};
