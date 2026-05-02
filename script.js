const starterCode = `# Welcome to YBY Compiler
# Write Python code and click "Run Python"

def greet(name):
    return f"Hello, {name}!"

user_name = input("Enter your name: ")
print(greet(user_name))

numbers = [4, 7, 9]
print("Total:", sum(numbers))
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

// Custom input modal refs
const inputModal = document.getElementById("inputModal");
const inputPromptText = document.getElementById("inputPromptText");
const inputModalField = document.getElementById("inputModalField");
const inputSubmitBtn = document.getElementById("inputSubmitBtn");
const inputCancelBtn = document.getElementById("inputCancelBtn");

let pyodide;
let runtimeReady = false;
let uploadedDataFiles = [];
let pendingInputResolver = null;

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
  const improvements = [];
  if (!/print\s*\(/.test(code)) improvements.push("Consider adding print() statements for clearer output.");
  if (!/#/.test(code)) improvements.push("Add comments to explain key logic.");
  if (/while\s+True/.test(code)) improvements.push("Ensure while True loops include a break condition.");
  if (!hadError && improvements.length === 0) improvements.push("Nice run. Add extra test cases for confidence.");
  return improvements.slice(0, 5);
}

function explainError(rawError) {
  const message = String(rawError || "");
  if (message.includes("SyntaxError")) return "Syntax mistake found. Check colons, brackets, or quotes.";
  if (message.includes("IndentationError")) return "Indentation is invalid. Align code blocks properly.";
  if (message.includes("NameError")) return "A variable/function name is undefined or misspelled.";
  if (message.includes("TypeError")) return "Incompatible data types were used together.";
  if (message.includes("EOFError")) return "Input was cancelled.";
  if (message.includes("ImportError") || message.includes("ModuleNotFoundError")) return "Module not available in this browser runtime.";
  return "Runtime error occurred. Read traceback in output.";
}

// ---------- Custom Input Modal ----------
function askInputFromModal(promptText = "Enter input:") {
  return new Promise((resolve, reject) => {
    pendingInputResolver = { resolve, reject };
    inputPromptText.textContent = promptText || "Enter input:";
    inputModalField.value = "";
    inputModal.classList.remove("hidden");
    inputModal.setAttribute("aria-hidden", "false");
    inputModalField.focus();
  });
}

function closeInputModal() {
  inputModal.classList.add("hidden");
  inputModal.setAttribute("aria-hidden", "true");
}

inputSubmitBtn?.addEventListener("click", () => {
  if (!pendingInputResolver) return;
  pendingInputResolver.resolve(inputModalField.value);
  pendingInputResolver = null;
  closeInputModal();
});

inputCancelBtn?.addEventListener("click", () => {
  if (!pendingInputResolver) return;
  pendingInputResolver.reject(new Error("Input cancelled by user"));
  pendingInputResolver = null;
  closeInputModal();
});

inputModalField?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") inputSubmitBtn.click();
});
// ---------------------------------------

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
    setHumanMessage("The Python engine could not load. Check internet/CDN access.", "error");
    setImprovements([
      "Check internet connection.",
      "Ensure jsDelivr is not blocked.",
      "Open browser console for details."
    ]);
  }
}

async function runCode() {
  if (!runtimeReady) {
    setHumanMessage("Runtime still loading. Please wait.", "neutral");
    return;
  }

  const code = codeInput.value;
  outputConsole.textContent = "Running Python code...";
  setHumanMessage("Running your code now.", "neutral");
  setImprovements(["Executing and collecting output..."]);

  pyodide.globals.set("user_code", code);
  pyodide.globals.set("js_request_input", askInputFromModal);

  const runner = `
import sys
import io
import traceback
import json
import builtins
import asyncio

buffer = io.StringIO()
sys.stdout = buffer
sys.stderr = buffer
result = {"ok": True, "output": "", "error": ""}

async def browser_input_async(prompt_text=""):
    value = await js_request_input(str(prompt_text))
    return value

def browser_input(prompt_text=""):
    return asyncio.get_event_loop().run_until_complete(browser_input_async(prompt_text))

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
    const improvements = analyzeCode(code, !result.ok);

    if (result.ok) {
      outputConsole.textContent = outputText || "Program finished successfully with no printed output.";
      setHumanMessage("Your code ran successfully.", "success");
    } else {
      outputConsole.textContent = `${outputText}${outputText ? "\n" : ""}${errorText}`.trim();
      setHumanMessage(explainError(errorText), "error");
    }

    setImprovements(improvements);
  } catch (error) {
    outputConsole.textContent = String(error);
    setHumanMessage(explainError(error), "error");
    setImprovements(analyzeCode(code, true));
  }
}

function clearOutput() {
  outputConsole.textContent = "Console cleared. Run your Python code again.";
  setHumanMessage("Output cleared.", "neutral");
  setImprovements(["Try editing and rerunning your code."]);
}

function loadExample() {
  codeInput.value = starterCode;
  codeInput.focus();
  codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length);
  setHumanMessage("Sample code loaded. Click Run Python.", "neutral");
  setImprovements([
    "Change the prompt text.",
    "Add new variables and print them.",
    "Try a loop with condition."
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
    "Use: import pandas as pd",
    "Load: pd.read_csv('/home/pyodide/data/file.csv')",
    "Check: df.head(), df.info()"
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
