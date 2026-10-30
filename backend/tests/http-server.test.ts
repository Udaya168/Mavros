import { request as httpRequest } from "node:http";

import { describe, expect, it } from "vitest";

import { createBackendServer } from "../server.js";

function sendRequest(
  server: ReturnType<typeof createBackendServer>,
  path: string,
  method = "GET",
  origin?: string,
) {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server is not listening.");

  return new Promise<{
    statusCode: number;
    headers: Record<string, string | string[] | undefined>;
    body: string;
  }>(
    (resolve, reject) => {
      const requestHeaders = origin ? { Origin: origin } : undefined;
      const clientRequest = httpRequest(
        { hostname: "127.0.0.1", port: address.port, path, method, headers: requestHeaders },
        (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => {
            body += chunk;
          });
          response.on("end", () =>
            resolve({ statusCode: response.statusCode ?? 0, headers: response.headers, body }),
          );
        },
      );
      clientRequest.on("error", reject);
      clientRequest.end();
    },
  );
}

describe("standalone backend HTTP server", () => {
  it("serves health and allows the configured frontend origin", async () => {
    const server = createBackendServer({ port: 0, frontendOrigin: "http://localhost:5173" });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    try {
      const response = await sendRequest(server, "/health", "GET", "http://localhost:5173");
      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
      expect(JSON.parse(response.body)).toEqual({ status: "ok", service: "mavros-backend" });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("rejects an unapproved origin", async () => {
    const server = createBackendServer({ port: 0, frontendOrigin: "http://localhost:5173" });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    try {
      const response = await sendRequest(server, "/health", "GET", "http://localhost:3000");
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toEqual({ error: "Origin is not allowed." });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("returns a JSON 404 for unsupported methods and paths", async () => {
    const server = createBackendServer({ port: 0, frontendOrigin: "http://localhost:5173" });
    await new Promise<void>((resolve) => server.listen(0, resolve));

    try {
      const unsupportedMethod = await sendRequest(server, "/health", "POST");
      expect(unsupportedMethod.statusCode).toBe(404);
      expect(JSON.parse(unsupportedMethod.body)).toEqual({ error: "Not found." });

      const missingPath = await sendRequest(server, "/missing");
      expect(missingPath.statusCode).toBe(404);
      expect(JSON.parse(missingPath.body)).toEqual({ error: "Not found." });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
