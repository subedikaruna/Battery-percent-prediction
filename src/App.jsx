import React, { useState, useEffect } from 'react';

export default function App() {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Initializing Python in browser...");
  const [screenTime, setScreenTime] = useState(5.0);
  const [predictedBattery, setPredictedBattery] = useState(null);

  useEffect(() => {
    async function initPython() {
      try {
        while (!window.loadPyodide) {
          await new Promise((r) => setTimeout(r, 100));
        }

        setStatusText("Loading Python WebAssembly Engine...");
        const py = await window.loadPyodide();

        setStatusText("Installing pandas, scikit-learn & matplotlib...");
        await py.loadPackage(["pandas", "scikit-learn", "matplotlib"]);

        setStatusText("Loading datasets/data.csv and main.py...");
        const csvRes = await fetch('/datasets/data.csv');
        const csvText = await csvRes.text();

        // Create directories safely in virtual filesystem
        try { py.FS.mkdir('datasets'); } catch (e) { }
        try { py.FS.mkdir('/datasets'); } catch (e) { }

        // Write CSV to all expected working locations
        py.FS.writeFile('data.csv', csvText);
        py.FS.writeFile('datasets/data.csv', csvText);
        py.FS.writeFile('/datasets/data.csv', csvText);

        const pyRes = await fetch('/main.py');
        const pyCode = await pyRes.text();
        await py.runPythonAsync(pyCode);

        setPyodide(py);
        setLoading(false);
      } catch (err) {
        console.error("Pyodide Error:", err);
        setStatusText("Failed to load Python environment: " + err.message);
      }
    }

    initPython();
  }, []);

  // Run model prediction whenever screenTime or Pyodide state changes
  useEffect(() => {
    if (!pyodide || loading) return;

    try {
      // Get raw output from model
      const rawPrediction = pyodide.runPython(`
        pred = model.predict([[${screenTime}]])[0]
        float(pred)
      `);

      // Clamp prediction between 0% and 100%
      const clampedValue = Math.min(Math.max(rawPrediction, 0), 100);
      setPredictedBattery(clampedValue.toFixed(2));
    } catch (err) {
      console.error("Prediction Error:", err);
    }
  }, [screenTime, pyodide, loading]);

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md mx-auto my-12 text-white">
      <h1 className="text-2xl font-extrabold text-center text-blue-400 mb-1">
        Battery Usage Predictor
      </h1>
      <p className="text-xs text-center text-slate-400 mb-6">
       
      </p>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-sm text-amber-400 font-medium">{statusText}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Screen Time (Hours):
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.1"
              value={screenTime}
              onChange={(e) => setScreenTime(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="range"
              min="0"
              max="11.5"
              step="0.1"
              value={screenTime}
              onChange={(e) => setScreenTime(parseFloat(e.target.value) || 0)}
              className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
              Predicted Battery Usage
            </p>
            <p className="text-4xl font-black text-emerald-400 my-2">
              {predictedBattery ? `${predictedBattery}%` : '--'}
            </p>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mt-4 border border-slate-700">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(Math.max(parseFloat(predictedBattery) || 0, 0), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}