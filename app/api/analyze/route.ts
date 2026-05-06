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
priority: number;
};

function splitLines(text: string) {
return text
.split(/\n|(?<=[.!?])\s+/)
.map((s) => s.trim())
.filter(Boolean);
}

function isListFragment(text: string) {
return (
text.length < 60 &&
!text.includes(".") &&
!text.includes("?")
);
}

function normalize(text: string) {
return text.toLowerCase().trim();
}

function classifyClaim(sentence: string): Claim {
const t = normalize(sentence);

// 🔹 META / STRATEGI / AI-STØJ
if (
t.includes("jeg har fået at vide") ||
t.includes("jeg har hørt") ||
t.includes("facebook") ||
t.includes("chatgpt") ||
t.includes("bedre chance") ||
t.includes("hvordan skal jeg skrive") ||
t.includes("hvordan kan jeg være sikker") ||
t.includes("andre forældre") ||
t.includes("en bekendt") ||
t.includes("man skal skrive")
) {
return {
type: "meta",
text: sentence,
priority: 1,
};
}

// 🔹 PARAGRAFFER
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
priority: 2,
};
}

// 🔹 HENVISNINGER
if (
t.includes("ankestyrelsen") ||
t.includes("ombudsmand") ||
t.includes("principafgørelse") ||
t.includes("domspraksis")
) {
return {
type: "henvisning",
text: sentence,
priority: 1,
};
}

// 🔹 ØNSKER
if (
t.includes("jeg ønsker") ||
t.includes("vi ønsker") ||
t.includes("jeg vil gerne") ||
t.includes("anmoder om") ||
t.includes("søger hjælp") ||
t.includes("hjælp til") ||
t.includes("muligheder for") ||
t.includes("vurdering af")
) {
return {
type: "ønske",
text: sentence,
priority: 2,
};
}

// 🔹 ALVORLIGE BELASTNINGSSIGNALER
if (
t.includes("ikke i skole") ||
t.includes("skolefravær") ||
t.includes("græder") ||
t.includes("låser sig inde") ||
t.includes("gemmer sig") ||
t.includes("løbet væk") ||
t.includes("ikke mening") ||
t.includes("selvmord") ||
t.includes("udbrud") ||
t.includes("affekt") ||
t.includes("sover dårligt") ||
t.includes("sygemeldt") ||
t.includes("stresssymptomer") ||
t.includes("påvirker hele familien")
) {
return {
type: "belastning",
text: sentence,
priority: 5,
};
}

// 🔹 EMOTION
if (
t.includes("jeg føler") ||
t.includes("jeg er bange") ||
t.includes("jeg er træt") ||
t.includes("desperat") ||
t.includes("ingen lytter")
) {
return {
type: "emotion",
text: sentence,
priority: 1,
};
}

// 🔹 FAKTA
if (
t.includes("adhd") ||
t.includes("autisme") ||
t.includes("angst") ||
t.includes("skole") ||
t.includes("ppr") ||
t.includes("barn") ||
t.includes("søn") ||
t.includes("datter") ||
t.includes("støtte") ||
t.includes("trivsel") ||
t.includes("diagnose")
) {
return {
type: "fakta",
text: sentence,
priority: 3,
};
}

return {
type: "uklar",
text: sentence,
priority: 0,
};
}

function buildClaims(text: string): Claim[] {
const lines = splitLines(text);

const claims: Claim[] = [];

let currentContext: ClaimType | null = null;

for (const line of lines) {
const claim = classifyClaim(line);

// 🔹 Listepunkter arver kontekst
if (
  isListFragment(line) &&
  currentContext === "ønske"
) {
  claims.push({
    type: "ønske",
    text: line,
    priority: 2,
  });

  continue;
}

if (claim.type !== "uklar") {
  currentContext = claim.type;
}

claims.push(claim);

}

return claims;
}

function detectType(claims: Claim[]) {
const hasØnske = claims.some(
(c) => c.type === "ønske"
);

const hasBelastning = claims.some(
(c) => c.type === "belastning"
);

const hasParagraf = claims.some(
(c) => c.type === "paragraf"
);

if (hasØnske && hasBelastning) {
return "ansøgning";
}

if (hasBelastning && hasParagraf) {
return "klage";
}

return "uklar";
}

function extractEssens(claims: Claim[]) {
const result: string[] = [];

if (
claims.some((c) => c.type === "fakta")
) {
result.push(
"Sagen indeholder konkrete oplysninger om barn/familie"
);
}

if (
claims.some((c) => c.type === "belastning")
) {
result.push(
"Der beskrives belastning og mistrivsel"
);
}

if (
claims.some((c) => c.type === "ønske")
) {
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
.filter(
(c) =>
c.type === "fakta" ||
c.type === "belastning"
)
.filter((c) => c.priority >= 3)
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
.filter((c) => c.priority >= 3)
.slice(0, 10)
.map((c) => c.text);
}

function extractAndreForhold(claims: Claim[]) {
return claims
.filter(
(c) =>
c.type === "emotion" ||
c.type === "meta" ||
c.type === "uklar" ||
c.type === "henvisning"
)
.slice(0, 10)
.map((c) => c.text);
}

export async function POST(req: Request) {
let body;

try {
  body = await req.json();
} catch (error) {
  return NextResponse.json(
    {
      error: "Ugyldig JSON",
    },
    {
      status: 400,
    }
  );
}

const text = body?.text;

if (!text || typeof text !== "string") {
return NextResponse.json(
{
error: "Ingen tekst modtaget",
},
{
status: 400,
}
);
}

const claims = buildClaims(text);

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
