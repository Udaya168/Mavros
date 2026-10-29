import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 3001;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173";

interface BackendConfig {
  port: number;
  frontendOrigin: string;
}

function getConfig(env: NodeJS.ProcessEnv = process.env): BackendConfig {
  const portValue = env["PORT"] ?? String(DEFAULT_PORT);
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const frontendOrigin = env["FRONTEND_ORIGIN"] ?? DEFAULT_FRONTEND_ORIGIN;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(frontendOrigin);
  } catch {
    throw new Error("FRONTEND_ORIGIN must be a valid absolute URL.");
  }
  if (!["http:", "https:"].includes(parsedOrigin.protocol) || parsedOrigin.pathname !== "/") {
    throw new Error("FRONTEND_ORIGIN must contain only an HTTP(S) origin.");
  }

  return { port, frontendOrigin: parsedOrigin.origin };
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>) {
  const payload = JSON.stringify(body);
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Length", Buffer.byteLength(payload));
  response.end(payload);
}

function applyCors(request: IncomingMessage, response: ServerResponse, frontendOrigin: string) {
  const requestOrigin = request.headers.origin;
  if (requestOrigin === undefined) return true;
  if (requestOrigin !== frontendOrigin) {
    sendJson(response, 403, { error: "Origin is not allowed." });
    return false;
  }
  response.setHeader("Access-Control-Allow-Origin", frontendOrigin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return true;
}

export function createBackendServer(config: BackendConfig = getConfig()): Server {
  return createServer((request, response) => {
    if (!applyCors(request, response, config.frontendOrigin)) return;

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (request.method === "GET" && requestUrl.pathname === "/health") {
      sendJson(response, 200, { status: "ok", service: "mavros-backend" });
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  });
}

export function startBackendServer(): Server {
  const config = getConfig();
  const server = createBackendServer(config);

  server.once("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Backend port ${config.port} is already in use.`);
    } else {
      console.error("Backend server failed:", error.message);
    }
    process.exitCode = 1;
  });

  server.listen(config.port, () => {
    console.log(`Mavros backend listening on http://localhost:${config.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}; shutting down backend.`);
    server.close((error) => {
      if (error) {
        console.error("Backend shutdown failed:", error.message);
        process.exitCode = 1;
      }
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startBackendServer();
}
