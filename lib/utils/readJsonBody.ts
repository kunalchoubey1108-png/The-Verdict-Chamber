export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

/** Read and parse a JSON request without buffering more than the caller's byte limit. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      return { ok: false, status: 413, error: "Request is too large." };
    }
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Request must contain valid JSON." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        void reader.cancel("Request body exceeds the size limit.").catch(() => undefined);
        return { ok: false, status: 413, error: "Request is too large." };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    try {
      return { ok: true, value: JSON.parse(text) as unknown };
    } catch {
      return { ok: false, status: 400, error: "Request must contain valid JSON." };
    }
  } catch {
    return { ok: false, status: 400, error: "Request body could not be read." };
  } finally {
    reader.releaseLock();
  }
}
