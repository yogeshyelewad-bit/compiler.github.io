const WANDBOX_BASE_URL = "https://wandbox.org/api";

const WANDBOX_COMPILERS = {
  c: "gcc-head-c",
  "c++": "gcc-head",
  java: "openjdk-jdk-22+36"
};

exports.handler = async (event) => {
  const action = event.queryStringParameters?.action;

  if (event.httpMethod === "OPTIONS") {
    return buildResponse(204, "");
  }

  if (action === "runtimes") {
    if (event.httpMethod !== "GET") {
      return buildResponse(405, { message: "Runtimes requests must use GET." });
    }
    return buildResponse(200, [
      { language: "c", version: "gcc-head" },
      { language: "c++", version: "gcc-head" },
      { language: "java", version: "22" }
    ]);
  }

  if (action === "execute") {
    if (event.httpMethod !== "POST") {
      return buildResponse(405, { message: "Execute requests must use POST." });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return buildResponse(400, { message: "Invalid JSON." });
    }

    const language = (payload.language || "").toLowerCase();
    const files = payload.files || [];
    const code = files.length > 0 ? files[0].content : (payload.code || "");

    if (!code) {
      return buildResponse(400, { message: "No code provided." });
    }

    const compiler = WANDBOX_COMPILERS[language];
    if (!compiler) {
      return buildResponse(400, { message: `Unsupported language: ${language}` });
    }

    let codeToRun = code;
    if (language === "java") {
      // Wandbox saves files as prog.java; remove public from class declarations
      // so the class name doesn't need to match the filename.
      codeToRun = code.replace(/\bpublic(\s+class\b)/g, "$1");
    }

    try {
      const response = await fetch(`${WANDBOX_BASE_URL}/compile.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler, code: codeToRun })
      });

      if (!response.ok) {
        const text = await response.text();
        return buildResponse(502, {
          compile: { output: "", code: 0 },
          run: { output: `Execution service error (${response.status}): ${text}`, code: 1 }
        });
      }

      const data = await response.json();
      return buildResponse(200, wandboxToResult(data));
    } catch (error) {
      return buildResponse(502, {
        message: "The execution service could not be reached.",
        details: error && error.message ? error.message : String(error)
      });
    }
  }

  return buildResponse(400, { message: "Unknown action." });
};

function wandboxToResult(data) {
  const compilerOutput = data.compiler_message || "";
  const programOutput = [data.program_output, data.program_error]
    .filter(Boolean)
    .join("\n");
  const status = parseInt(data.status) || 0;

  // If there is compiler output but no program ran, it's a compile error.
  const isCompileError = !!compilerOutput && !programOutput && status !== 0;

  return {
    compile: {
      output: isCompileError ? compilerOutput : "",
      code: isCompileError ? (status || 1) : 0
    },
    run: {
      output: isCompileError ? "" : programOutput,
      code: isCompileError ? 0 : status
    }
  };
}

function buildResponse(statusCode, body, contentType = "application/json") {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Content-Type": contentType
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  };
}
