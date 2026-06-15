/* ==========================================================
   YBY COMPILER
   PART 1
   Core setup, examples, DOM bindings, runtime utilities
   ========================================================== */

"use strict";

/* ==========================================================
   EXAMPLES
   ========================================================== */

const samplePrograms = {
  python: {
    starter: `print("Hello from YBY Compiler!")
print("Welcome to Python!")

name = "YBY"
version = 3.12
print(f"Running Python {version} on {name} Compiler")`,

  loop: `for i in range(1, 6):
    print(f"Step {i}: value = {i * i}")

total = sum(range(1, 101))
print(f"\\nSum of 1 to 100 = {total}")`,

  function: `def average(values):
    """Return the mean of a list of numbers."""
    return sum(values) / len(values)

def grade(score):
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    return "F"

scores = [76, 88, 91, 84, 95, 72]
avg = average(scores)
print(f"Scores: {scores}")
print(f"Average: {avg:.1f} → Grade: {grade(avg)}")`,

  dataframe: `import pandas as pd
import numpy as np

data = {
    "name": ["Ava", "Ben", "Mia", "Leo", "Zoe"],
    "score": [92, 84, 89, 76, 95],
    "grade": ["A", "B", "B", "C", "A"]
}

df = pd.DataFrame(data)
print("=== Student Results ===")
print(df.to_string(index=False))
print(f"\\nClass average: {df['score'].mean():.1f}")
print(f"Top scorer: {df.loc[df['score'].idxmax(), 'name']}")
print(f"\\nGrade distribution:")
print(df['grade'].value_counts().to_string())`,

  chart: `import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(1, 2, figsize=(10, 4))

# Line chart
x = np.linspace(0, 2 * np.pi, 100)
axes[0].plot(x, np.sin(x), label="sin(x)", color="#ff7a18")
axes[0].plot(x, np.cos(x), label="cos(x)", color="#93f5a7")
axes[0].set_title("Sine & Cosine")
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# Bar chart
categories = ["Jan", "Feb", "Mar", "Apr", "May"]
values = [42, 58, 73, 61, 85]
axes[1].bar(categories, values, color="#ff7a18", alpha=0.8)
axes[1].set_title("Monthly Sales")
axes[1].set_ylabel("Units")

plt.tight_layout()
plt.show()`,

  seaborn: `import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

np.random.seed(42)
df = pd.DataFrame({
    "hours_studied": np.random.uniform(1, 10, 50),
    "score": np.random.uniform(40, 100, 50),
    "subject": np.random.choice(["Math", "Science", "English"], 50)
})

plt.figure(figsize=(8, 5))
sns.scatterplot(
    data=df,
    x="hours_studied",
    y="score",
    hue="subject",
    palette="Set2",
    s=80
)
plt.title("Study Hours vs Score")
plt.xlabel("Hours Studied")
plt.ylabel("Test Score")
plt.tight_layout()
plt.show()`,

  sklearn: `from sklearn.linear_model import LinearRegression
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(0)
X = np.random.rand(50, 1) * 10
y = 2.5 * X.ravel() + np.random.randn(50) * 3

model = LinearRegression()
model.fit(X, y)

x_line = np.linspace(0, 10, 100).reshape(-1, 1)
y_pred = model.predict(x_line)

plt.figure(figsize=(7, 4))
plt.scatter(X, y, color="#ff7a18", alpha=0.7, label="Data points")
plt.plot(x_line, y_pred, color="#93f5a7", linewidth=2, label=f"Fit: y={model.coef_[0]:.2f}x+{model.intercept_:.2f}")
plt.title("Linear Regression with scikit-learn")
plt.xlabel("X"); plt.ylabel("y")
plt.legend(); plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

print(f"Slope: {model.coef_[0]:.4f}")
print(f"Intercept: {model.intercept_:.4f}")
print(f"R² score: {model.score(X, y):.4f}")`,

  upload: `import pandas as pd

df = pd.read_csv("/home/pyodide/data/sample.csv")
print("Shape:", df.shape)
print("\\nFirst 5 rows:")
print(df.head().to_string())
print("\\nColumn types:")
print(df.dtypes.to_string())
print("\\nBasic stats:")
print(df.describe().to_string())`
  },

  c: {
    starter: `#include <stdio.h>

int main(void) {
    printf("Hello from YBY Compiler!\\n");
    return 0;
}`,
    loop: `#include <stdio.h>

int main(void) {
    for (int i = 1; i <= 5; i++) {
        printf("%d\\n", i);
    }
    return 0;
}`
  },

  cpp: {
    starter: `#include <iostream>

int main() {
    std::cout << "Hello from YBY Compiler!" << std::endl;
    return 0;
}`,
    loop: `#include <iostream>

int main() {
    for (int i = 1; i <= 5; i++) {
        std::cout << i << std::endl;
    }
    return 0;
}`
  },

  java: {
    starter: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from YBY Compiler!");
    }
}`,
    loop: `public class Main {
    public static void main(String[] args) {
        for (int i = 1; i <= 5; i++) {
            System.out.println(i);
        }
    }
}`
  }
};

/* ==========================================================
   LANGUAGE CONFIG
   ========================================================== */

const languageConfig = {
  python: {
    fileName: "main.py",
    apiLanguage: "python",
    apiVersion: "3.12.0",
    hint:
      "Python runs directly in your browser via Pyodide. Supports matplotlib, seaborn, pandas, NumPy, scikit-learn, and file uploads."
  },

  c: {
    fileName: "main.c",
    apiLanguage: "c",
    apiVersion: "10.2.0",
    hint:
      "C compiles and runs via a free cloud API. Internet connection required. All standard library features supported."
  },

  cpp: {
    fileName: "main.cpp",
    apiLanguage: "c++",
    apiVersion: "10.2.0",
    hint:
      "C++ compiles and runs via a free cloud API. Internet connection required. STL and standard headers supported."
  },

  java: {
    fileName: "Main.java",
    apiLanguage: "java",
    apiVersion: "15.0.2",
    hint:
      "Java compiles and runs via a free cloud API. Use 'public class Main' as your class name. Internet connection required."
  }
};

/* ==========================================================
   ENDPOINTS
   ========================================================== */

const remoteExecutionEndpoints = [
  {
    name: "YBY Server",
    executeUrl: "/api/execute",
    runtimesUrl: "/api/runtimes"
  },
  {
    name: "YBY Proxy Fallback",
    executeUrl: "/.netlify/functions/piston-proxy?action=execute",
    runtimesUrl: "/.netlify/functions/piston-proxy?action=runtimes"
  }
];

/* ==========================================================
   DOM
   ========================================================== */

const codeInput =
  document.getElementById("codeInput");

const outputConsole =
  document.getElementById("outputConsole");

const humanMessage =
  document.getElementById("humanMessage");

const improvementList =
  document.getElementById("improvementList");

const runtimeStatus =
  document.getElementById("runtimeStatus");

const runButton =
  document.getElementById("runButton");

const clearButton =
  document.getElementById("clearButton");

const exampleButton =
  document.getElementById("exampleButton");

const exampleSelect =
  document.getElementById("exampleSelect");

const loadSelectedExample =
  document.getElementById("loadSelectedExample");

const loadExampleHero =
  document.getElementById("loadExampleHero");

const copyButton =
  document.getElementById("copyButton");

const languageSelect =
  document.getElementById("languageSelect");

const languageHint =
  document.getElementById("languageHint");

const editorFileName =
  document.getElementById("editorFileName");

const dataFileInput =
  document.getElementById("dataFileInput");

const mountDataButton =
  document.getElementById("mountDataButton");

const datasetHint =
  document.getElementById("datasetHint");

const uploadedList =
  document.getElementById("uploadedList");

const vizContainer =
  document.getElementById("vizContainer");

/* ==========================================================
   STATE
   ========================================================== */

let currentLanguage = "python";

let pyodide = null;

let pythonRuntimePromise = null;

let runtimeReady = false;

let activeRun = false;

let selectedFiles = [];

let mountedFiles = [];

const loadedPythonPackages =
  new Set();

const resolvedRemoteVersions =
  {};

/* ==========================================================
   STATUS HELPERS
   ========================================================== */

function setRuntimeStatus(
  text,
  state = "neutral"
) {
  if (!runtimeStatus) {
    return;
  }

  runtimeStatus.textContent = text;
  runtimeStatus.className =
    `status-pill ${state}`;
}

function setHumanMessage(
  text,
  tone = "neutral"
) {
  if (!humanMessage) {
    return;
  }

  humanMessage.textContent = text;
  humanMessage.className =
    `message-box ${tone}`;
}

function setImprovements(items) {
  if (!improvementList) {
    return;
  }

  improvementList.innerHTML = "";

  items.forEach(item => {
    const li =
      document.createElement("li");

    li.textContent = item;

    improvementList.appendChild(li);
  });
}

/* ==========================================================
   GENERIC HELPERS
   ========================================================== */

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function escapeHtml(str) {
  const div =
    document.createElement("div");

  div.textContent = str;

  return div.innerHTML;
}

function clearVisualization() {
  if (!vizContainer) {
    return;
  }

  vizContainer.innerHTML =
    `<p class="viz-placeholder">
       Run Python code that creates charts.
     </p>`;
}

function resetOutput() {
  if (outputConsole) {
    outputConsole.textContent = "";
  }
  clearVisualization();
}

/* ==========================================================
   SCRIPT LOADER
   ========================================================== */

function loadScript(src) {
  return new Promise(
    (resolve, reject) => {

      const existing =
        document.querySelector(
          `script[src="${src}"]`
        );

      if (existing) {
        resolve();
        return;
      }

      const script =
        document.createElement("script");

      script.src = src;

      script.async = true;

      script.onload = resolve;

      script.onerror = () =>
        reject(
          new Error(
            `Failed to load ${src}`
          )
        );

      document.head.appendChild(
        script
      );
    }
  );
}

function withTimeout(
  promise,
  timeoutMs,
  message
) {
  let timeoutId;

  const timeout =
    new Promise((_, reject) => {

      timeoutId =
        setTimeout(
          () =>
            reject(
              new Error(message)
            ),
          timeoutMs
        );
    });

  return Promise.race([
    promise,
    timeout
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/* ==========================================================
   PYODIDE LOADER
   ========================================================== */

async function waitForPyodideLoader() {

  if (window.loadPyodide) {
    return;
  }

  const cdns = [
    "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js",
    "https://cdn.pyodide.org/v0.26.4/full/pyodide.js"
  ];

  let lastError = null;

  for (const url of cdns) {

    try {

      await withTimeout(
        loadScript(url),
        15000,
        `${url} timeout`
      );

      if (
        window.loadPyodide
      ) {
        return;
      }

    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Pyodide loader unavailable"
    )
  );
}

/* ==========================================================
   LOAD PYODIDE
   ========================================================== */

async function loadPyodideRuntime() {

  const cdns = [
    "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    "https://cdn.pyodide.org/v0.26.4/full/"
  ];

  let lastError = null;

  for (const indexURL of cdns) {

    try {

      return await withTimeout(
        window.loadPyodide({
          indexURL
        }),
        30000,
        "Pyodide load timeout"
      );

    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Unable to load Pyodide"
    )
  );
}

/* ==========================================================
   INITIALIZE PYTHON
   ========================================================== */

async function initializePythonRuntime() {

  if (pythonRuntimePromise) {
    return pythonRuntimePromise;
  }

  pythonRuntimePromise = startPythonRuntime();

  return pythonRuntimePromise;
}

async function startPythonRuntime() {
   
  setRuntimeStatus(
    "Loading Python runtime..."
  );

  try {

    await waitForPyodideLoader();

    pyodide =
      await loadPyodideRuntime();

    await pyodide.runPythonAsync(`
import os
os.makedirs(
"/home/pyodide/data",
exist_ok=True
)
`);

    runtimeReady = true;

    setRuntimeStatus(
      "Python runtime ready",
      "ready"
    );

    if (runButton) {
      runButton.disabled =
        false;
    }

    setHumanMessage(
      "Python runtime loaded successfully.",
      "success"
    );

  } catch (error) {

    runtimeReady = false;

    setRuntimeStatus(
      "Runtime failed",
      "error"
    );

    if (outputConsole) {
      outputConsole.textContent =
        error.message;
    }

    setHumanMessage(
      "Could not load Pyodide.",
      "error"
    );

    pythonRuntimePromise = null;
  }
}
/* ==========================================================
   FILE MANAGEMENT
   ========================================================== */

function refreshUploadedFilesUI() {

  if (!selectedFiles.length) {

    uploadedList.innerHTML =
      "<li>No files selected yet.</li>";

    return;
  }

  uploadedList.innerHTML = "";

  selectedFiles.forEach(file => {

    const li =
      document.createElement("li");

    const size =
      (file.size / 1024).toFixed(1);

    li.textContent =
      `${file.name} (${size} KB)`;

    uploadedList.appendChild(li);
  });
}

function updateDatasetHint() {

  if (!selectedFiles.length) {

    datasetHint.innerHTML =
      `Use this path in code:
      <code>/home/pyodide/data/file.csv</code>`;

    return;
  }

  datasetHint.innerHTML =
    selectedFiles
      .map(file =>
        `<div>
          ${escapeHtml(file.name)}
          →
          <code>
          /home/pyodide/data/${escapeHtml(file.name)}
          </code>
        </div>`
      )
      .join("");
}

dataFileInput?.addEventListener(
  "change",
  event => {

    selectedFiles =
      Array.from(
        event.target.files || []
      );

    refreshUploadedFilesUI();

    updateDatasetHint();
  }
);

/* ==========================================================
   FILE ATTACHMENT TO PYTHON
   ========================================================== */

async function mountFilesToPython() {

  if (!runtimeReady || !pyodide) {

    setHumanMessage(
      "Python runtime is not ready.",
      "error"
    );

    return;
  }

  if (!selectedFiles.length) {

    setHumanMessage(
      "Select files first.",
      "error"
    );

    return;
  }

  try {

    mountedFiles = [];

    for (const file of selectedFiles) {

      const buffer =
        await file.arrayBuffer();

      const data =
        new Uint8Array(buffer);

      const targetPath =
        `/home/pyodide/data/${file.name}`;

      pyodide.FS.writeFile(
        targetPath,
        data
      );

      mountedFiles.push(
        targetPath
      );
    }

    setHumanMessage(
      `${mountedFiles.length} file(s) attached successfully.`,
      "success"
    );

  } catch (error) {

    setHumanMessage(
      error.message,
      "error"
    );
  }
}

mountDataButton?.addEventListener(
  "click",
  mountFilesToPython
);

/* ==========================================================
   PYTHON PACKAGE LOADER
   ========================================================== */

async function loadPythonPackage(name) {

  if (
    loadedPythonPackages.has(name)
  ) {
    return;
  }

  await pyodide.loadPackage(name);

  loadedPythonPackages.add(name);
}

async function preloadCommonPackages(code = "") {

  const packages = [];

  if (code.includes("numpy") || code.includes("import np") || code.includes("np.")) {
    packages.push("numpy");
  }

  if (code.includes("pandas") || code.includes("pd.")) {
    packages.push("pandas");
  }

  if (
    code.includes("matplotlib") ||
    code.includes("plt.")
  ) {
    packages.push("matplotlib");
  }

  if (code.includes("seaborn") || code.includes("sns.")) {
    packages.push("matplotlib");
    packages.push("seaborn");
  }

  if (code.includes("sklearn") || code.includes("scikit-learn") || code.includes("from sklearn")) {
    packages.push("numpy");
    packages.push("scikit-learn");
  }

  if (code.includes("scipy") || code.includes("from scipy")) {
    packages.push("scipy");
  }

  const uniquePackages = [...new Set(packages)];

  for (const pkg of uniquePackages) {

    try {

      setRuntimeStatus(`Loading ${pkg}...`);

      await loadPythonPackage(pkg);

    } catch (error) {

      console.warn("Package failed:", pkg);
    }
  }

  if (uniquePackages.length > 0) {
    setRuntimeStatus("Python runtime ready", "ready");
  }
}

/* ==========================================================
   VISUALIZATION
   ========================================================== */

function addChartImage(base64) {

  if (!vizContainer) {
    return;
  }

  const image =
    document.createElement("img");

  image.src =
    `data:image/png;base64,${base64}`;

  if (
    vizContainer.querySelector(
      ".viz-placeholder"
    )
  ) {
    vizContainer.innerHTML = "";
  }

  vizContainer.appendChild(
    image
  );
}

function showNoChartMessage() {

  if (!vizContainer) {
    return;
  }

  vizContainer.innerHTML =
    `<p class="viz-placeholder">
      No chart generated.
    </p>`;
}

/* ==========================================================
   PYTHON CHART INTERCEPTOR
   ========================================================== */

async function installChartHook() {

  await pyodide.runPythonAsync(`
try:
    import io, base64
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    try:
        captured_charts.clear()
    except NameError:
        captured_charts = []

    if not hasattr(plt, '_yby_hooked'):
        def _yby_show(*args, **kwargs):
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
            buf.seek(0)
            captured_charts.append(base64.b64encode(buf.read()).decode())
            plt.close()
        plt.show = _yby_show
        plt._yby_hooked = True
except ImportError:
    pass
`);
}

/* ==========================================================
   ERROR EXPLANATIONS
   ========================================================== */

function explainPythonError(error) {

  const text =
    String(error);

  if (
    text.includes(
      "SyntaxError"
    )
  ) {

    return {
      tone: "error",

      message:
        "Python found invalid syntax. Check missing colons, brackets, or quotes."
    };
  }

  if (
    text.includes(
      "NameError"
    )
  ) {

    return {
      tone: "error",

      message:
        "A variable or function name does not exist."
    };
  }

  if (
    text.includes(
      "IndentationError"
    )
  ) {

    return {
      tone: "error",

      message:
        "Indentation is incorrect. Python relies on consistent spacing."
    };
  }

  if (
    text.includes(
      "TypeError"
    )
  ) {

    return {
      tone: "error",

      message:
        "An operation used incompatible data types."
    };
  }

  if (
    text.includes(
      "ModuleNotFoundError"
    )
  ) {

    return {
      tone: "error",

      message:
        "The required package is unavailable."
    };
  }

  return {
    tone: "error",

    message:
      "Python encountered an unexpected runtime error."
  };
}

/* ==========================================================
   CODE IMPROVEMENT ENGINE
   ========================================================== */

function analyzeCodeQuality(
  code
) {

  const suggestions = [];

  if (
    code.length < 25
  ) {

    suggestions.push(
      "Try a larger example to learn more concepts."
    );
  }

  if (
    code.includes("print(")
  ) {

    suggestions.push(
      "Consider adding comments explaining output."
    );
  }

  if (
    code.includes("for ")
  ) {

    suggestions.push(
      "Use descriptive loop variable names."
    );
  }

  if (
    code.includes("def ")
  ) {

    suggestions.push(
      "Add a docstring for reusable functions."
    );
  }

  if (
    code.includes(
      "pd.read_csv"
    )
  ) {

    suggestions.push(
      "Handle missing files using try/except."
    );
  }

  if (
    code.includes(
      "plt.show("
    )
  ) {

    suggestions.push(
      "Add chart labels and titles."
    );
  }

  if (
    !suggestions.length
       ) {

    suggestions.push(
      "Code looks clean."
    );
  }

  return suggestions;
}

/* ==========================================================
   PYTHON EXECUTION
   ========================================================== */

async function executePython() {

  const sourceCode =
    codeInput.value;

  if (!runtimeReady || !pyodide) {

    resetOutput();

    if (outputConsole) {
      outputConsole.textContent =
        "Loading Python runtime...";
    }

    await initializePythonRuntime();
  }

  if (!runtimeReady || !pyodide) {

    setHumanMessage(
      "Python runtime is not ready yet. Try C, C++, or Java while it loads.",
      "error"
    );

    return;
  }

  resetOutput();

  try {

    activeRun = true;

    runButton.disabled =
      true;

    outputConsole.textContent =
      "";

    await preloadCommonPackages(sourceCode);

    await installChartHook();

    pyodide.setStdout({
      batched(text) {
        outputConsole.textContent +=
          text + "\n";
      }
    });

    pyodide.setStderr({
      batched(text) {
        outputConsole.textContent +=
          text + "\n";
      }
    });

    await pyodide.runPythonAsync(
      sourceCode
    );

    const chartsProxy =
      pyodide.globals.get(
        "captured_charts"
      );

    const charts =
      chartsProxy ?
        chartsProxy.toJs() :
        [];

    chartsProxy?.destroy?.();

    clearVisualization();

    if (charts.length > 0) {

      charts.forEach(chart => {
        addChartImage(chart);
      });

    } else {

      showNoChartMessage();
    }

    setHumanMessage(
      "Python executed successfully.",
      "success"
    );

    setImprovements(
      analyzeCodeQuality(
        sourceCode
      )
    );

  } catch (error) {

    outputConsole.textContent =
      String(error);

    const explanation =
      explainPythonError(
        error
      );

    setHumanMessage(
      explanation.message,
      explanation.tone
    );

    setImprovements([
      "Read the error carefully.",
      "Check variable names.",
      "Verify indentation."
    ]);

  } finally {

    activeRun = false;

    runButton.disabled =
      false;
  }
}

/* ==========================================================
   PART 2 END
   PART 3 WILL INCLUDE:
   - Piston runtime discovery
   - C execution
   - C++ execution
   - Java execution
   - Run button routing
   - Example loading
   - Copy button
   - Local storage
   - Reveal animations
   - App initialization
   ========================================================== */
/* ==========================================================
   YBY COMPILER
   PART 3
   Remote Execution, UI, Storage, Initialization
   ========================================================== */

/* ==========================================================
   RUNTIME DISCOVERY
   ========================================================== */

async function fetchAvailableRuntimes() {

  for (const endpoint of remoteExecutionEndpoints) {

    try {

      const response =
        await fetch(
          endpoint.runtimesUrl
        );

      if (!response.ok) {
        continue;
      }

      const runtimes =
        await response.json();

      runtimes.forEach(runtime => {

        if (
          runtime.language &&
          runtime.version
        ) {

          resolvedRemoteVersions[
            runtime.language
          ] = runtime.version;
        }
      });

      return;

    } catch (error) {

      console.warn(
        endpoint.name,
        error
      );
    }
  }
}

/* ==========================================================
   REMOTE EXECUTION
   ========================================================== */

async function executeRemoteCode(
  language,
  sourceCode
) {

  const config =
    languageConfig[
      language
    ];

  const payload = {

    language:
      config.apiLanguage,

    version:
      resolvedRemoteVersions[
        config.apiLanguage
      ] ||
      config.apiVersion,

    files: [
      {
        name:
          config.fileName,

        content:
          sourceCode
      }
    ]
  };

  let lastError = null;

  for (const endpoint of remoteExecutionEndpoints) {

    try {
             const response =
        await fetch(
          endpoint.executeUrl,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      if (!response.ok) {

        lastError =
          new Error(
            `HTTP ${response.status}`
          );

        continue;
      }

      return await response.json();

    } catch (error) {

      lastError =
        error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Execution service unavailable"
    )
  );
}

/* ==========================================================
   REMOTE ERROR EXPLAINER
   ========================================================== */

function explainRemoteError(
  errorText,
  language
) {

  const text =
    String(
      errorText || ""
    );

  if (
    text.includes(
      "expected"
    )
  ) {

    return {
      tone: "error",

      message:
        `${language.toUpperCase()} compiler found missing or invalid syntax.`
    };
  }

  if (
    text.includes(
      "undeclared"
    )
  ) {

    return {
      tone: "error",

      message:
        "Variable not declared before use."
    };
  }

  if (
    text.includes(
      "cannot find symbol"
    )
  ) {

    return {
      tone: "error",

      message:
        "Java cannot find a variable, method, or class."
    };
  }

  if (
    text.includes(
      "segmentation"
    )
  ) {

    return {
      tone: "error",

      message:
        "Program accessed invalid memory."
    };
  }

  return {
    tone: "error",

    message:
      `${language.toUpperCase()} compilation or runtime error occurred.`
  };
}

/* ==========================================================
   EXECUTE C / C++ / JAVA
   ========================================================== */

async function executeRemoteLanguage() {

  const sourceCode =
    codeInput.value;

  resetOutput();

  try {

    activeRun = true;

    runButton.disabled =
      true;

    outputConsole.textContent =
      "Executing code...";

    const result =
      await executeRemoteCode(
        currentLanguage,
        sourceCode
      );

    let output = "";

    if (
      result.run &&
      result.run.output
    ) {

      output +=
        result.run.output;
    }

    if (
      result.compile &&
      result.compile.output
    ) {

      output =
        result.compile.output +
        "\n" +
        output;
    }

    outputConsole.textContent =
      output ||
      "Program completed.";

    const hasError =
      (
        result.compile &&
        result.compile.code !== 0
      ) ||
      (
        result.run &&
        result.run.code !== 0
      );

    if (hasError) {

      const explanation =
        explainRemoteError(
          output,
          currentLanguage
        );

      setHumanMessage(
        explanation.message,
        "error"
      );

      setImprovements([
        "Review compiler output.",
        "Check syntax carefully.",
        "Verify variable declarations."
      ]);

    } else {

      setHumanMessage(
        "Program executed successfully.",
        "success"
      );

      setImprovements(
        analyzeCodeQuality(
          sourceCode
        )
      );
    }

  } catch (error) {

    outputConsole.textContent =
      error.message;

    setHumanMessage(
      "Execution service unavailable.",
      "error"
    );

  } finally {

    activeRun = false;

    runButton.disabled =
      false;
  }
}

/* ==========================================================
   MAIN RUN ROUTER
   ========================================================== */

async function runCode() {

  if (activeRun) {
    return;
  }

  saveCurrentCode();
     if (
    currentLanguage ===
    "python"
  ) {

    await executePython();

    return;
  }

  await executeRemoteLanguage();
}

/* ==========================================================
   LANGUAGE SWITCHING
   ========================================================== */

function updateLanguageUI() {

  const config =
    languageConfig[
      currentLanguage
    ];

  if (editorFileName) {
    editorFileName.textContent =
      config.fileName;
  }

  if (languageHint) {
    languageHint.textContent =
      config.hint;
  }

  if (
    currentLanguage ===
    "python"
  ) {

    if (mountDataButton) {
      mountDataButton.disabled =
        false;
    }

    if (dataFileInput) {
      dataFileInput.disabled =
        false;
    }

  } else {

    if (mountDataButton) {
      mountDataButton.disabled =
        true;
    }

    if (dataFileInput) {
      dataFileInput.disabled =
        true;
    }
  }
}

languageSelect?.addEventListener(
  "change",
  () => {

    currentLanguage =
      languageSelect.value;

    updateLanguageUI();

    loadSavedCode();
  }
);

/* ==========================================================
   EXAMPLES
   ========================================================== */

function loadExample(
  key
) {

  const languageExamples =
    samplePrograms[currentLanguage] ||
    samplePrograms.python;

  const example =
    languageExamples[key] ||
    languageExamples.starter ||
    samplePrograms.python.starter;

  if (example) {

    codeInput.value =
      example;

    saveCurrentCode();
  }
}

exampleButton?.addEventListener(
  "click",
  () =>
    loadExample(
      "starter"
    )
);

loadSelectedExample?.addEventListener(
  "click",
  () =>
    loadExample(
      exampleSelect.value
    )
);

loadExampleHero?.addEventListener(
  "click",
  () => {

    location.href =
      "#compiler";

    loadExample(
      "starter"
    );
  }
);

/* ==========================================================
   COPY CODE
   ========================================================== */

copyButton?.addEventListener(
  "click",
  async () => {

    try {

      await navigator
        .clipboard
        .writeText(
          codeInput.value
        );

      setHumanMessage(
        "Code copied.",
        "success"
      );

    } catch {

      setHumanMessage(
        "Copy failed.",
        "error"
      );
    }
  }
);

/* ==========================================================
   CLEAR OUTPUT
   ========================================================== */

clearButton?.addEventListener(
  "click",
  () => {

    outputConsole.textContent =
      "";

    clearVisualization();

    setHumanMessage(
      "Output cleared."
    );
  }
);

/* ==========================================================
   LOCAL STORAGE
   ========================================================== */

function getStorageKey() {

  return `yby-code-${currentLanguage}`;
}

function saveCurrentCode() {

  try {

    localStorage.setItem(
      getStorageKey(),
      codeInput.value
    );

  } catch {}
}

function loadSavedCode() {

  const saved =
    localStorage.getItem(
      getStorageKey()
    );

  if (
    saved &&
    saved.trim()
  ) {

    codeInput.value =
      saved;

    return;
  }

  if (
    currentLanguage ===
    "python"
  ) {

    loadExample(
      "starter"
    );

    return;
  }

  codeInput.value = "";
}

codeInput?.addEventListener(
  "input",
  saveCurrentCode
);

/* ==========================================================
   REVEAL ANIMATION
   ========================================================== */

function initializeRevealAnimations() {

  const observer =
    new IntersectionObserver(
      entries => {
                 entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.style.opacity =
                "1";

              entry.target.style.transform =
                "translateY(0)";
            }
          }
        );
      },
      {
        threshold: 0.15
      }
    );

  document
    .querySelectorAll(
      ".reveal"
    )
    .forEach(
      element => {

        element.style.opacity =
          "0";

        element.style.transform =
          "translateY(30px)";

        element.style.transition =
          "all 0.7s ease";

        observer.observe(
          element
        );
      }
    );
}

/* ==========================================================
   ADSENSE
   ========================================================== */

function initializeAds() {

  try {

    (
      window.adsbygoogle =
        window.adsbygoogle ||
        []
    ).push({});

  } catch {}
}

/* ==========================================================
   KEYBOARD SHORTCUTS
   ========================================================== */

document.addEventListener(
  "keydown",
  event => {

    const runShortcut =
      (
        event.ctrlKey ||
        event.metaKey
      ) &&
      event.key === "Enter";

    if (
      runShortcut
    ) {

      event.preventDefault();

      runCode();
    }
  }
);

/* ==========================================================
   BUTTON EVENTS
   ========================================================== */

runButton?.addEventListener(
  "click",
  runCode
);

/* ==========================================================
   APPLICATION STARTUP
   ========================================================== */

async function initializeApplication() {

  try {

    updateLanguageUI();

    loadSavedCode();

    initializeRevealAnimations();

    initializeAds();

    clearVisualization();

    if (runButton) {
      runButton.disabled = false;
    }

    await fetchAvailableRuntimes();

    initializePythonRuntime().catch(error => {
      console.error(error);
    });

    setHumanMessage(
      "YBY Compiler ready. Python may continue loading in the background.",
      "success"
    );

  } catch (error) {

    console.error(
      error
    );

    setHumanMessage(
      "Initialization failed.",
      "error"
    );
  }
}

/* ==========================================================
   START APP
   ========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initializeApplication
);

/* ==========================================================
   END OF PART 3
   END OF SCRIPT.JS
   ========================================================== */


window.addEventListener("load", function() {
    setTimeout(() => {
       const element = document.getElementById("compiler");
       const y = element.offsetTop + 1020;
       
       window.scrollTo({
          top:y,
          behavior: "smooth"
        });
    }, 500); // 0.5 seconds
});
   
window.addEventListener("load", function () {
    const compiler = document.getElementById("compiler");

    if (compiler) {
        compiler.classList.add("active", "show", "revealed");
        compiler.style.opacity = "1";
        compiler.style.transform = "translateY(0)";
        compiler.style.visibility = "visible";
    }
});
