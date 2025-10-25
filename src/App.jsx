import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:5000";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [preds, setPreds] = useState([]);
  const [thr, setThr] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setPreds([]);
      setError(null);
    }
  };

  const classify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setPreds([]);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE}/classify`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);

      const filtered = (data.predictions || [])
        .filter((p) => p.probability >= thr)
        .sort((a, b) => b.probability - a.probability);
      setPreds(filtered);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview); // Vapauttaa muistin
    setFile(null);
    setPreview(null);
    setPreds([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-950 text-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
         Vieheluokittelija
      </h1>
      <p className="text-gray-400 mb-6">
        Azure Custom Vision -mallin testaus (paikallinen Flask-backend)
      </p>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl max-w-3xl w-full p-6 flex flex-col gap-6">
        {/* File upload */}
        <div className="flex flex-col items-center border-2 border-dashed border-slate-600 rounded-xl py-10 cursor-pointer hover:bg-slate-700/30 transition">
          {!preview ? (
            <>
              <input
                type="file"
                id="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12 mx-auto mb-3 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                  />
                </svg>
                <p className="text-gray-300">
                  Raahaa kuva tähän tai <span className="text-blue-400 underline">valitse tiedosto</span>
                </p>
              </label>
            </>
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="max-h-96 rounded-lg border border-slate-700"
            />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Kynnysarvo</span>
            <span className="font-mono text-sm">{thr.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={thr}
            onChange={(e) => setThr(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex gap-3">
            <button
              onClick={classify}
              disabled={!file || loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50 transition"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
              )}
              {loading ? "Luokitellaan…" : "Luokittele"}
            </button>
            <button
              onClick={reset}
              className="flex-1 border border-slate-500 text-gray-300 py-2 rounded-lg hover:bg-slate-700/40 transition"
            >
              Tyhjennä
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
            Virhe: {error}
          </div>
        )}

        {/* Results */}
        {preds.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Tulokset</h2>
            <ul className="space-y-3">
              {preds.map((p) => {
                const pct = (p.probability * 100).toFixed(1);
                return (
                  <li
                    key={p.tagName}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="flex justify-between mb-1">
                      <span>{p.tagName}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-lg overflow-hidden">
                      <div
                        className="h-2 bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <p className="text-gray-500 text-xs mt-6">
        Flask backend: <code>{API_BASE}</code>
      </p>
    </div>
  );
}