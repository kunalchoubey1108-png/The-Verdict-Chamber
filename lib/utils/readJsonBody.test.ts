import { describe, expect, it } from "vitest";
import { readJsonBody } from "./readJsonBody";

describe("readJsonBody", () => {
  it("parses JSON within the byte limit", async () => {
    const result = await readJsonBody(new Request("http://localhost", {
      method: "POST", body: JSON.stringify({ ok: true }),
    }), 32);

    expect(result).toEqual({ ok: true, value: { ok: true } });
  });

  it("rejects declared oversized bodies before reading them", async () => {
    const result = await readJsonBody(new Request("http://localhost", {
      method: "POST", headers: { "content-length": "100" }, body: "{}",
    }), 32);

    expect(result).toEqual({ ok: false, status: 413, error: "Request is too large." });
  });

  it("stops a streamed body once it exceeds the byte limit", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(20));
        controller.enqueue(new Uint8Array(20));
        controller.close();
      },
    });
    const request = { body: stream, headers: new Headers() } as Request;
    const result = await readJsonBody(request, 32);

    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects malformed JSON and invalid UTF-8", async () => {
    const malformed = await readJsonBody(new Request("http://localhost", { method: "POST", body: "{" }), 32);
    const invalidUtf8 = {
      body: new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array([0xff])); controller.close(); } }),
      headers: new Headers(),
    } as Request;

    expect(malformed).toMatchObject({ ok: false, status: 400 });
    expect(await readJsonBody(invalidUtf8, 32)).toMatchObject({ ok: false, status: 400 });
  });
});
