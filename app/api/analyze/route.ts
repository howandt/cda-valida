import { NextResponse } from "next/server";

type Claim = {
  type: "paragraf" | "henvisning" | "påstand" | "fakta";
  text: string;
};

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
      lower.includes("afvist") ||
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
    lower.includes("skole")
  );
}

function scoreClaim(claim: Claim) {
  let score = 0;

  if (claim.type === "fakta") score += 0.5;
  if (claim.type === "påstand") score += 0.5;
  if (claim.type === "paragraf") score += 0.6;

  if (claim.text.length > 20) score += 0.2;

  if (claim.type === "henvisning") score -= 0.3;

  return Math.max(0, Math.min(score, 1));
}

function buildOutput(claims: Claim[]) {
  const relevant: any[] = [];
  const notRelevant: any[] = [];
  const uncertain: any[] = [];

  claims.forEach((c) => {
    const score = scoreClaim(c);

    const item = {
      text: c.text,
      score: score.toFixed(2),
    };

    if (score >= 0.6) relevant.push(item);
    else if (score >= 0.3) uncertain.push(item);
    else notRelevant.push(item);
  });

  return { relevant, notRelevant, uncertain };
}

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!isCase(text)) {
    return NextResponse.json({
      relevant: [],
      notRelevant: [{ text: "Ikke en kommunal sag", score: "1.00" }],
      uncertain: [],
    });
  }

  const claims = claimSplit(text);
  const result = buildOutput(claims);

  return NextResponse.json(result);
}