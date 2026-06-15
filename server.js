const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const PORT = 5000;
const JUDGE0_CE_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
const GCC_PATH = "/nix/store/kaj8d1zcn149m40s9h0xi0khakibiphz-gcc-wrapper-14.3.0/bin/gcc";
const GPP_PATH = "/nix/store/kaj8d1zcn149m40s9h0xi0khakibiphz-gcc-wrapper-14.3.0/bin/g++";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server kept alive):", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (server kept alive):", reason);
});

const JUDGE0_LANG_IDS = {
  java: 62,
};

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, Object.assign({ "Content-Type": "application/json" }, corsHeaders()));
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
  });
}

function spawnWithTimeout(cmd, args, opts, timeoutMs) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, opts);
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.stdout && proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr && proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout: "", stderr: err.message, exitCode: 1, timedOut: false });
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: timedOut ? -1 : (code || 0), timedOut });
    });
  });
}

async function executeCOrCpp(language, code) {
  const tmpId = crypto.randomBytes(8).toString("hex");
  const tmpDir = path.join(os.tmpdir(), `yby-${tmpId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const isC = language === "c";
  const srcFile = path.join(tmpDir, isC ? "main.c" : "main.cpp");
  const binFile = path.join(tmpDir, "main");

  fs.writeFileSync(srcFile, code);

  try {
    const compiler = isC ? GCC_PATH : GPP_PATH;
    const compileArgs = isC
      ? [srcFile, "-o", binFile, "-lm", "-std=c11", "-Wall"]
      : [srcFile, "-o", binFile, "-lm", "-std=c++17", "-Wall"];

    const compileResult = await spawnWithTimeout(compiler, compileArgs, {}, 15000);

    if (compileResult.exitCode !== 0) {
      return {
        compile: { output: compileResult.stderr, code: compileResult.exitCode },
        run: { output: "", code: 0 },
      };
    }

    const runResult = await spawnWithTimeout(binFile, [], { cwd: tmpDir }, 10000);

    const runOutput = runResult.timedOut
      ? "Time limit exceeded (10 seconds)."
      : (runResult.stdout + (runResult.stderr ? "\n" + runResult.stderr : ""));

    return {
      compile: { output: "", code: 0 },
      run: { output: runOutput, code: runResult.exitCode },
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function httpsPost(urlStr, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(urlStr);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, headers),
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (d) => { data += d; });
      res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

async function executeJava(code) {
  const langId = JUDGE0_LANG_IDS.java;
  const payload = JSON.stringify({ language_id: langId, source_code: code });

  const result = await httpsPost(JUDGE0_CE_URL, payload, {});
  const data = JSON.parse(result.body);

  const compileOut = data.compile_output || "";
  const stdout = data.stdout || "";
  const stderr = data.stderr || "";
  const statusId = data.status && data.status.id;

  const hasCompileError = statusId === 6 || compileOut;
  const runOutput = stdout + (stderr ? "\n" + stderr : "");

  return {
    compile: {
      output: compileOut,
      code: hasCompileError ? 1 : 0,
    },
    run: {
      output: runOutput,
      code: (statusId === 3) ? 0 : 1,
    },
  };
}

async function handleExecute(req, res) {
  const body = await readBody(req);
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return jsonResponse(res, 400, { message: "Invalid JSON payload." });
  }

  const language = (payload.language || "").toLowerCase().replace("c++", "cpp");
  const files = payload.files || [];
  const code = files.length > 0 ? files[0].content : (payload.code || "");

  if (!code) {
    return jsonResponse(res, 400, { message: "No code provided." });
  }

  try {
    let result;
    if (language === "c" || language === "cpp") {
      result = await executeCOrCpp(language, code);
    } else if (language === "java") {
      result = await executeJava(code);
    } else {
      return jsonResponse(res, 400, { message: `Unsupported language: ${language}` });
    }
    return jsonResponse(res, 200, result);
  } catch (err) {
    console.error("Execution error:", err.message);
    return jsonResponse(res, 502, {
      compile: { output: "", code: 0 },
      run: { output: `Execution service error: ${err.message}`, code: 1 },
    });
  }
}

function handleRuntimes(res) {
  const runtimes = [
    { language: "c", version: "14.3.0" },
    { language: "c++", version: "14.3.0" },
    { language: "java", version: "13.0.1" },
  ];
  jsonResponse(res, 200, runtimes);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (pathname === "/api/execute" && req.method === "POST") {
    await handleExecute(req, res);
    return;
  }

  if (pathname === "/api/runtimes" && req.method === "GET") {
    handleRuntimes(res);
    return;
  }

  if (pathname === "/.netlify/functions/piston-proxy") {
    const action = parsedUrl.query.action;
    if (action === "runtimes") {
      handleRuntimes(res);
      return;
    }
    if (action === "execute") {
      await handleExecute(req, res);
      return;
    }
    return jsonResponse(res, 400, { message: "Unknown action." });
  }

  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);

  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + ".html")) {
      filePath = filePath + ".html";
    } else {
      filePath = path.join(__dirname, "404.html");
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, "404.html"), (err2, data2) => {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end(data2 || "404 Not Found");
      });
      return;
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`YBY Compiler running at http://0.0.0.0:${PORT}`);
  console.log("  C/C++: GCC 14.3.0 (local)");
  console.log("  Java:  Judge0 CE (free API)");
  console.log("  Python: Pyodide (browser)");
});
