# Online Szavazási Platform

Webprogramozás alapjai – beadandó projekt.

Az alkalmazás egy online szavazási platform, ahol a felhasználók különböző kérdésekről szavazhatnak, saját szavazásokat hozhatnak létre, és megtekinthetik szavazási előzményeiket. Az admin felületen a szavazások kezelhetők (aktiválás, deaktiválás, törlés).

---

## Technológiai stack

| Réteg | Technológia |
|-------|-------------|
| Backend | Node.js + Express |
| Adatbázis | SQLite (Prisma ORM) |
| Hitelesítés | JSON Web Token (JWT) |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Offline mód | Service Worker (Cache API) |
| Tesztelés | Jest + Supertest |

### Választott kiegészítő funkciók
1. **ORM rendszer** – Prisma ORM SQLite adatbázissal
2. **Autentikáció** – JWT alapú hitelesítés
3. **Offline mód** – Service Worker cache-first/network-first stratégiával

---

## Projekt struktúra

```
webprog/
├── prisma/
│   ├── schema.prisma       # Adatbázis séma
│   └── seed.js             # Kezdeti adatok feltöltése
├── public/                 # Statikus frontend fájlok
│   ├── index.html          # Főoldal (szavazások listája)
│   ├── login.html          # Belépés / Regisztráció
│   ├── create-poll.html    # Szavazás létrehozása
│   ├── admin.html          # Admin felület
│   ├── offline.html        # Offline visszaesési oldal
│   ├── sw.js               # Service Worker
│   ├── manifest.json       # PWA manifest
│   ├── css/style.css       # Reszponzív stílusok
│   └── js/
│       ├── api.js          # Közös fetch wrapper (JWT injektálás)
│       ├── app.js          # Főoldal logika
│       ├── auth.js         # Belépés/regisztráció logika
│       ├── create-poll.js  # Szavazás létrehozó form
│       └── admin.js        # Admin panel logika
├── src/
│   ├── server.js           # Express alkalmazás belépési pont
│   ├── middleware/
│   │   └── auth.js         # JWT ellenőrző middleware
│   └── routes/
│       ├── authRoutes.js   # /api/register, /api/login, /api/me
│       ├── pollRoutes.js   # /api/polls, /api/polls/:id
│       ├── voteRoutes.js   # /api/vote
│       └── adminRoutes.js  # /api/admin/polls/*
├── tests/
│   ├── auth.test.js        # Hitelesítési tesztek
│   └── polls.test.js       # Szavazás és vote tesztek
├── screenshots/            # Service Worker offline mód képernyőképei
├── database.sql            # Adatbázis séma SQL formátumban
├── .env.example            # Környezeti változók mintája
└── README.md
```

---

## Telepítés és futtatás

### Előfeltételek
- Node.js >= 18

### Lépések

```bash
# 1. Függőségek telepítése
npm install

# 2. Környezeti változók beállítása
cp .env.example .env
# Szerkeszd a .env fájlt és állítsd be a JWT_SECRET értékét

# 3. Adatbázis létrehozása
npx prisma migrate dev --name init

# 4. Kezdeti adatok feltöltése (admin fiók + demo szavazások)
npx prisma db seed

# 5. Szerver indítása
npm run dev
```

Az alkalmazás elérhető: **http://localhost:3000**

### Tesztek futtatása

```bash
npm test
```

---

## Konfiguráció (.env)

| Változó | Leírás | Alapértelmezett |
|---------|--------|-----------------|
| `PORT` | Szerver portja | `3000` |
| `JWT_SECRET` | JWT aláíró kulcs (kötelező megváltoztatni!) | – |
| `DATABASE_URL` | Prisma adatbázis elérési útvonal | `file:./prisma/dev.db` |

---

## Adatbázis séma

Az adatbázist a Prisma ORM kezeli (`prisma/schema.prisma`). Az egyenértékű SQL DDL a `database.sql` fájlban található.

### Táblák

**User** – felhasználók  
**Poll** – szavazások  
**Option** – szavazási lehetőségek  
**Vote** – leadott szavazatok (`@@unique([userId, pollId])` – egy szavazat/felhasználó/szavazás)

---

## API végpontok

### Nyilvános végpontok

| Metódus | Útvonal | Leírás |
|---------|---------|--------|
| `GET` | `/api/polls` | Aktív szavazások listája opciókkal és szavazatszámokkal |
| `GET` | `/api/polls/:id` | Egy szavazás részletei |
| `POST` | `/api/register` | Regisztráció (`username`, `email`, `password`) → `{ token }` |
| `POST` | `/api/login` | Belépés (`email`, `password`) → `{ token, user }` |

### JWT-vel védett végpontok

> Header: `Authorization: Bearer <token>`

| Metódus | Útvonal | Leírás |
|---------|---------|--------|
| `GET` | `/api/me` | Saját profil és szavazási előzmények |
| `POST` | `/api/polls` | Új szavazás létrehozása (`question`, `options: string[]`) |
| `POST` | `/api/vote` | Szavazat leadása (`optionId: number`) |

### Admin végpontok (JWT + admin szerep)

| Metódus | Útvonal | Leírás |
|---------|---------|--------|
| `GET` | `/api/admin/polls` | Összes szavazás (aktív és inaktív) |
| `PATCH` | `/api/admin/polls/:id` | Állapot módosítása (`isActive: boolean`) |
| `DELETE` | `/api/admin/polls/:id` | Szavazás törlése (cascade) |

### Válasz példák

**`GET /api/polls`**
```json
[
  {
    "id": 1,
    "question": "Mi legyen a következő projekt nyelve?",
    "isActive": true,
    "totalVotes": 12,
    "options": [
      { "id": 1, "text": "JavaScript", "voteCount": 7 },
      { "id": 2, "text": "Python", "voteCount": 5 }
    ]
  }
]
```

**`POST /api/vote`** body: `{ "optionId": 1 }`  
→ `200 { "message": "Szavazat sikeresen leadva!", "vote": { ... } }`  
→ `409 { "error": "Erre a szavazásra már szavaztál." }`

---

## Admin fiók

Az `npx prisma db seed` parancs létrehozza az alapértelmezett admin fiókot:

- **Email:** `admin@voting.local`  
- **Jelszó:** `admin123`

---

## Offline mód (Service Worker)

A Service Worker (`public/sw.js`) az alábbi stratégiát alkalmazza:

- **Statikus fájlok** (HTML, CSS, JS): Cache-First – először a gyorsítótárból tölt, hálózati hiba esetén is működik
- **API hívások** (`/api/*`): Network-First – friss adatot próbál tölteni, hálózati hiba esetén visszaesik a gyorsítótárra
- **Offline navigáció**: ismeretlen oldalak esetén az `offline.html` oldalt jeleníti meg

A gyorsítótár az első látogatáskor épül fel. Ezt követően az alkalmazás alapvető funkciói internet nélkül is elérhetők.

Képernyőképek az offline módról: `screenshots/` mappa.

---

## Tesztek

```
tests/auth.test.js   – regisztráció és belépés tesztek (4 eset)
tests/polls.test.js  – szavazások és szavazat leadás tesztek (6 eset)
```

Az összes teszt izolált SQLite adatbázist (`prisma/test.db`) használ, amely minden teszt előtt törlődik.
