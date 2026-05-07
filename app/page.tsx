// @ts-nocheck
"use client";

import { useState } from "react";

type Paragraf = {
  tekst: string;
  status: "verificeret" | "usikker" | "hallucination";
  note: string;
};

type Persondata = {
  barn: string;
  alder: string;
  skole_institution: string;
  klasse_trin: string;
  forælder_navn: string;
  adresse: string;
  kontakt: string;
  diagnose_status: string;
  andre_fagpersoner: string;
};

type Result = {
  type: string;
  persondata: Persondata;
  kerneansøgning: string;
  dokumenterede_fakta: string[];
  paragraffer: Paragraf[];
  andre_henvisninger: Paragraf[];
  filtreret_fra: string[];
  handlingspunkter: string[];
};

const STATUS_CONFIG = {
  verificeret: { label: "✔ Verificeret", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  usikker:     { label: "⚠ Usikker",     color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  hallucination: { label: "✗ Hallucination", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const TYPE_CONFIG = {
  klage:       { label: "KLAGE",       color: "#7c3aed", bg: "#f5f3ff" },
  ansøgning:   { label: "ANSØGNING",   color: "#0369a1", bg: "#f0f9ff" },
  information: { label: "INFORMATION", color: "#0f766e", bg: "#f0fdfa" },
  uklar:       { label: "UKLAR",       color: "#6b7280", bg: "#f9fafb" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "#6b7280",
        textTransform: "uppercase",
        marginBottom: "0.5rem",
        paddingBottom: "0.25rem",
        borderBottom: "1px solid #e5e7eb",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PersonRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
      <span style={{ color: "#6b7280", minWidth: "140px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ParagrafItem({ item }: { item: Paragraf }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.usikker;
  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: "6px",
      padding: "0.6rem 0.75rem",
      marginBottom: "0.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <span style={{ fontSize: "0.875rem", color: "#1f2937", lineHeight: 1.5 }}>{item.tekst}</span>
        <span style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: cfg.color,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {cfg.label}
        </span>
      </div>
      {item.note && (
        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>{item.note}</div>
      )}
    </div>
  );
}

export default function ValidaPage() {
  const [text, setText] = useState("");
  const [type, setType] = useState("ansøgning");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!text.trim() || text.trim().length < 20) {
      setError("Indsæt venligst tekst inden analyse.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type, modul: "børn" }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Kunne ikke oprette forbindelse til analyse.");
    } finally {
      setLoading(false);
    }
  }

  const typeCfg = result ? (TYPE_CONFIG[result.type] ?? TYPE_CONFIG.uklar) : null;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f3f4f6",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "2rem 1rem",
    }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
              VALIDA
            </span>
            <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>
              Struktureringsværktøj · Børn & Familie
            </span>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg, #1d4ed8, #7c3aed)", borderRadius: "2px", width: "60px" }} />
        </div>

        {/* INPUT PANEL */}
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "1.25rem",
        }}>

          {/* TYPE SELECTOR */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
              Dokumenttype
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["ansøgning", "klage", "information"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "6px",
                    border: type === t ? "2px solid #1d4ed8" : "2px solid #e5e7eb",
                    background: type === t ? "#eff6ff" : "#fff",
                    color: type === t ? "#1d4ed8" : "#6b7280",
                    fontWeight: type === t ? 700 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* TEXT AREA */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
              Dokument
            </label>
            <textarea
              style={{
                width: "100%",
                minHeight: "180px",
                padding: "0.75rem",
                border: "1.5px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "0.875rem",
                color: "#111827",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="Indsæt ansøgning eller klage her..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ fontSize: "0.8rem", color: "#dc2626", marginBottom: "0.75rem" }}>{error}</div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              background: loading ? "#93c5fd" : "#1d4ed8",
              color: "#fff",
              padding: "0.55rem 1.5rem",
              borderRadius: "7px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "Analyserer..." : "Analyser dokument"}
          </button>
        </div>

        {/* RESULT PANEL */}
        {result && (
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "1.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}>

            {/* TYPE BADGE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase" }}>
                Valida Rapport · Børn & Familie
              </span>
              <span style={{
                background: typeCfg.bg,
                color: typeCfg.color,
                fontWeight: 800,
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                padding: "0.3rem 0.75rem",
                borderRadius: "5px",
              }}>
                {typeCfg.label}
              </span>
            </div>

            {/* KERNEANSØGNING */}
            {result.kerneansøgning && (
              <div style={{
                background: "#f0f9ff",
                border: "1.5px solid #bae6fd",
                borderRadius: "8px",
                padding: "1rem 1.25rem",
                marginBottom: "1.75rem",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "#0369a1", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Kerneansøgning
                </div>
                <div style={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 600, lineHeight: 1.5 }}>
                  {result.kerneansøgning}
                </div>
              </div>
            )}

            {/* PERSONDATA */}
            {result.persondata && (
              <Section title="Persondata">
                <PersonRow label="Barn" value={result.persondata.barn} />
                <PersonRow label="Alder" value={result.persondata.alder} />
                <PersonRow label="Klasse / trin" value={result.persondata.klasse_trin} />
                <PersonRow label="Skole / institution" value={result.persondata.skole_institution} />
                <PersonRow label="Forælder / ansøger" value={result.persondata.forælder_navn} />
                <PersonRow label="Adresse" value={result.persondata.adresse} />
                <PersonRow label="Kontakt" value={result.persondata.kontakt} />
                <PersonRow label="Diagnose / status" value={result.persondata.diagnose_status} />
                <PersonRow label="Andre fagpersoner" value={result.persondata.andre_fagpersoner} />
              </Section>
            )}

            {/* DOKUMENTEREDE FAKTA */}
            {result.dokumenterede_fakta?.length > 0 && (
              <Section title="Dokumenterede fakta">
                {result.dokumenterede_fakta.map((f, i) => (
                  <div key={i} style={{ fontSize: "0.875rem", color: "#1f2937", marginBottom: "0.35rem", paddingLeft: "0.75rem", borderLeft: "2px solid #e5e7eb", lineHeight: 1.5 }}>
                    {f}
                  </div>
                ))}
              </Section>
            )}

            {/* PARAGRAFFER */}
            {result.paragraffer?.length > 0 && (
              <Section title="Paragraffer og lovhenvisninger">
                {result.paragraffer.map((p, i) => (
                  <ParagrafItem key={i} item={p} />
                ))}
              </Section>
            )}

            {/* ANDRE HENVISNINGER */}
            {result.andre_henvisninger?.length > 0 && (
              <Section title="Andre henvisninger — principafgørelser, domme, vejledninger">
                {result.andre_henvisninger.map((p, i) => (
                  <ParagrafItem key={i} item={p} />
                ))}
              </Section>
            )}

            {/* HANDLINGSPUNKTER */}
            {result.handlingspunkter?.length > 0 && (
              <Section title="Handlingspunkter">
                {result.handlingspunkter.map((h, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: "0.6rem",
                    marginBottom: "0.4rem",
                    alignItems: "flex-start",
                    fontSize: "0.875rem",
                    color: "#1f2937",
                  }}>
                    <span style={{ color: "#1d4ed8", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    {h}
                  </div>
                ))}
              </Section>
            )}

            {/* FILTRERET FRA */}
            {result.filtreret_fra?.length > 0 && (
              <Section title="Filtreret fra — ikke relevant for sagsbehandling">
                {result.filtreret_fra.map((f, i) => (
                  <div key={i} style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.25rem" }}>
                    — {f}
                  </div>
                ))}
              </Section>
            )}

          </div>
        )}
      </div>
    </main>
  );
}