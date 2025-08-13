const API_URL = process.env.API_URL || "";
const API_KEY = process.env.API_KEY || "";

export type CompilePdfPayload = {
  indexMd: string;
  configuracaoYaml: string;
  referenciasBib: string;
};

export type CompilePdfResponse = {
  blob: Blob;
  fileName?: string;
};

/**
 * Envia o payload para "/gerar-pdf" e retorna o PDF (ou um PDF de erro) com um nome sugerido.
 */
export async function compilePdf(
  payload: CompilePdfPayload,
  signal?: AbortSignal
): Promise<CompilePdfResponse> {
  const res = await fetch(`${API_URL}/gerar-pdf`, {
    method: "POST",
    headers: buildHeaders(API_KEY),
    body: JSON.stringify(payload),
    signal,
  });

  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") ?? "";
  const name = extractFilenameFromContentDisposition(cd);

  return { blob, fileName: name || (res.ok ? "arquivo.pdf" : "erro.pdf") };
}

/**
 * Constrói os headers da requisição, incluindo Authorization quando a API key é fornecida.
 */
function buildHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/pdf",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

/**
 * Extrai o nome do arquivo do header Content-Disposition, incluindo suporte a RFC 5987 (filename*).
 */
function extractFilenameFromContentDisposition(header: string): string | undefined {
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (star?.[1]) {
    try { return decodeURIComponent(star[1]); } catch {}
  }
  const simple = /filename\s*=\s*\"?([^\";]+)\"?/i.exec(header);
  return simple?.[1] || undefined;
}
