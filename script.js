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
const vizContainer = document.getElementById("vizContainer");

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

const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

revealItems.forEach((item) => observer.observe(item));

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
  const trimmed = code.trim();
  const lines = code.split("\n");

  if (!trimmed) {
    improvements.push("Start with a simple print statement like print('Hello') to test the compiler.");
  }

  if (!/print\s*\(/.test(code)) {
    improvements.push("Consider adding print() statements so users can clearly see the result of the program.");
  }

  if (!/#/.test(code)) {
    improvements.push("Add a short comment for important parts so beginners can understand the code faster.");
  }

  if (lines.length > 18) {
    improvements.push("Your code is getting longer. Splitting repeated logic into small functions will make it easier to maintain.");
  }

  if (/input\s*\(/.test(code)) {
    improvements.push("If you use input(), guide the user with a clear message so they know what to type.");
  }

  if (/while\s+True/.test(code)) {
    improvements.push("A while True loop should usually include a clear break condition so it does not run forever.");
  }

  if (/^[a-z]$/m.test(code)) {
    improvements.push("Very short variable names can be hard to read. Use names that describe the value more clearly.");
  }

  if (/except\s*:/.test(code)) {
    improvements.push("Avoid a blank except block. Catch a specific exception so debugging stays easier.");
  }

  if (/==\s*True|==\s*False/.test(code)) {
    improvements.push("You can simplify comparisons to True or False by checking the value directly.");
  }

  if (!hadError && improvements.length === 0) {
    improvements.push("Nice work. Your code looks clean for this run. You can improve it further by adding more meaningful test cases.");
  }

  return improvements.slice(0, 5);
}

function explainError(rawError) {
  const message = String(rawError || "");

  if (message.includes("SyntaxError")) {
    return "There is a syntax mistake in your code. This usually means Python found something written in the wrong format, like a missing colon, bracket, or quote.";
  }

  if (message.includes("IndentationError")) {
    return "Your indentation is not valid. Python uses spacing to understand blocks of code, so make sure lines inside functions, loops, and conditions are aligned properly.";
  }

  if (message.includes("NameError")) {
    return "Python found a name that does not exist yet. This often means a variable or function was used before it was created, or its spelling does not match.";
  }

  if (message.includes("TypeError")) {
    return "Two values are being used in an incompatible way. For example, you may be mixing text and numbers, or calling something that is not a function.";
  }

  if (message.includes("ZeroDivisionError")) {
    return "Your code tried to divide by zero. Python stops because dividing by zero is mathematically invalid.";
  }

  if (message.includes("IndexError")) {
    return "Your code tried to access a list position that does not exist. Check the list length and make sure the index is inside the valid range.";
  }

  if (message.includes("KeyError")) {
    return "Your code tried to use a dictionary key that is not available. Make sure the key exists before reading it.";
  }

  if (message.includes("ValueError")) {
    return "A value has the right type, but the content is not acceptable. This often happens when converting text into a number that is not valid.";
  }

  if (message.includes("ImportError") || message.includes("ModuleNotFoundError")) {
    return "Your code is trying to import a module that is not available in this browser runtime. Pyodide supports many Python modules, but not every package.";
  }

  return "Your code hit a runtime error. Read the error details below and check the line that caused the problem. A small fix in names, values, or structure will usually solve it.";
}

async function initializeRuntime() {
  try {
    pyodide = await loadPyodide();
    runtimeStatus.textContent = "Loading data analysis modules...";
    await pyodide.loadPackage(["numpy", "pandas", "matplotlib", "micropip"]);
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("seaborn")
`);
    runtimeReady = true;
    runtimeStatus.textContent = "Python runtime ready";
    runtimeStatus.classList.add("ready");
    outputConsole.textContent = "Python runtime loaded successfully. You can run code now.";
    runButton.disabled = false;
  } catch (error) {
    runtimeStatus.textContent = "Runtime failed to load";
    runtimeStatus.classList.add("error");
    outputConsole.textContent = `Unable to load Python runtime.\n${error}`;
    setHumanMessage(
      "The Python engine could not load. Make sure internet access is available because Pyodide is loaded from a CDN.",
      "error"
    );
    setImprovements([
      "Check your internet connection.",
      "Make sure the Pyodide CDN script is not blocked.",
      "Open the browser console if the problem continues."
    ]);
  }
}

async function runCode() {
  if (!runtimeReady) {
    setHumanMessage("The Python runtime is still loading. Please wait a moment and try again.", "neutral");
    return;
  }

  const code = codeInput.value;
  outputConsole.textContent = "Running Python code...";
  setHumanMessage("Running your code now.", "neutral");
  setImprovements(["Checking code quality and waiting for the program output..."]);

  pyodide.globals.set("user_code", code);

  const runner = `
import sys
import io
import traceback
import json

buffer = io.StringIO()
sys.stdout = buffer
sys.stderr = buffer
result = {"ok": True, "output": "", "error": "", "plots": []}

try:
    from js import window
    import builtins

    def browser_input(prompt_text=""):
        value = window.prompt(str(prompt_text))
        if value is None:
            raise EOFError("Input cancelled by user")
        return value

    safe_globals = {"__builtins__": dict(vars(builtins))}
    safe_globals["__builtins__"]["input"] = browser_input
    exec(user_code, safe_globals)
    try:
        import matplotlib.pyplot as plt
        import base64
        from io import BytesIO

        figure_numbers = plt.get_fignums()
        for fig_number in figure_numbers:
            fig = plt.figure(fig_number)
            chart_buffer = BytesIO()
            fig.savefig(chart_buffer, format="png", bbox_inches="tight")
            chart_buffer.seek(0)
            encoded = base64.b64encode(chart_buffer.read()).decode("utf-8")
            result["plots"].append(encoded)
        if figure_numbers:
            plt.close("all")
    except Exception:
        pass
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
    const plots = Array.isArray(result.plots) ? result.plots : [];
    const improvements = analyzeCode(code, !result.ok);

    renderPlots(plots);

    if (result.ok) {
      outputConsole.textContent = outputText || "Program finished successfully with no printed output.";
      setHumanMessage(
        "Your code ran successfully. If you want users to see more results, add more print() statements or clearer messages.",
        "success"
      );
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


function renderPlots(plots) {
  if (!vizContainer) return;
  vizContainer.innerHTML = "";

  if (!plots.length) {
    vizContainer.innerHTML = '<p class="viz-placeholder">No chart output for this run.</p>';
    return;
  }

  plots.forEach((plot, index) => {
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${plot}`;
    img.alt = `Generated chart ${index + 1}`;
    img.className = "viz-image";
    vizContainer.appendChild(img);
  });
}

function clearOutput() {
  outputConsole.textContent = "Console cleared. Run your Python code again.";
  setHumanMessage("Output cleared. You can run the code again whenever you are ready.", "neutral");
  setImprovements(["Try a new example, edit the current code, and click Run Python."]);
  if (vizContainer) {
    vizContainer.innerHTML = '<p class="viz-placeholder">Run code that uses matplotlib to preview charts here.</p>';
  }
}

function loadExample() {
  codeInput.value = starterCode;

  codeInput.focus();
  codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length);
  setHumanMessage("Sample Python code loaded. Click Run Python to test it.", "neutral");
  setImprovements([
    "Change the name value to see different output.",
    "Add another number into the list and rerun the code.",
    "Create a new function and print its result."
  ]);
}

function loadSelectedExampleCode() {
  const key = exampleSelect?.value || "starter";
  codeInput.value = samplePrograms[key] || starterCode;
  codeInput.focus();
  codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length);
  setHumanMessage("Selected example loaded. Click Run Python to execute it.", "neutral");
  setImprovements([
    "Modify one line and run again.",
    "Try adding your own print() outputs.",
    "Compare how each sample is structured."
  ]);
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeInput.value);
    setHumanMessage("Code copied to your clipboard.", "success");
    setImprovements([
      "Paste the code anywhere you want.",
      "Keep editing here and run it again whenever you need.",
      "Use sample code if you want a fresh starting point."
    ]);
  } catch (error) {
    setHumanMessage("Copy failed in this browser. You can still select the code manually.", "error");
  }
}

async function mountUploadedFiles() {
  if (!runtimeReady || !pyodide) {
    setHumanMessage("Runtime is not ready yet. Wait a moment and try attaching files again.", "error");
    return;
  }

  const files = Array.from(dataFileInput?.files || []);
  if (!files.length) {
    setHumanMessage("Please choose at least one dataset file first.", "neutral");
    return;
  }

  let mountedCount = 0;

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const targetPath = `/home/pyodide/data/${file.name}`;
      const dirPath = "/home/pyodide/data";

      try {
        pyodide.FS.mkdirTree(dirPath);
      } catch (_) {
        // directory may already exist
      }

      try {
        pyodide.FS.unlink(targetPath);
      } catch (_) {
        // file may not exist yet
      }

      pyodide.FS.writeFile(targetPath, bytes);
      mountedCount += 1;

      if (!uploadedDataFiles.includes(file.name)) {
        uploadedDataFiles.push(file.name);
      }
    } catch (error) {
      outputConsole.textContent = `Could not attach ${file.name}:\n${error}`;
    }
  }

  if (mountedCount > 0) {
    datasetHint.innerHTML = `Attached files: <code>${uploadedDataFiles.join("</code>, <code>")}</code>.<br>Use them in Python with paths like <code>/home/pyodide/data/your_file.csv</code>.`;
    setHumanMessage(`${mountedCount} dataset file(s) attached to Python successfully.`, "success");
    setImprovements([
      "Use pandas.read_csv('/home/pyodide/data/filename.csv') for CSV files.",
      "Use json.load(open('/home/pyodide/data/filename.json')) for JSON files.",
      "Print a preview to confirm the file loaded correctly."
    ]);
  }
}

if (exampleButton) {
  exampleButton.addEventListener("click", loadExample);
}
if (loadExampleHero) {
  loadExampleHero.addEventListener("click", loadExample);
}
if (runButton) {
  runButton.addEventListener("click", runCode);
}
if (clearButton) {
  clearButton.addEventListener("click", clearOutput);
}
if (copyButton) {
  copyButton.addEventListener("click", copyCode);
}
if (loadSelectedExample) {
  loadSelectedExample.addEventListener("click", loadSelectedExampleCode);
}
if (mountDataButton) {
  mountDataButton.addEventListener("click", mountUploadedFiles);
}

initializeRuntime();
