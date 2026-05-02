const starterCode = `# Welcome to YBY Compiler
# Write Python code and click "Run Python"

def greet(name):
    return f"Hello, {name}!"

user_name = input("Enter your name: ")
print(greet(user_name))
`;

const codeInput = document.getElementById("codeInput");
const outputConsole = document.getElementById("outputConsole");
const humanMessage = document.getElementById("humanMessage");
const improvementList = document.getElementById("improvementList");
const runtimeStatus = document.getElementById("runtimeStatus");
const runButton = document.getElementById("runButton");
const clearButton = document.getElementById("clearButton");
const exampleButton = document.getElementById("exampleButton");
const loadExampleHero = document.getElementById("loadExampleHero");
const copyButton = document.getElementById("copyButton");

const dataFileInput = document.getElementById("dataFileInput");
const mountDataButton = document.getElementById("mountDataButton");
const datasetHint = document.getElementById("datasetHint");

let pyodide;
let runtimeReady = false;
let uploadedDataFiles = [];

codeInput.value = starterCode;

function setHumanMessage(text, tone = "neutral") {
  humanMessage.textContent = text;
  humanMessage.className = `message-box ${tone}`;
}

function setImprovements(items) {
  improvementList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    improvementList.appendChild(li);
  });
}

function analyzeCode(code, hadError) {
  const tips = [];
  if (!/print\s*\(/.test(code)) tips.push("Add print() so output is visible.");
  if (!/#/.test(code)) tips.push("Add comments for important logic.");
  if (/while\s+True/.test(code)) tips.push("Ensure while True loops include a break condition.");
  if (!hadError && tips.length === 0) tips.push("Great run. Add more test cases to verify behavior.");
  return tips.slice(0, 5);
}

function explainError(rawError) {
  const message = String(rawError || "");
  if (message.includes("SyntaxError")) return "Syntax error: check brackets, colons, or quotes.";
  if (message.includes("IndentationError")) return "Indentation error: align code blocks correctly.";
  if (message.includes("NameError")) return "Name error: undefined variable/function or typo.";
  if (message.includes("TypeError")) return "Type error: incompatible data types used together.";
  if (message.includes("EOFError")) return "Input was cancelled by the user.";
  return "Runtime error occurred. Check details in the output console.";
}

async function initializeRuntime() {
  try {
    pyodide = await loadPyodide();
    runtimeReady = true;
    runtimeStatus.textContent = "Python runtime ready";
    runtimeStatus.classList.add("ready");
    outputConsole.textContent = "Python runtime loaded successfully. You can run code now.";
    runButton.disabled = false;
  } catch (error) {
    runtimeStatus.textContent = "Runtime failed to load";
    runtimeStatus.classList.add("error");
    outputConsole.textContent = `Unable to load Python runtime.\n${error}`;
    setHumanMessage("Could not load Python runtime. Check internet access.", "error");
    setImprovements([
      "Check internet connection.",
      "Ensure jsdelivr/CDN is accessible.",
      "Open browser console for details."
    ]);
  }
}

async function runCode() {
  if (!runtimeReady) {
    setHumanMessage("Runtime still loading. Please wait and try again.", "neutral");
    return;
  }

  const code = codeInput.value;
  outputConsole.textContent = "Running Python code...";
  setHumanMessage("Running your code now.", "neutral");
  setImprovements(["Executing code and gathering output..."]);

  pyodide.globals.set("user_code", code);

  const runner = `
import sys
import io
import traceback
import json
import builtins
from js import window

buffer = io.StringIO()
sys.stdout = buffer
sys.stderr = buffer
result = {"ok": True, "output": "", "error": ""}

def browser_input(prompt_text=""):
    value = window.prompt(str(prompt_text))
    if value is None:
        raise EOFError("Input cancelled by user")
    return value

try:
    safe_globals = {"__builtins__": dict(vars(builtins))}
    safe_globals["__builtins__"]["input"] = browser_input
    exec(user_code, safe_globals)
except Exception:
    result["ok"] = False
    result["error"] = traceback.format_exc()
finally:
    result["output"] = buffer.getvalue()
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__

json.dumps(result)
`;

  try {
    const rawResult = await pyodide.runPythonAsync(runner);
    const result = JSON.parse(rawResult);
    const outputText = result.output || "";
    const errorText = result.error || "";

    if (result.ok) {
      outputConsole.textContent = outputText || "Program finished successfully with no printed output.";
      setHumanMessage("Your code ran successfully.", "success");
    } else {
      outputConsole.textContent = `${outputText}${outputText ? "\n" : ""}${errorText}`.trim();
      setHumanMessage(explainError(errorText), "error");
    }

    setImprovements(analyzeCode(code, !result.ok));
  } catch (error) {
    outputConsole.textContent = String(error);
    setHumanMessage(explainError(error), "error");
    setImprovements(analyzeCode(code, true));
  }
}

function clearOutput() {
  outputConsole.textContent = "Console cleared. Run your Python code again.";
  setHumanMessage("Output cleared.", "neutral");
  setImprovements(["Try editing the code and run again."]);
}

function loadExample() {
  codeInput.value = starterCode;
  codeInput.focus();
  codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length);
  setHumanMessage("Sample code loaded.", "neutral");
  setImprovements([
    "Change input prompt text.",
    "Add extra print output.",
    "Create another function."
  ]);
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeInput.value);
    setHumanMessage("Code copied to clipboard.", "success");
  } catch {
    setHumanMessage("Copy failed in this browser.", "error");
  }
}

async function mountUploadedFiles() {
  if (!runtimeReady || !pyodide) {
    setHumanMessage("Runtime is not ready yet.", "error");
    return;
  }

  const files = Array.from(dataFileInput?.files || []);
  if (files.length === 0) {
    setHumanMessage("Choose at least one file first.", "neutral");
    return;
  }

  const baseDir = "/home/pyodide/data";
  pyodide.FS.mkdirTree(baseDir);

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    pyodide.FS.writeFile(`${baseDir}/${safeName}`, bytes);
  }

  uploadedDataFiles = files.map((f) => f.name.replace(/[^a-zA-Z0-9._-]/g, "_"));
  pyodide.globals.set("uploaded_data_files", uploadedDataFiles);

  outputConsole.textContent =
    `Attached ${uploadedDataFiles.length} file(s):\n` +
    uploadedDataFiles.map((n) => `- ${n}`).join("\n");

  setHumanMessage("Dataset files attached. Use pandas with /home/pyodide/data/<filename>.", "success");
  setImprovements([
    "Try: import pandas as pd",
    "Load file with pd.read_csv('/home/pyodide/data/file.csv')",
    "Inspect with df.head() and df.info()"
  ]);
}

function bindClick(element, handler) {
  if (element) element.addEventListener("click", handler);
}

bindClick(runButton, runCode);
bindClick(clearButton, clearOutput);
bindClick(exampleButton, loadExample);
bindClick(copyButton, copyCode);
bindClick(mountDataButton, mountUploadedFiles);
bindClick(loadExampleHero, () => {
  loadExample();
  document.getElementById("compiler")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

if (dataFileInput && datasetHint) {
  dataFileInput.addEventListener("change", () => {
    const count = dataFileInput.files?.length || 0;
    datasetHint.textContent = count
      ? `${count} file(s) selected. Click "Attach to Python" to mount them.`
      : "Uploaded files are available in Python at /home/pyodide/data/filename.";
  });
}

document.addEventListener("keydown", (event) => {
  const isRunShortcut = (event.ctrlKey || event.metaKey) && event.key === "Enter";
  if (isRunShortcut) {
    event.preventDefault();
    runCode();
  }
});

window.addEventListener("load", () => {
  initializeRuntime();
});
