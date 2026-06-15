const WANDBOX_BASE_URL = "https://wandbox.org/api";

const WANDBOX_COMPILERS = {
  c: "gcc-head-c",
  "c++": "gcc-head",
  java: "openjdk-jdk-22+36"
};

const SITEMAP_PATHS = [
  "/",
  "/blog.html",
  "/learn-python.html",
  "/python-variables.html",
  "/python-strings.html",
  "/python-lists.html",
  "/python-conditions.html",
  "/python-loops.html",
  "/python-functions.html",
  "/python-errors.html",
  "/python-projects.html",
  "/python-tips.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

function jsonResponse(statusCode, data) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function wandboxToResult(data) {
  const compilerOutput = data.compiler_message || "";
  const programOutput = [data.program_output, data.program_error]
    .filter(Boolean)
    .join("\n");
  const status = parseInt(data.status) || 0;
  const isCompileError = !!compilerOutput && !programOutput && status !== 0;

  return {
    compile: {
      output: isCompileError ? compilerOutput : "",
      code: isCompileError ? (status || 1) : 0,
    },
    run: {
      output: isCompileError ? "" : programOutput,
      code: isCompileError ? 0 : status,
    },
  };
}

async function handleExecute(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { message: "Invalid JSON." });
  }

  const language = (payload.language || "").toLowerCase();
  const files = payload.files || [];
  const code = files.length > 0 ? files[0].content : (payload.code || "");

  if (!code) {
    return jsonResponse(400, { message: "No code provided." });
  }

  const compiler = WANDBOX_COMPILERS[language];
  if (!compiler) {
    return jsonResponse(400, { message: `Unsupported language: ${language}` });
  }

  let codeToRun = code;
  if (language === "java") {
    codeToRun = code.replace(/\bpublic(\s+class\b)/g, "$1");
  }

  try {
    const response = await fetch(`${WANDBOX_BASE_URL}/compile.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compiler, code: codeToRun }),
    });

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse(502, {
        compile: { output: "", code: 0 },
        run: {
          output: `Execution service error (${response.status}): ${text}`,
          code: 1,
        },
      });
    }

    const data = await response.json();
    return jsonResponse(200, wandboxToResult(data));
  } catch (error) {
    return jsonResponse(502, {
      message: "The execution service could not be reached.",
      details: error && error.message ? error.message : String(error),
    });
  }
}

function handleRuntimes() {
  return jsonResponse(200, [
    { language: "c", version: "gcc-head" },
    { language: "c++", version: "gcc-head" },
    { language: "java", version: "22" },
  ]);
}

function handleRobotsTxt(origin) {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}

function handleSitemapXml(origin) {
  const urlTags = SITEMAP_PATHS.map(
    (p) => `  <url><loc>${origin}${p}</loc></url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const origin = url.origin;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (pathname === "/api/runtimes" && request.method === "GET") {
      return handleRuntimes();
    }

    if (pathname === "/api/execute" && request.method === "POST") {
      return handleExecute(request);
    }

    if (pathname === "/robots.txt") {
      return handleRobotsTxt(origin);
    }

    if (pathname === "/sitemap.xml") {
      return handleSitemapXml(origin);
    }

    return env.ASSETS.fetch(request);
  },
};
