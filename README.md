# NER Figyelo

AI-alapu magyar kozeleti es politikai hiraggregator Nuxt 3, Express, Prisma es PostgreSQL alapon.

## Mit csinal

- RSS es Google News RSS forrasokbol gyujt hireket.
- Csak minimalis metaadatot tarol: cim, max ket mondatos AI-osszefoglalo, forras, datum, eredeti URL, kategoriak, cimkek es szereplok.
- Minden cikk az eredeti forrasra mutat.
- URL, cim-hash es fuzzy cim-egyezes alapjan szuri a duplikatumokat.
- Orankenti cron importot futtat, kezzel is indithato adminbol.
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

2. Allits be eros `ADMIN_TOKEN` erteket az `.env` fajlban.

3. Inditas:

```bash
docker compose up --build
```

4. Seed adatok betoltese kulon terminalbol:

```bash
docker compose exec api npm run prisma:seed --workspace @ner/api
```

5. Megnyitas:

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
- `ADMIN_TOKEN`: admin API muveletekhez.
- `CRON_ENABLED`: cron import be/ki.
- `INITIAL_INGESTION_ENABLED`: indulas utan automatikus elso import.
- `INGESTION_CRON`: node-cron formatum, alapbol orankent.
- `AUTO_APPROVE_ARTICLES`: ha `false`, az uj hirek admin jovahagyasi sorba kerulnek.
- `OPENAI_API_KEY`: opcionalis. Ha nincs megadva, determinisztikus helyi osszegzes/kategorizalas fut.
- `OPENAI_MODEL`: OpenAI modell neve.
- `NUXT_PUBLIC_API_BASE`: bongeszobol hasznalt API base, Docker/Nginx alatt `/api`.
- `NUXT_API_INTERNAL_BASE`: Nuxt SSR belso API base, Docker alatt `http://api:4000/api`.

## API vegpontok

- `GET /api/articles`: listazas es kereses.
- `GET /api/articles/:id`: egy hir.
- `GET /api/stats/home`: trending kategoriak, szereplok, forrasok.
- `GET /api/stats/timeline`: 30 napos napi bontas.
- `GET /api/sources`: RSS forrasok.
- `POST /api/sources`: admin tokennel uj forras.
- `POST /api/admin/ingest`: kezi import.
- `GET /api/admin/prompts`: AI promptok.
- `PUT /api/admin/prompts/:key`: prompt modositas.
- `DELETE /api/admin/cache`: cache urites.

Admin hivasokhoz:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

## Kezdo RSS forrasok

A rendszer indulasakor automatikusan letrehozza az indulasi listat:

- Telex: `https://telex.hu/rss`
- 24.hu Belfold: `https://24.hu/belfold/feed/`
- 444: `https://444.hu/feed/`
- Kontroll.hu: nincs publikus RSS/Atom alternate link; a rendszer a kezdolap cikklinkjeibol csak cimet, URL-t es datumot olvas ki.
- Google News RSS pelda: NER bukas, korrupcio, Balasy, Fidesz keresokifejezesek.

Ezek indulasi konfiguraciok. Production hasznalat elott ellenorizd a kiadok aktualis RSS dokumentaciojat es felhasznalasi felteteleit.

A kezdolapon a `Friss hirek leszedese` gomb a `POST /api/refresh` vegpontot hivja. Ugyanez orankent automatikusan fut a cron schedulerrel, es indulas utan egyszer hatterben is lefut.

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

- Uj forras: admin panel vagy `Source` seed bovitese.
- Uj kategoria: seed vagy AI prompt frissites.
- Mas AI provider: `apps/api/src/services/ai.ts`.
- Mas deduplikacio: `apps/api/src/services/dedupe.ts`.
- Approval workflow: alap status model kesz (`PENDING`, `APPROVED`, `REJECTED`).
