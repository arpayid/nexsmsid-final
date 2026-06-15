import { io, type Socket } from "socket.io-client";
import { describe, it, expect, afterAll, afterEach } from "vitest";

import { API_URL } from "./config";
import { adminToken, db } from "./helpers";

describe("websocket events gateway (integration)", () => {
  let socket: Socket | undefined;

  afterEach(() => {
    socket?.disconnect();
    socket = undefined;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  function connect(token?: string): Socket {
    return io(`${API_URL}/events`, {
      ...(token ? { auth: { token } } : {}),
      transports: ["websocket"],
      reconnection: false,
    });
  }

  it("rejects connections without a JWT", async () => {
    socket = connect();

    const reason = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("server did not disconnect the unauthenticated client")), 5000);
      socket!.on("disconnect", (r) => {
        clearTimeout(timer);
        resolve(r);
      });
      socket!.on("connect_error", (e) => {
        clearTimeout(timer);
        resolve(`connect_error:${e.message}`);
      });
    });

    expect(reason).toContain("io server disconnect");
  });

  it("reflects WEB_ORIGIN in Engine.IO CORS headers for allowed origins", async () => {
    const res = await fetch(`${API_URL}/socket.io/?EIO=4&transport=polling`, {
      headers: { Origin: "http://localhost:3000" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("does not echo disallowed cross-origin values in Engine.IO CORS headers", async () => {
    const res = await fetch(`${API_URL}/socket.io/?EIO=4&transport=polling`, {
      headers: { Origin: "http://evil.example" },
    });

    expect(res.headers.get("access-control-allow-origin")).not.toBe("http://evil.example");
  });

  it("accepts a connection with a valid JWT and keeps it open", async () => {
    const token = await adminToken();
    socket = connect(token);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("did not connect in time")), 5000);
      socket!.on("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      socket!.on("connect_error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
    });

    // The server must NOT kick an authenticated client
    const kicked = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 1500);
      socket!.on("disconnect", () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    expect(kicked).toBe(false);
  });
});
