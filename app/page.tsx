"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");

  return (
    <main className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">
          CDA Valida – Case Analyse
        </h1>

        <textarea
          className="w-full h-40 p-3 border rounded mb-4"
          placeholder="Indsæt klage eller tekst her..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => console.log(text)}
        >
          Analyser
        </button>
      </div>
    </main>
  );
}