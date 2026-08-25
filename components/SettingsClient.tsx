"use client";

import { useEffect, useState } from "react";

interface SettingsResponse {
  analysisProvider: "anthropic" | "ollama";
  anthropicApiKey: string; // masked
  anthropicApiKeySet: boolean;
  analysisModel: string;
  ollamaHost: string;
  ollamaModel: string;
}

export function SettingsClient() {
  const [loaded, setLoaded] = useState(false);
  const [provider, setProvider] = useState<"anthropic" | "ollama">("anthropic");
  const [maskedKey, setMaskedKey] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [analysisModel, setAnalysisModel] = useState("");
  const [ollamaHost, setOllamaHost] = useState("");
  const [ollamaModel, setOllamaModel] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: SettingsResponse) => {
        setProvider(data.analysisProvider);
        setMaskedKey(data.anthropicApiKey);
        setKeySet(data.anthropicApiKeySet);
        setAnalysisModel(data.analysisModel);
        setOllamaHost(data.ollamaHost);
        setOllamaModel(data.ollamaModel);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function save() {
    setStatus("saving");
    const body: Record<string, string> = {
      analysisProvider: provider,
      analysisModel,
      ollamaHost,
      ollamaModel,
    };
    if (apiKeyInput.trim()) body.anthropicApiKey = apiKeyInput.trim();

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      const data: SettingsResponse = await res.json();
      setMaskedKey(data.anthropicApiKey);
      setKeySet(data.anthropicApiKeySet);
      setApiKeyInput("");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  if (!loaded) {
    return (
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-12">
        <h1 className="page-heading">Settings</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-12">
      <h1 className="page-heading">Settings</h1>
      <p className="mt-3 max-w-lg text-muted">
        Analysis provider for auto-tagging uploads. Stored locally on this machine only —
        never synced or bundled into the app.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        <section>
          <p className="tracked-label mb-3 text-dim">Provider</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {(
              [
                { id: "anthropic" as const, label: "Claude (Anthropic API)" },
                { id: "ollama" as const, label: "Ollama (local model)" },
              ]
            ).map((option) => (
              <button
                key={option.id}
                onClick={() => setProvider(option.id)}
                className={`flex-1 border px-3 py-2.5 text-left transition-colors duration-150 ${
                  provider === option.id
                    ? "border-accent bg-surface"
                    : "border-border hover:bg-surface"
                }`}
              >
                <span className="text-[14px]">{option.label}</span>
              </button>
            ))}
          </div>
        </section>

        {provider === "anthropic" && (
          <section>
            <p className="tracked-label mb-3 text-dim">Anthropic API Key</p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={keySet ? maskedKey : "sk-ant-..."}
              className="w-full max-w-md border-b border-border pb-1.5 placeholder:text-dim"
              autoComplete="off"
            />
            <p className="mt-2 text-[11px] text-dim">
              {keySet
                ? "A key is already saved — leave blank to keep it, or paste a new one to replace it."
                : "No key saved yet. Get one from console.anthropic.com."}
            </p>

            <p className="tracked-label mb-3 mt-6 text-dim">Model</p>
            <input
              type="text"
              value={analysisModel}
              onChange={(e) => setAnalysisModel(e.target.value)}
              className="w-full max-w-md border-b border-border pb-1.5"
            />
          </section>
        )}

        {provider === "ollama" && (
          <section>
            <p className="tracked-label mb-3 text-dim">Ollama Host</p>
            <input
              type="text"
              value={ollamaHost}
              onChange={(e) => setOllamaHost(e.target.value)}
              className="w-full max-w-md border-b border-border pb-1.5"
            />

            <p className="tracked-label mb-3 mt-6 text-dim">Model</p>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="w-full max-w-md border-b border-border pb-1.5"
            />
            <p className="mt-2 text-[11px] text-dim">
              Requires Ollama running locally with this model pulled.
            </p>
          </section>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={status === "saving"}
            className="tracked-label border border-accent bg-accent px-4 py-2 text-bg disabled:opacity-50"
          >
            {status === "saving" ? "saving..." : "save"}
          </button>
          {status === "saved" && <span className="tracked-label text-accent">saved</span>}
          {status === "error" && (
            <span className="tracked-label text-red-500">failed to save</span>
          )}
        </div>
      </div>
    </main>
  );
}
