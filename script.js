const starterCode = `# Welcome to YBY Compiler
# Write Python code and click "Run Python"

def greet(name):
    return f"Hello, {name}!"

user_name = "YBY user"
message = greet(user_name)
print(message)

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
const exampleSelect = document.getElementById("exampleSelect");
const loadSelectedExample = document.getElementById("loadSelectedExample");
const dataFileInput = document.getElementById("dataFileInput");
const mountDataButton = document.getElementById("mountDataButton");
const datasetHint = document.getElementById("datasetHint");

let pyodide;
let runtimeReady = false;
let uploadedDataFiles = [];

codeInput.value = starterCode;

const samplePrograms = {
  starter: starterCode,
  loop: `# Loop and condition example

for number in range(1, 6):
    if number % 2 == 0:
        print(number, "is even")
    else:
        print(number, "is odd")
`,
  function: `# Function + list example

def average(values):
    return sum(values) / len(values)

scores = [76, 88, 91, 84]
print("Average:", average(scores))
`
};

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

function explainError(rawError) {
  const message = String(rawError || "");
  if (message.includes("SyntaxError")) return "Syntax mistake found.";
  if (message.includes("IndentationError")) return "Indentation is invalid.";
  if (message.includes("NameError")) return "Undefined name used.";
  if (message.includes("TypeError")) return "Incompatible type usage.";
  if (message.includes("EOFError")) return "Input cancelled by user.";
  return "Runtime error occurred.";
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
    setHumanMessage("Python engine could not load.", "error");
  }
}

async function runCode() {
  if (!runtimeReady) {
    setHumanMessage("Runtime still loading. Please wait.", "neutral");
    return;
  }

  const code = codeInput.value;
  outputConsole.textContent = "Running Python code...";
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

try:
    def browser_input(prompt_text=""):
        value = window.prompt(str(prompt_text))
        if value is None:
            raise EOFError("Input cancelled by user")
        return value

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

    if (result.ok) {
      outputConsole.textContent = result.output || "Program finished successfully with no printed output.";
      setHumanMessage("Code ran successfully.", "success");
    } else {
      outputConsole.textContent = `${result.output || ""}\n${result.error || ""}`.trim();
      setHumanMessage(explainError(result.error), "error");
    }
  } catch (error) {
    outputConsole.textContent = String(error);
    setHumanMessage(explainError(error), "error");
  }
}

function clearOutput() {
  outputConsole.textContent = "Console cleared. Run your Python code again.";
  setHumanMessage("Output cleared.", "neutral");
  setImprovements(["Try a new example and run it."]);
}

function loadExample() {
  codeInput.value = starterCode;
  codeInput.focus();
  codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length);
  setHumanMessage("Sample code loaded.", "neutral");
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

  outputConsole.textContent = `Attached ${uploadedDataFiles.length} file(s):\n${uploadedDataFiles.map((n) => `- ${n}`).join("\n")}`;
  setHumanMessage("Dataset files attached to Python runtime.", "success");
}

function bindClick(el, fn) {
  if (el) el.addEventListener("click", fn);
}

bindClick(runButton, runCode);
bindClick(clearButton, clearOutput);
bindClick(exampleButton, loadExample);
bindClick(loadSelectedExample, () => {
  const key = exampleSelect?.value || "starter";
  codeInput.value = samplePrograms[key] || starterCode;
});
bindClick(loadExampleHero, loadExample);
bindClick(copyButton, copyCode);
bindClick(mountDataButton, mountUploadedFiles);

if (dataFileInput && datasetHint) {
  dataFileInput.addEventListener("change", () => {
    const count = dataFileInput.files?.length || 0;
    datasetHint.textContent = count
      ? `${count} file(s) selected. Click "Attach to Python" to mount them.`
      : "Uploaded files are available in Python at /home/pyodide/data/filename.";
  });
}

window.addEventListener("load", initializeRuntime);
