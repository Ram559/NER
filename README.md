# NER Figyelo

AI-alapu magyar kozeleti es politikai hiraggregator Nuxt 3, Express, Prisma es PostgreSQL alapon.

## Mit csinal

- RSS es Google News RSS forrasokbol gyujt hireket.
- Csak minimalis metaadatot tarol: cim, max ket mondatos AI-osszefoglalo, forras, datum, eredeti URL, kategoriak, cimkek es szereplok.
- Minden cikk az eredeti forrasra mutat.
- URL, cim-hash es fuzzy cim-egyezes alapjan szuri a duplikatumokat.
- 10 percenként automatikus cron importot futtat.
- SSR frontend, sitemap, robots.txt, OpenGraph meta es canonical-baratra kesz struktura.

## Stack

- Frontend: Vue 3 + Nuxt 3 + TailwindCSS
- Backend: Node.js + Express + TypeScript
- DB/ORM: PostgreSQL + Prisma
- Scheduler: node-cron
- Deployment: Docker Compose + Nginx reverse proxy

## Gyors inditas Dockerrel

1. Masold az env sablont:

```bash
cp .env.example .env
```

2. Indítás:

```bash
docker compose up --build
```

3. Seed adatok betoltese kulon terminalbol:

```bash
docker compose exec api npm run prisma:seed --workspace @ner/api
```

4. Megnyitas:

- Web: http://localhost:8080
- API health: http://localhost:8080/api/health
- Sitemap: http://localhost:8080/sitemap.xml

## Lokal fejlesztes

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

Fejleszteshez helyi PostgreSQL kell, vagy futtathato csak az adatbazis Dockerbol:

```bash
docker compose up postgres
```

## Fontos env valtozok

- `DATABASE_URL`: PostgreSQL kapcsolat.
- `PRETTY_LOGS`: fejleszteshez `true`, Docker production futashoz maradjon `false`.
- `CRON_ENABLED`: cron import be/ki.
- `INITIAL_INGESTION_ENABLED`: indulas utan automatikus elso import.
- `INGESTION_CRON`: node-cron formátum, alapból 10 percenként.
- `AUTO_APPROVE_ARTICLES`: ha `false`, az új hírek későbbi moderációs folyamatra váró állapotba kerülnek.
- `OPENAI_API_KEY`: opcionalis. Ha nincs megadva, determinisztikus helyi osszegzes/kategorizalas fut.
- `OPENAI_MODEL`: OpenAI modell neve.
- `NUXT_PUBLIC_API_BASE`: bongeszobol hasznalt API base, Docker/Nginx alatt `/api`.
- `NUXT_API_INTERNAL_BASE`: Nuxt SSR belso API base, Docker alatt `http://api:4000/api`.

## API vegpontok

- `GET /api/articles`: listazas es kereses.
- `GET /api/articles/:id`: egy hir.
- `GET /api/stats/home`: trending kategoriak, szereplok, forrasok.
- `GET /api/stats/timeline`: 30 napos napi bontas.
- `GET /api/sources`: aktív RSS források.

## Kezdo RSS forrasok

A rendszer indulasakor automatikusan letrehozza az indulasi listat:

- Telex: `https://telex.hu/rss`
- 24.hu Belfold: `https://24.hu/belfold/feed/`
- 444: `https://444.hu/feed/`
- Google News RSS pelda: NER bukas, korrupcio, Balasy, Fidesz keresokifejezesek.
- Reddit r/hungary kereső RSS: NER, Orbán, Rogán, korrupció, közbeszerzés, EU pénzek, propaganda és állami tender kulcsszavak.

Ezek indulasi konfiguraciok. Production hasznalat elott ellenorizd a kiadok aktualis RSS dokumentaciojat es felhasznalasi felteteleit.

A frissítés 10 percenként automatikusan fut a cron schedulerrel, és indulás után egyszer háttérben is lefut. A publikus kézi frissítés alapértelmezetten ki van kapcsolva.

## AI prompt pelda

A seedelt `article-analysis` prompt lenyege:

```text
Analyze Hungarian public affairs news.
Return strict JSON with summary, categories, tags and persons.
The summary must be Hungarian, original, maximum two short sentences,
and must not copy source wording.
Use only the title and RSS snippet. Never invent unsupported facts.
```

## Jogi kockazatcsokkentes

- A rendszer nem ment teljes cikket.
- A feed snippet nem kerul adatbazisba cikk-szovegkent.
- Az osszefoglalo AI altal generalt, max ket mondat.
- Minden hirnel lathato a forras es az eredeti URL.
- Az outbound link `nofollow` es uj ablakban nyilik.
- A feed fetch robots.txt ellenorzest hasznal, ha a forrasnal be van kapcsolva.
- Van `/disclaimer` oldal.

## Bovithetoseg

- Uj forras: `apps/api/src/services/bootstrap.ts` seed bovitese.
- Uj kategoria: seed vagy AI prompt frissites.
- Mas AI provider: `apps/api/src/services/ai.ts`.
- Mas deduplikacio: `apps/api/src/services/dedupe.ts`.
- Approval workflow: alap status model kesz (`PENDING`, `APPROVED`, `REJECTED`).
