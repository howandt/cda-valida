import { NextResponse } from "next/server";

type ClaimType = "paragraf" | "henvisning" | "påstand" | "fakta";

type Claim = {
  type: ClaimType;
  text: string;
};

function anonymizeText(text: string) {
  return text
    // E-mail
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[E-mail udeladt]"
    )

    // Telefonnummer DK-lignende
    .replace(/\b(\+45\s?)?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/g, "[Telefon udeladt]")

    // Adresse-lignende tekst
    .replace(
      /\b([A-ZÆØÅ][a-zæøå]+(?:\s[A-ZÆØÅa-zæøå]+)*\s\d+[A-Za-z]?(?:,\s?\d+\.?\s?(?:tv|th|mf|sal|st)?)?)\b/g,
      "[Adresse udeladt]"
    )

    // Navne efter typiske labels
    .replace(/Barn\s*[:\-]\s*[A-ZÆØÅ][A-Za-zÆØÅæøå\s-]+/g, "Barn: [Barn]")
    .replace(
      /Forælder\s*[:\-]\s*[A-ZÆØÅ][A-Za-zÆØÅæøå\s-]+/g,
      "Forælder: [Forælder]"
    )
    .replace(
      /Ansøger\s*[:\-]\s*[A-ZÆØÅ][A-Za-zÆØÅæøå\s-]+/g,
      "Ansøger: [Forælder]"
    )
    .replace(
      /Skole\s*[:\-]\s*[A-ZÆØÅ][A-Za-zÆØÅæøå\s-]+/g,
      "Skole: [Skole]"
    );
}

function claimSplit(text: string): Claim[] {
  const cleanText = anonymizeText(text);

  const sentences = cleanText
    .split(/[\n\.]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((s) => {
    const lower = s.toLowerCase();

    if (
      lower.includes("§") ||
      lower.includes("folkeskoleloven") ||
      lower.includes("serviceloven") ||
      lower.includes("barnets lov") ||
      lower.includes("forvaltningsloven") ||
      lower.includes("offentlighedsloven")
    ) {
      return { type: "paragraf", text: s };
    }

    if (
      lower.includes("ombudsmand") ||
      lower.includes("ankestyrelsen") ||
      lower.includes("klagenævnet") ||
      lower.includes("principafgørelse") ||
      lower.includes("afgørelse") ||
      lower.includes("dom") ||
      lower.includes("vejledning") ||
      lower.includes("medhold") ||
      lower.includes("lignende sager")
    ) {
      return { type: "henvisning", text: s };
    }

    if (
      lower.includes("jeg mener") ||
      lower.includes("vi mener") ||
      lower.includes("oplever") ||
      lower.includes("ønsker") ||
      lower.includes("kræver") ||
      lower.includes("anmoder") ||
      lower.includes("klage") ||
      lower.includes("afvist") ||
      lower.includes("revurdering") ||
      lower.includes("kommunen")
    ) {
      return { type: "påstand", text: s };
    }

    return { type: "fakta", text: s };
  });
}

function isCase(text: string) {
  const lower = text.toLowerCase();

  return (
    lower.includes("klage") ||
    lower.includes("kommune") ||
    lower.includes("afslag") ||
    lower.includes("støtte") ||
    lower.includes("barn") ||
    lower.includes("skole") ||
    lower.includes("ppr") ||
    lower.includes("trivsel") ||
    lower.includes("specialundervisning") ||
    lower.includes("aktindsigt")
  );
}

function scoreClaim(claim: Claim) {
  let score = 0;

  if (claim.type === "fakta") score += 0.5;
  if (claim.type === "påstand") score += 0.45;
  if (claim.type === "paragraf") score += 0.65;
  if (claim.type === "henvisning") score += 0.35;

  if (claim.text.length > 20) score += 0.2;
  if (claim.text.length > 80) score += 0.1;

  if (claim.type === "henvisning") score -= 0.15;

  return Math.max(0, Math.min(score, 1));
}

function validateClaim(claim: Claim) {
  const t = claim.text.toLowerCase();

  if (claim.type === "paragraf") {
    if (
      t.includes("folkeskoleloven") ||
      t.includes("serviceloven") ||
      t.includes("barnets lov") ||
      t.includes("forvaltningsloven") ||
      t.includes("offentlighedsloven") ||
      t.includes("§")
    ) {
      return {
        valid: true,
        status: "relevant",
        note: "Juridisk relevant henvisning – bør kontrolleres mod konkret paragraf",
      };
    }

    return {
      valid: false,
      status: "usikker",
      note: "Ukendt eller upræcis paragraf",
    };
  }

  if (claim.type === "henvisning") {
    if (
      t.includes("ankestyrelsen") ||
      t.includes("klagenævnet for specialundervisning")
    ) {
      return {
        valid: true,
        status: "verificeret",
        note: "Eksisterende klageinstans eller myndighed",
      };
    }

    return {
      valid: false,
      status: "usikker",
      note: "Kræver konkret dokumentation, dato, sagsnummer eller kilde",
    };
  }

  if (claim.type === "påstand") {
    return {
      valid: true,
      status: "forælderoplysning",
      note: "Oplysning eller krav fra forælder – bør dokumenteres",
    };
  }

  return {
    valid: true,
    status: "fakta",
    note: "Faktuel oplysning udtrukket fra teksten",
  };
}

function buildOutput(claims: Claim[]) {
  const relevant: any[] = [];
  const notRelevant: any[] = [];
  const uncertain: any[] = [];

  const documentedFacts: any[] = [];
  const parentClaims: any[] = [];
  const legalVerified: any[] = [];
  const legalUncertain: any[] = [];
  const actionPoints: string[] = [];

  claims.forEach((c) => {
    const score = scoreClaim(c);
    const validation = validateClaim(c);

    const item = {
      text: c.text,
      type: c.type,
      score: score.toFixed(2),
      valid: validation.valid,
      status: validation.status,
      note: validation.note,
    };

    if (c.type === "fakta") documentedFacts.push(item);
    if (c.type === "påstand") parentClaims.push(item);

    if (c.type === "paragraf" || c.type === "henvisning") {
      if (validation.status === "verificeret" || validation.valid) {
        legalVerified.push(item);
      } else {
        legalUncertain.push(item);
      }
    }

    const lower = c.text.toLowerCase();

    if (
      lower.includes("ppr") ||
      lower.includes("handleplan") ||
      lower.includes("støtte") ||
      lower.includes("aktindsigt") ||
      lower.includes("skriftlig afgørelse") ||
      lower.includes("klagevejledning")
    ) {
      actionPoints.push(c.text);
    }

    if (score >= 0.6) relevant.push(item);
    else if (score >= 0.3) uncertain.push(item);
    else notRelevant.push(item);
  });

  const summary: string[] = [];

  if (documentedFacts.length > 0) {
    summary.push(documentedFacts[0].text);
  }

  if (parentClaims.length > 0) {
    summary.push(parentClaims[0].text);
  }

  const firstLegal =
    legalVerified.length > 0 ? legalVerified[0] : legalUncertain[0];

  if (firstLegal) {
    summary.push(firstLegal.text);
  }

  if (actionPoints.length > 0) {
    summary.push(actionPoints[0]);
  }

  return {
    summary,
    documentedFacts,
    parentClaims,
    legalVerified,
    legalUncertain,
    actionPoints,
    relevant,
    uncertain,
    notRelevant,
  };
}

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({
      summary: [],
      documentedFacts: [],
      parentClaims: [],
      legalVerified: [],
      legalUncertain: [],
      actionPoints: [],
      relevant: [],
      uncertain: [],
      notRelevant: [{ text: "Ingen tekst modtaget" }],
    });
  }

  if (!isCase(text)) {
    return NextResponse.json({
      summary: [],
      documentedFacts: [],
      parentClaims: [],
      legalVerified: [],
      legalUncertain: [],
      actionPoints: [],
      relevant: [],
      uncertain: [],
      notRelevant: [{ text: "Ikke en kommunal sag" }],
    });
  }

  const claims = claimSplit(text);
  const result = buildOutput(claims);

  return NextResponse.json(result);
}