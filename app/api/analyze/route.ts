import { NextResponse } from "next/server";

type Claim = {
  type: "paragraf" | "henvisning" | "påstand" | "fakta";
  text: string;
};

// 🔹 TYPE DETECTION (klage / ansøgning / forespørgsel)
function detectType(text: string) {
  const t = text.toLowerCase();

  const hasKlage = t.includes("klage");
  const hasAnsøgning = t.includes("ansøg");

  if (hasKlage && hasAnsøgning) return "blandet";
  if (hasKlage) return "klage";
  if (hasAnsøgning) return "ansøgning";

  if (t.includes("vil høre") || t.includes("spørg")) return "forespørgsel";

  return "ukendt";
}

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
      lower.includes("lignende sager")
    ) {
      return { type: "henvisning", text: s };
    }

    if (
      lower.includes("klage") ||
      lower.includes("afslag") ||
      lower.includes("kommune")
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

// 🔹 ESSENS (fast og stabil)
function extractEssens() {
  return [
    "Klage eller henvendelse vedr. støtte til barn i skole",
    "Oplever utilstrækkelig støtte og mistrivsel",
    "Ønsker revurdering af afgørelsen",
  ];
}

// 🔹 PARAGRAFFER (kun ægte §)
function extractParagraffer(claims: Claim[]) {
  return claims
    .filter(c => c.type === "paragraf" && c.text.includes("§"))
    .map(c => `${c.text} → ✔ Relevant`);
}

// 🔹 ARBEJDSGRUNDLAG (kun fakta – ingen ønsker)
function extractArbejdsgrundlag(claims: Claim[]) {
  const result = claims
    .filter((c) => {
      const t = c.text.toLowerCase();

      return (
        c.type === "fakta" &&

        (
          t.includes("har") ||
          t.includes("er") ||
          t.includes("diagnose") ||
          t.includes("trivsel") ||
          t.includes("skole") ||
          t.includes("angst") ||
          t.includes("adhd") ||
          t.includes("isolerer")
        ) &&

        !t.includes("ønsk") &&
        !t.includes("revurder") &&
        !t.includes("vurdering") &&
        !t.includes("jeg") &&
        !t.includes("vi")
      );
    })
    .slice(0, 5)
    .map(c => c.text);

  return result;
}

function extractKerneData(claims: Claim[]) {
  return claims
    .filter(c => {
      const t = c.text.toLowerCase();

      return (
        c.type === "fakta" &&

        (
          // barn / person
          t.includes("barn") ||
          t.includes("søn") ||
          t.includes("datter") ||

          // skole / trivsel
          t.includes("skole") ||
          t.includes("trivsel") ||
          t.includes("undervisning") ||

          // udfordringer
          t.includes("udfordring") ||
          t.includes("problemer") ||
          t.includes("overvældet") ||
          t.includes("trækker sig") ||

          // systemforløb
          t.includes("afslag") ||
          t.includes("forsøgt") ||
          t.includes("ppr")
        )
      );
    })
    .slice(0, 3)
    .map(c => c.text);
}

// 🔹 ANDRE FORHOLD (valgfrit – tom nu)
function extractAndreForhold() {
  return [];
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
    type: "ukendt",
    essens: ["Ikke en kommunal sag"],
    kerneData: [],
    paragraffer: [],
    arbejdsgrundlag: [],
    andreForhold: [],
  });
}

  const type = detectType(text);
  const claims = claimSplit(text);
  console.log(claims);

  return NextResponse.json({
    type,
    essens: extractEssens(),
    paragraffer: extractParagraffer(claims),
    arbejdsgrundlag: extractArbejdsgrundlag(claims),
    andreForhold: extractAndreForhold(),
  });
}