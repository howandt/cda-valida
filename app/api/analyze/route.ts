import { NextResponse } from "next/server";

// ─── MODUL-PROMPTS ─────────────────────────────────────────────────────────────
// Tilføj nye moduler her: handicap, ældre, psykiatri osv.

const MODUL_PROMPTS: Record<string, string> = {
  børn: `
Du er et validerings- og struktureringsværktøj til kommunal sagsbehandling inden for børn og familier.
Dit arbejdsområde er: ansøgninger og klager fra forældre vedrørende deres barn i dagtilbud, folkeskole, specialskole, PPR, støtteforanstaltninger og kommunale ydelser til børn.

Relevante love i dette domæne:
- Folkeskoleloven (særligt § 3, § 12, § 20)
- Serviceloven (særligt § 11, § 40, § 44, § 50, § 52, § 76)
- Barnets Lov
- Dagtilbudsloven
- Specialundervisningsbekendtgørelsen

Din opgave er at analysere det indsendte dokument og returnere præcis følgende JSON-struktur — intet andet, ingen forklaring, ingen markdown:

{
  "type": "klage" | "ansøgning" | "information" | "uklar",
  "persondata": {
    "barn": "",
    "alder": "",
    "skole_institution": "",
    "klasse_trin": "",
    "forælder_navn": "",
    "adresse": "",
    "kontakt": "",
    "diagnose_status": "",
    "andre_fagpersoner": ""
  },
  "kerneansøgning": "",
  "dokumenterede_fakta": [],
  "paragraffer": [
    {
      "tekst": "",
      "status": "verificeret" | "usikker" | "hallucination",
      "note": ""
    }
  ],
  "andre_henvisninger": [
    {
      "tekst": "",
      "status": "verificeret" | "usikker" | "hallucination",
      "note": ""
    }
  ],
  "filtreret_fra": [],
  "handlingspunkter": []
}

REGLER DU SKAL FØLGE STRENGT:

1. kerneansøgning: Skriv præcis ÉN sætning der beskriver hvad ansøger reelt ønsker. Maks 25 ord.

2. dokumenterede_fakta: Kun verificerbare fakta — datoer, møder, fagpersoner, institutioner, konkrete hændelser. Ingen meninger, ingen høresagn, ingen spørgsmål.

3. paragraffer og andre_henvisninger — verificering:
   - "verificeret": Paragraffen eksisterer og er relevant i dansk ret inden for domænet
   - "usikker": Ansøger selv er usikker, eller paragraffen er uklar/delvist citeret
   - "hallucination": Paragraffen eller referencen eksisterer ikke, er opfundet, eller stammer fra andet land
   VIGTIGT: Principafgørelser, domme og ombudsmandsudtalelser skal altid markeres "usikker" medmindre de er velkendte. Paragraffer ansøger selv tvivler på markeres "usikker".

4. filtreret_fra: Kortfattede beskrivelser (ikke citater) af hvad der er fjernet — spørgsmål til sagsbehandler, høresagn, sociale medier, personlige meninger om fagpersoner, trusler om presse/politik.

5. handlingspunkter: Maks 5 konkrete handlinger sagsbehandleren skal tage stilling til.

6. Hvis et felt ikke kan udfyldes, brug tom streng "" eller tomt array [].
`,
};

// ─── HJÆLPEFUNKTION: Byg prompt ───────────────────────────────────────────────

function buildPrompt(modul: string, type: string, text: string): string {
  const modulPrompt = MODUL_PROMPTS[modul] ?? MODUL_PROMPTS["børn"];
  return `${modulPrompt}

Dokumenttype oplyst af indsender: ${type}

DOKUMENT TIL ANALYSE:
${text}`;
}

// ─── API ROUTE ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: { text?: string; type?: string; modul?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const text = body?.text;
  const type = body?.type ?? "ukendt";
  const modul = body?.modul ?? "børn";

  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return NextResponse.json({ error: "Ingen tekst modtaget" }, { status: 400 });
  }

  const prompt = buildPrompt(modul, type, text);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  "anthropic-version": "2023-06-01",
  "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
},
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API fejl:", err);
      return NextResponse.json({ error: "Analysefejl" }, { status: 500 });
    }

    const data = await response.json();
    const raw = data?.content?.[0]?.text ?? "";

    // Strip markdown fences hvis de er der
    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("JSON parse fejl:", clean);
      return NextResponse.json({ error: "Kunne ikke parse analyse" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Netværksfejl:", err);
    return NextResponse.json({ error: "Servicefejl" }, { status: 500 });
  }
}