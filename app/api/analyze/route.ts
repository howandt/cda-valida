import { NextResponse } from "next/server";

type ClaimType =
  | "paragraf"
  | "henvisning"
  | "ønske"
  | "belastning"
  | "fakta"
  | "emotion"
  | "uklar";

type Claim = {
  type: ClaimType;
  text: string;
};

function splitSentences(text: string) {
  return text
    .split(/[\n\.]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function classifyClaim(sentence: string): Claim {
  const t = sentence.toLowerCase();

  // 🔹 PARAGRAF
  if (
    t.includes("§") ||
    t.includes("serviceloven") ||
    t.includes("barnets lov") ||
    t.includes("forvaltningslov")
  ) {
    return {
      type: "paragraf",
      text: sentence,
    };
  }

  // 🔹 HENVISNING
  if (
    t.includes("ankestyrelsen") ||
    t.includes("ombudsmand") ||
    t.includes("principafgørelse")
  ) {
    return {
      type: "henvisning",
      text: sentence,
    };
  }

  // 🔹 ØNSKER
  if (
    t.includes("jeg ønsker") ||
    t.includes("vi ønsker") ||
    t.includes("håber") ||
    t.includes("ansøger") ||
    t.includes("har brug for hjælp")
  ) {
    return {
      type: "ønske",
      text: sentence,
    };
  }

  // 🔹 BELASTNING
  if (
    t.includes("kan ikke overskue") ||
    t.includes("mistet arbejde") ||
    t.includes("sover dårligt") ||
    t.includes("græder") ||
    t.includes("belastet") ||
    t.includes("udmattet")
  ) {
    return {
      type: "belastning",
      text: sentence,
    };
  }

  // 🔹 FAKTA
  if (
    t.includes("skole") ||
    t.includes("barn") ||
    t.includes("datter") ||
    t.includes("søn") ||
    t.includes("adhd") ||
    t.includes("autisme") ||
    t.includes("angst") ||
    t.includes("fravær") ||
    t.includes("ppr") ||
    t.includes("støtte")
  ) {
    return {
      type: "fakta",
      text: sentence,
    };
  }

  // 🔹 EMOTION
  if (
    t.includes("føler") ||
    t.includes("træt") ||
    t.includes("ingen lytter") ||
    t.includes("helt ødelagt") ||
    t.includes("frustreret")
  ) {
    return {
      type: "emotion",
      text: sentence,
    };
  }

  return {
    type: "uklar",
    text: sentence,
  };
}

function claimSplit(text: string): Claim[] {
  return splitSentences(text).map(classifyClaim);
}

function detectType(text: string) {
  const t = text.toLowerCase();

  const hasKlage =
    t.includes("klage") ||
    t.includes("revurdering") ||
    t.includes("afslag");

  const hasAnsøgning =
    t.includes("ansøg") ||
    t.includes("søger støtte") ||
    t.includes("ønsker hjælp");

  if (hasKlage && hasAnsøgning) return "blandet";
  if (hasKlage) return "klage";
  if (hasAnsøgning) return "ansøgning";

  return "uklar";
}

function extractEssens(claims: Claim[]) {
  const result: string[] = [];

  const fakta = claims.filter((c) => c.type === "fakta");

  const belastning = claims.filter(
    (c) => c.type === "belastning"
  );

  const ønsker = claims.filter(
    (c) => c.type === "ønske"
  );

  if (fakta.length > 0) {
    result.push(
      "Sagen indeholder oplysninger om barn/familie og støttebehov"
    );
  }

  if (belastning.length > 0) {
    result.push(
      "Der beskrives betydelig belastning og mistrivsel"
    );
  }

  if (ønsker.length > 0) {
    result.push(
      "Der efterspørges hjælp eller støtte"
    );
  }

  if (result.length === 0) {
    result.push(
      "Ingen tydelig essens identificeret"
    );
  }

  return result;
}

function extractParagraffer(claims: Claim[]) {
  return claims
    .filter((c) => c.type === "paragraf")
    .map((c) => `${c.text} → ✔ Relevant`);
}

function extractArbejdsgrundlag(claims: Claim[]) {
  return claims
    .filter(
      (c) =>
        c.type === "fakta" ||
        c.type === "belastning"
    )
    .slice(0, 8)
    .map((c) => c.text);
}

function extractAndreForhold(claims: Claim[]) {
  return claims
    .filter(
      (c) =>
        c.type === "emotion" ||
        c.type === "uklar"
    )
    .slice(0, 5)
    .map((c) => c.text);
}

function extractKerneData(claims: Claim[]) {
  return claims
    .filter((c) => c.type === "fakta")
    .slice(0, 5)
    .map((c) => c.text);
}

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      {
        error: "Ingen tekst modtaget",
      },
      { status: 400 }
    );
  }

  const claims = claimSplit(text);

  return NextResponse.json({
    type: detectType(text),
    essens: extractEssens(claims),
    kerneData: extractKerneData(claims),
    paragraffer: extractParagraffer(claims),
    arbejdsgrundlag:
      extractArbejdsgrundlag(claims),
    andreForhold:
      extractAndreForhold(claims),
  });
}