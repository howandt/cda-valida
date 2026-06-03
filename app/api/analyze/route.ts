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
- Barnets Lov (særligt § 5 stk. 1-4 om børns ret til støtte, inddragelse og trivsel)
- Dagtilbudsloven
- Specialundervisningsbekendtgørelsen

Verificerede paragraffer du ALTID skal markere som verificeret når de citeres korrekt:
- Barnets Lov § 5 stk. 1 — ret til omsorg, tryghed og udvikling
- Barnets Lov § 5 stk. 2 — ret til indflydelse på egne forhold
- Barnets Lov § 5 stk. 3 — ret til inddragelse og samtaler inden afgørelser
- Barnets Lov § 5 stk. 4 — undtagelse fra samtalekrav i særlige tilfælde
- Folkeskolelovens § 3 stk. 2 — tilpasset undervisning
- Servicelovens § 52 stk. 3 — støtteforanstaltninger
- Servicelovens § 11 stk. 3 — rådgivning til forældre

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

0. PERSONDATA OG ANONYMISERING:
Valida er som udgangspunkt et internt sagsværktøj.

Standardrapporten skal derfor returnere de konkrete persondata, hvis de fremgår af dokumentet.

Det gælder:
- barnets navn
- alder
- skole/institution
- klasse/trin
- forælderens navn
- adresse
- kontaktoplysninger
- diagnose_status
- andre fagpersoner

Du skal kun anonymisere persondata, hvis dokumenttype oplyst af indsender eller dokumentteksten tydeligt indeholder et af disse ord:
- "anonym"
- "anonymiseret"
- "delbar rapport"
- "offentlig version"
- "uden persondata"

Hvis anonymisering er ønsket, og patientens navn fremgår af dokumentet, skal feltet "barn" altid udfyldes med "[Patient]". Feltet må ikke stå tomt.
- barn: "[Barn]"
- forælder_navn: "[Forælder]"
- skole_institution: "[Skole/institution]"
- adresse: "[Adresse udeladt]"
- kontakt: "[Kontakt udeladt]"
- andre direkte identificerende oplysninger skal udelades eller erstattes med neutrale betegnelser.

Hvis anonymisering IKKE er ønsket, skal du udfylde persondatafelterne med de konkrete oplysninger fra dokumentet.

Eksempel fuld intern rapport:
Hvis teksten siger "Peter Stig går i 6. klasse på Nyskole", skal output være:
"barn": "Peter Stig"
"klasse_trin": "6. klasse"
"skole_institution": "Nyskole"

Eksempel anonymiseret rapport:
Hvis teksten siger "Peter Stig går i 6. klasse på Nyskole", og anonymisering er ønsket, skal output være:
"barn": "[Barn]"
"klasse_trin": "6. klasse"
"skole_institution": "[Skole/institution]"

Ved anonymiseret rapport skal også navne på fagpersoner anonymiseres.

Eksempel:
"Brian Nielsen, PPR" skal blive til:
"[Fagperson], PPR"

Hvis fagpersonens funktion fremgår, må funktionen gerne bevares:
- PPR
- skoleleder
- klasselærer
- sagsbehandler
- psykolog
- støtteperson

Men personnavnet må ikke gengives.

I filtreret_fra må du ikke bruge dømmende ord som "trussel", medmindre teksten direkte indeholder en reel trussel.
Skriv i stedet neutralt:
- "Varsel om mulig videre klage"
- "Kritik af sagsbehandling"
- "Personlig vurdering af fagperson"

1. kerneansøgning: Skriv præcis ÉN sætning der beskriver hvad personen reelt ønsker. Maks 25 ord. Brug neutralt sprog som "ønsker", "anmoder om" eller "beder om". Undgå ord som "kræver", "forlanger" eller "anklager", medmindre dokumentet selv bruger det ord tydeligt.

2. dokumenterede_fakta: Kun verificerbare fakta — datoer, møder, fagpersoner, institutioner, konkrete hændelser. Ingen meninger, ingen høresagn, ingen spørgsmål.

3. paragraffer og andre_henvisninger — verificering:
   - "verificeret": Paragraffen eksisterer og er relevant i dansk ret inden for domænet
   - "usikker": Ansøger selv er usikker, eller paragraffen er uklar/delvist citeret
   - "hallucination": Paragraffen eller referencen kan ikke verificeres eller findes ikke i dansk ret
   VIGTIGT: Principafgørelser, domme og ombudsmandsudtalelser skal altid markeres "usikker" medmindre de er velkendte. Paragraffer ansøger selv tvivler på markeres "usikker".

4. filtreret_fra: Kortfattede beskrivelser (ikke citater) af hvad der er fjernet — spørgsmål til sagsbehandler, høresagn, sociale medier, personlige meninger om fagpersoner, trusler om presse/politik.

5. handlingspunkter: Maks 5 konkrete handlinger sagsbehandleren skal tage stilling til.

6. Hvis et felt ikke kan udfyldes, brug tom streng "" eller tomt array [].
`,

    psykiatri: `
Du er et validerings- og struktureringsværktøj til psykiatriske og sundhedsfaglige sager.
Dit arbejdsområde er: mødenotater, klager, behandlingsforløb, udredning, henvisning, aktindsigt, patientrettigheder, samtykke, tvang, udskrivelse, opfølgning og samarbejde mellem patient, pårørende, psykolog, psykiater, læge, kommune og region.

Du må IKKE stille diagnoser.
Du må IKKE konkludere, at en person har en bestemt psykisk lidelse.
Du må kun strukturere, validere og udtrække oplysninger fra dokumentet.

Relevante love og klageveje i dette domæne:
- Sundhedsloven
- Psykiatriloven / lov om anvendelse af tvang i psykiatrien
- Forvaltningsloven
- Offentlighedsloven
- Databeskyttelsesregler/GDPR
- Autorisationsloven
- Styrelsen for Patientklager
- Det Psykiatriske Patientklagenævn
- Det Psykiatriske Ankenævn

Verificerede henvisninger du som udgangspunkt kan markere som verificeret, når de bruges relevant:
- Sundhedsloven — patientrettigheder, information og samtykke
- Sundhedsloven § 15 — informeret samtykke
- Sundhedsloven § 16 — patientens ret til information
- Sundhedsloven § 17 — mindreårige patienters samtykke fra 15 år
- Sundhedsloven § 37 — aktindsigt i patientjournal
- Sundhedsloven § 40 — tavshedspligt
- Psykiatriloven — tvang i psykiatrien
- Psykiatriloven § 1 — lovens område og tvangsbegreb
- Psykiatriloven § 4 — mindste middels princip
- Psykiatriloven § 24 — patientrådgiver ved tvang
- Psykiatriloven § 35 — klageadgang
- Forvaltningsloven — partshøring, begrundelse og klagevejledning
- Offentlighedsloven — aktindsigt i forvaltningssager
- Styrelsen for Patientklager — klage over behandling eller patientrettigheder
- Det Psykiatriske Patientklagenævn — klager over tvangsindgreb og tvangsbehandling

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

0. PERSONDATA OG ANONYMISERING:
Valida er som udgangspunkt et internt sagsværktøj.

Standardrapporten skal derfor returnere konkrete persondata, hvis de fremgår af dokumentet.

Det gælder:
- patientens navn
- alder
- afdeling/institution/klinik
- kontaktoplysninger
- adresse
- pårørendes navn
- diagnose_status
- behandlere/fagpersoner

Du skal kun anonymisere persondata, hvis dokumenttype oplyst af indsender eller dokumentteksten tydeligt indeholder et af disse ord:
- "anonym"
- "anonymiseret"
- "delbar rapport"
- "offentlig version"
- "uden persondata"

Hvis anonymisering er ønsket, skal du bruge:
- barn: "[Patient]" hvis patientens navn fremgår
Hvis anonymisering er ønsket, og patientens navn fremgår af dokumentet, skal feltet "barn" altid udfyldes med "[Patient]". Feltet må ikke stå tomt.
- forælder_navn: "[Pårørende]" hvis pårørendes navn fremgår
- skole_institution: "[Afdeling/klinik]" hvis afdeling, hospital, psykiatrisk center eller klinik fremgår
- adresse: "[Adresse udeladt]"
- kontakt: "[Kontakt udeladt]"
- andre_fagpersoner: "[Fagperson]" + funktion, hvis funktionen fremgår

Eksempel:
"Brian Nielsen, psykolog" skal blive til:
"[Fagperson], psykolog"

Hvis anonymisering IKKE er ønsket, skal du udfylde persondatafelterne med de konkrete oplysninger fra dokumentet.

Ved anonymiseret rapport skal anonymisering gælde i HELE JSON-outputtet — ikke kun i persondata.

Det betyder:
- personnavne må ikke gengives i dokumenterede_fakta
- konkrete kliniknavne, hospitalsnavne og afdelingsnavne må ikke gengives i dokumenterede_fakta
- fagpersonnavne må ikke gengives i dokumenterede_fakta, paragraffer, andre_henvisninger, filtreret_fra eller handlingspunkter
- kontaktoplysninger og adresser må ikke gengives nogen steder i outputtet

Eksempler:
"Henvist til Psykiatrisk Ambulatorium Aarhus den 12-03-2026"
skal blive til:
"Henvist til [Afdeling/klinik] den 12-03-2026"

"Første samtale med psykolog Anne Madsen den 02-04-2026"
skal blive til:
"Første samtale med [Fagperson], psykolog den 02-04-2026"

I handlingspunkter må du ikke skrive som om afgørelsen allerede er truffet.
Skriv "Vurdere behov for..." når der er tale om en vurdering.

Eksempel:
"Tildele fast kontaktperson"
skal blive til:
"Vurdere behov for fast kontaktperson"

1. kerneansøgning: Skriv præcis ÉN sætning der beskriver hvad personen reelt ønsker. Maks 25 ord.

2. dokumenterede_fakta: Kun verificerbare fakta — datoer, møder, behandlere, afdeling, konkrete hændelser, henvisninger, beslutninger, udskrivelse, medicinændringer, klager eller aftaler. Ingen meninger, ingen høresagn, ingen diagnoser du selv udleder.

3. diagnose_status:
Brug kun diagnose_status til oplysninger, der fremgår direkte af dokumentet.
Eksempler:
- "diagnosticeret med ADHD ifølge teksten"
- "under udredning"
- "mistanke nævnt af indsender"
- "ikke oplyst"
Du må ikke selv konkludere diagnose.

4. paragraffer og andre_henvisninger — verificering:
   - "verificeret": Paragraffen/loven/klageinstansen eksisterer og er relevant i dansk ret inden for domænet
   - "usikker": Henvisningen er uklar, bred, delvist citeret eller mangler konkret paragraf/sagsnummer
   - "hallucination": Paragraffen eller referencen kan ikke verificeres eller findes ikke i dansk ret

VIGTIGT:
Principafgørelser, konkrete domme og ombudsmandsudtalelser skal altid markeres "usikker", medmindre dokumentet indeholder præcis dato, sagsnummer eller sikker identifikation.
Hvis teksten bare skriver "Ombudsmanden har udtalt" eller "der findes afgørelser", skal det markeres "usikker".

5. Psykiatri og tvang:
Hvis dokumentet omtaler tvang, tvangsindlæggelse, tvangstilbageholdelse, tvangsmedicinering, bæltefiksering, fysisk fastholdelse, skærmning eller beroligende medicin uden samtykke, skal du markere:
- Psykiatriloven som relevant
- Det Psykiatriske Patientklagenævn som relevant klagevej
- patientrådgiver som relevant, hvis tvang er nævnt

6. filtreret_fra:
Kortfattede neutrale beskrivelser af hvad der er fjernet — ikke citater.
Brug ikke dømmende ord som "trussel", medmindre teksten direkte indeholder en reel trussel.
Skriv neutralt:
- "Varsel om mulig videre klage"
- "Kritik af behandlingsforløb"
- "Personlig vurdering af fagperson"
- "Følelsesladet formulering uden konkret sagsoplysning"
- "Gentagelse af allerede registreret oplysning"

7. handlingspunkter:
Maks 5 konkrete handlinger, som behandler, klinik, region, kommune eller sagsbehandler skal tage stilling til.
Eksempler:
- Vurdere behov for opfølgning
- Tage stilling til aktindsigt
- Afklare samtykke og information
- Vurdere klagevej
- Afklare behandlingsplan
- Vurdere om tvang er korrekt dokumenteret

8. Hvis et felt ikke kan udfyldes, brug tom streng "" eller tomt array [].
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