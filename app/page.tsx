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
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ text }),
            });

            const data = await res.json();
            setResult(data);
          }}
        >
          Analyser
        </button>

        {result && (
          <div className="mt-6">
            {result.relevant.length > 0 && (
              <>
                <h2 className="font-bold mb-2 text-black">Relevant</h2>
                {result.relevant.map((r: any, i: number) => (
                  <div key={i} className="text-green-700 mb-1">
                    {r.text}
                  </div>
                ))}
              </>
            )}

            {result.notRelevant.length > 0 && (
              <>
                <h2 className="font-bold mt-4 mb-2 text-black">
                  Ikke relevant
                </h2>
                {result.notRelevant.map((r: any, i: number) => (
                  <div key={i} className="text-red-700 mb-1">
                    {r.text}
                  </div>
                ))}
              </>
            )}

            {result.uncertain.length > 0 && (
              <>
                <h2 className="font-bold mt-4 mb-2 text-black">Usikker</h2>
                {result.uncertain.map((r: any, i: number) => (
                  <div key={i} className="text-yellow-700 mb-1">
                    {r.text}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 