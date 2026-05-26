const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8000);
const adminKey = process.env.PORTFOLIO_ADMIN_KEY || "xxxxxxx";
const workspaceRoot = __dirname;
const dataDirectory = process.env.DATA_DIR || workspaceRoot;
const messagesFile = process.env.MESSAGES_FILE || path.join(dataDirectory, "messages.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  response.end(body);
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(response, 404, { error: "File not found." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*"
    });
    response.end(data);
  });
}

function resolveStaticPath(pathname) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const relativePath = path.normalize(decodeURIComponent(normalizedPath)).replace(/^(\.\.[/\\])+/, "");
  const candidatePath = path.resolve(workspaceRoot, "." + relativePath);

  if (!candidatePath.startsWith(workspaceRoot)) {
    return null;
  }

  if (!fs.existsSync(candidatePath)) {
    return null;
  }

  const stats = fs.statSync(candidatePath);
  if (!stats.isFile()) {
    return null;
  }

  return candidatePath;
}

function ensureMessagesFile() {
  fs.mkdirSync(path.dirname(messagesFile), { recursive: true });
  if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, "[]\n", "utf8");
  }
}

function readMessages() {
  ensureMessagesFile();
  const raw = fs.readFileSync(messagesFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeMessages(messages) {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2) + "\n", "utf8");
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handleApiRequest(request, response, pathname) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    response.end();
    return;
  }

  if (pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (pathname === "/api/contact" && request.method === "POST") {
    try {
      const rawBody = await collectRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const name = String(payload.name || "").trim();
      const email = String(payload.email || "").trim();
      const message = String(payload.message || "").trim();
      const source = String(payload.source || "portfolio").trim();

      if (!name || !email || !message) {
        sendJson(response, 400, {
          error: "Name, email, and message are required."
        });
        return;
      }

      if (!isValidEmail(email)) {
        sendJson(response, 400, {
          error: "Enter a valid email address."
        });
        return;
      }

      const messages = readMessages();
      const nextMessage = {
        id: Date.now(),
        name,
        email,
        message,
        source,
        created_at: new Date().toISOString()
      };

      messages.unshift(nextMessage);
      writeMessages(messages);

      sendJson(response, 201, {
        success: true,
        message: "Message saved successfully."
      });
      return;
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid request payload."
      });
      return;
    }
  }

  if (pathname === "/api/contact/messages" && request.method === "GET") {
    const providedKey = request.headers["x-admin-key"];

    if (providedKey !== adminKey) {
      sendJson(response, 401, {
        error: "Unauthorized. Inbox key is incorrect."
      });
      return;
    }

    const messages = readMessages();
    sendJson(response, 200, messages);
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${host}:${port}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApiRequest(request, response, pathname);
      return;
    }

    const staticFilePath = resolveStaticPath(pathname);
    if (staticFilePath) {
      sendFile(response, staticFilePath);
      return;
    }

    sendJson(response, 404, { error: "Page not found." });
  } catch (error) {
    sendJson(response, 500, { error: "Internal server error." });
  }
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    console.error(`The portfolio server is probably already running at http://${host}:${port}`);
    console.error("Open that URL in your browser, or stop the existing server before starting a new one.");
    process.exit(1);
  }

  throw error;
});

server.listen(port, host, () => {
  ensureMessagesFile();
  console.log(`Portfolio server running at http://${host}:${port}`);
  console.log(`Inbox key: ${adminKey}`);
});
