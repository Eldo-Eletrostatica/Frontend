const WINDOWS_1252_MAP: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function encodeWindows1252Char(char: string): number {
  const code = char.codePointAt(0);
  if (code === undefined) return 0x3f;
  if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) return code;
  if (code in WINDOWS_1252_MAP) return WINDOWS_1252_MAP[code];

  const asciiFallback = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const fallbackCode = asciiFallback.codePointAt(0);
  if (fallbackCode !== undefined && fallbackCode < 0x80) return fallbackCode;
  return 0x3f;
}

// Spreadsheet viewers on mobile and local Excel opens default CSV files as
// Windows-1252, displaying a UTF-8 BOM and multi-byte accents as mojibake
// (e.g. "ï»¿PosiÃ§Ã£o"). Stripping the BOM and transcoding fixes the headers.
export async function transcodeCsvToWindows1252(content: Blob): Promise<Blob> {
  const text = (await content.text()).replace(/^\uFEFF/, "");
  const chars = Array.from(text);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i += 1) {
    bytes[i] = encodeWindows1252Char(chars[i]);
  }
  return new Blob([bytes], { type: "text/csv;charset=windows-1252" });
}

// Triggers the browser download of a file returned by the API.
export function saveFile(content: Blob, fileName: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Released on the next tick: revoking right away can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
