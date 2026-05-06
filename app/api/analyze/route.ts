import { NextResponse } from "next/server";

type ClaimType =
  | "fakta"
  | "belastning"
  | "ønske"
  | "paragraf"
  | "henvisning"
  | "emotion"
  | "meta"
  | "uklar";

type Claim = {
  type: ClaimType;
  text: string;
};

function splitSentences(text: string) {
  return text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function classifyClaim(sentence: string): Claim {
  const t = sentence.toLowerCase();

  // 🔹 META / AI-STØJ / STRATEGI
  if (
    t.includes("jeg har hørt") ||
    t.includes("jeg har fået at vide") ||
    t.includes("facebook-gruppe") ||
    t.includes("chatgpt") ||
    t.includes("hvordan skal jeg skrive") ||
    t.includes("bedre chance for et ja") ||
    t.includes("hvordan kan jeg være sikker")
  ) {
    return {
      type: "meta",
      text: sentence,
    };
  }

  // 🔹 PARAGRAF
  if (
    t.includes("§") ||
    t.includes("serviceloven") ||
    t.includes("barnets lov") ||
    t.includes("forvaltningslov") ||
    t.includes("retssikkerhedsloven")
  ) {
    return {
      type: "paragraf",
      text: sentence,
    };
  }

  // 🔹 HENVISNINGER
  if (
    t.includes("ombudsmand") ||
    t.includes("ankestyrelsen") ||
    t.includes("principafgørelse") ||
    t.includes("domspraksis")
  ) {
    return {
      type: "henvisning",
      text: sentence,
    };
  }

  // 🔹 ØNSKER / ANMODNINGER
  if (
    t.includes("jeg ønsker") ||
    t.includes("vi ønsker") ||
    t.includes("jeg vil gerne") ||
    t.includes("anmoder om") ||
    t.includes("søger hjælp") ||
    t.includes("hjælp til") ||
    t.includes("vurdering af") ||
    t.includes("muligheder for")
  ) {
    return {
      type: "ønske",
      text: sentence,
    };
  }

  // 🔹 BELASTNING
  if (
    t.includes("sover dårligt") ||
    t.includes("græder") ||
    t.includes("udmattet") ||
    t.includes("belastet") ||
    t.includes("mistet arbejde") ||
    t.includes("ikke holde ud") ||
    t.includes("i alarmberedskab") ||
    t.includes("påvirker hele familien")
  ) {
    return {
      type: "belastning",
      text: sentence,
    };
  }

  // 🔹 EMOTION
  if (
    t.includes("jeg føler") ||
    t.includes("jeg er træt") ||
    t.includes("ingen lytter") ||
    t.includes("frustreret") ||
    t.includes("jeg er bange")
  ) {
    return {
      type: "emotion",
      text: sentence,
    };
  }

  // 🔹 FAKTA
  if (
    t.includes("adhd") ||
    t.includes("autisme") ||
    t.includes("angst") ||
    t.includes("skole") ||
    t.includes("fravær") ||
    t.includes("ppr") ||
    t.includes("søn") ||
    t.includes("datter") ||
    t.includes("barn") ||
    t.includes("støtte") ||
    t.includes("udbrud") ||
    t.includes("affekt")
  ) {
    return {
      type: "fakta",
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

function detectType(claims: Claim[]) {
  const hasØnske = claims.some(
    (c) => c.type === "ønske"
  );

  const hasBelastning = claims.some(
    (c) => c.type === "belastning"
  );

  const hasParagraffer = claims.some(
    (c) => c.type === "paragraf"
  );

  if (hasØnske && hasParagraffer) {
    return "ansøgning";
  }

  if (hasBelastning && hasParagraffer) {
    return "klage";
  }

  return "uklar";
}

function extractEssens(claims: Claim[]) {
  const result: string[] = [];

  const fakta = claims.filter(
    (c) => c.type === "fakta"
  );

  const belastning = claims.filter(
    (c) => c.type === "belastning"
  );

  const ønsker = claims.filter(
    (c) => c.type === "ønske"
  );

  if (fakta.length > 0) {
    result.push(
      "Sagen indeholder konkrete oplysninger om barn/familie"
    );
  }

  if (belastning.length > 0) {
    result.push(
      "Der beskrives belastning og mistrivsel"
    );
  }

  if (ønsker.length > 0) {
    result.push(
      "Der anmodes om hjælp eller støtte"
    );
  }

  if (result.length === 0) {
    result.push(
      "Ingen tydelig essens identificeret"
    );
  }

  return result;
}

function extractKerneData(claims: Claim[]) {
  return claims
    .filter((c) => c.type === "fakta")
    .slice(0, 6)
    .map((c) => c.text);
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
    .slice(0, 10)
    .map((c) => c.text);
}

function extractAndreForhold(claims: Claim[]) {
  return claims
    .filter(
      (c) =>
        c.type === "emotion" ||
        c.type === "meta" ||
        c.type === "uklar"
    )
    .slice(0, 8)
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
    type: detectType(claims),
    essens: extractEssens(claims),
    kerneData: extractKerneData(claims),
    paragraffer: extractParagraffer(claims),
    arbejdsgrundlag:
      extractArbejdsgrundlag(claims),
    andreForhold:
      extractAndreForhold(claims),
  });
}