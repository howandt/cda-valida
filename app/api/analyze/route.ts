import { NextResponse } from "next/server";

type Claim = {
  type: "paragraf" | "henvisning" | "påstand" | "fakta";
  text: string;
};

// 🔹 Split tekst i claims
function claimSplit(text: string): Claim[] {
  const sentences = text
    .split(/[\n\.]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((s) => {
    const lower = s.toLowerCase();

    if (lower.includes("§") || lower.includes("lov")) {
      return { type: "paragraf", text: s };
    }

    if (
      lower.includes("ombudsmand") ||
      lower.includes("ankestyrelsen") ||
      lower.includes("afgørelse") ||
      lower.includes("medhold") ||
      lower.includes("lignende sager") ||
      lower.includes("jeg mener")
    ) {
      return { type: "henvisning", text: s };
    }

    if (
      lower.includes("klage") ||
      lower.includes("afslag") ||
      lower.includes("kommunen")
    ) {
      return { type: "påstand", text: s };
    }

    return { type: "fakta", text: s };
  });
}

// 🔹 Tjek om det er en relevant sag
function isCase(text: string) {
  const lower = text.toLowerCase();
  return (
    lower.includes("klage") ||
    lower.includes("kommune") ||
    lower.includes("afslag") ||
    lower.includes("støtte") ||
    lower.includes("barn") ||
    lower.includes("skole")
  );
}

// 🔹 Simpel scoring (version 1)
function scoreClaim(claim: Claim) {
  let score = 0;

  if (claim.type === "fakta") score += 0.5;
  if (claim.type === "påstand") score += 0.5;
  if (claim.type === "paragraf") score += 0.6;

  if (claim.text.length > 20) score += 0.2;

  if (claim.type === "henvisning") score -= 0.3;

  return Math.max(0, Math.min(score, 1));
}

// 🔹 ESSENS (max 5 linjer)
function extractEssens(claims: Claim[]) {
  const essens: string[] = [];

  // 1. Klage (kort)
  const klage = claims.find(c =>
    c.text.toLowerCase().includes("klage")
  );
  if (klage) {
    essens.push("Klage over afslag på støtte til barn i skole");
  }

  // 2. Problem
  const problem = claims.find(c =>
    c.text.toLowerCase().includes("støtte") ||
    c.text.toLowerCase().includes("trivsel")
  );
  if (problem) {
    essens.push("Oplever utilstrækkelig støtte og mistrivsel");
  }

  // 3. Ønske
  const ønske = claims.find(c =>
    c.text.toLowerCase().includes("revurder") ||
    c.text.toLowerCase().includes("ønsker")
  );
  if (ønske) {
    essens.push("Ønsker revurdering af afgørelsen");
  }

  return essens;
}

// 🔹 PARAGRAFFER (✔ ⚠️ ❌)
function extractParagraffer(claims: Claim[]) {
  return claims
    .filter(c =>
      c.type === "paragraf" &&
      c.text.includes("§") // KUN rigtige paragraffer
    )
    .map(c => {
      const score = scoreClaim(c);

      let label = "❌ Ikke relevant";
      if (score >= 0.6) label = "✔ Relevant";
      else if (score >= 0.3) label = "⚠️ Mulig";

      return `${c.text} → ${label}`;
    });
}

// 🔹 ARBEJDSGRUNDLAG (max 8 linjer)
function extractArbejdsgrundlag(claims: Claim[]) {
  return claims
    .filter(c =>
      c.type === "fakta" &&
      !c.text.toLowerCase().includes("ønsker") &&
      !c.text.toLowerCase().includes("revurder") &&
      !c.text.toLowerCase().includes("vurdering") &&
      !c.text.toLowerCase().includes("på den baggrund") &&
      !c.text.toLowerCase().includes("jeg vil")
    )
    .slice(0, 5)
    .map(c => c.text);
}

// 🔹 ANDRE FORHOLD (max 3 linjer)
function extractAndreForhold(claims: Claim[]) {
  return claims
    .filter(c =>
      c.type === "henvisning" &&
      c.text.toLowerCase().includes("andre")
    )
    .slice(0, 2)
    .map(c => c.text);
}

// 🔹 API endpoint
export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { error: "Ingen tekst modtaget" },
      { status: 400 }
    );
  }

  if (!isCase(text)) {
    return NextResponse.json({
      essens: ["Ikke en kommunal sag"],
      paragraffer: [],
      arbejdsgrundlag: [],
      andreForhold: [],
    });
  }

  const claims = claimSplit(text);

  const result = {
    essens: extractEssens(claims),
    paragraffer: extractParagraffer(claims),
    arbejdsgrundlag: extractArbejdsgrundlag(claims),
    andreForhold: extractAndreForhold(claims),
  };

  return NextResponse.json(result);
}