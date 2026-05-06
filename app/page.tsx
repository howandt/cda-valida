"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  return (
    <main className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-black">
          CDA Valida – Case Analyse
        </h1>

        <textarea
          className="w-full h-40 p-3 border rounded mb-4 text-black"
          placeholder="Indsæt klage eller tekst her..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={async () => {
            const res = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });

            const data = await res.json();
            setResult(data);
          }}
        >
          Analyser
        </button>

        {result && (
          <div className="mt-6 space-y-6">

            {/* ESSENS */}
            {result.essens?.length > 0 && (
              <div>
                <h2 className="font-bold text-black mb-2">ESSENS</h2>
                {result.essens.map((r: string, i: number) => (
                  <div key={i} className="text-black mb-1">
                    • {r}
                  </div>
                ))}
              </div>
            )}

            {/* PARAGRAFFER */}
            {result.paragraffer?.length > 0 && (
              <div>
                <h2 className="font-bold text-black mb-2">PARAGRAFFER</h2>
                {result.paragraffer.map((r: string, i: number) => (
                  <div key={i} className="text-blue-700 mb-1">
                    {r}
                  </div>
                ))}
              </div>
            )}

            {/* ARBEJDSGRUNDLAG */}
            {result.arbejdsgrundlag?.length > 0 && (
              <div>
                <h2 className="font-bold text-black mb-2">ARBEJDSGRUNDLAG</h2>
                {result.arbejdsgrundlag.map((r: string, i: number) => (
                  <div key={i} className="text-black mb-1">
                    • {r}
                  </div>
                ))}
              </div>
            )}

            {/* ANDRE FORHOLD */}
            {result.andreForhold?.length > 0 && (
              <div>
                <h2 className="font-bold text-black mb-2">ANDRE FORHOLD</h2>
                {result.andreForhold.map((r: string, i: number) => (
                  <div key={i} className="text-gray-600 mb-1">
                    • {r}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}