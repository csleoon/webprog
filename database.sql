-- Online Szavazási Platform - Adatbázis séma (SQLite)
-- Ez a fájl a Prisma migrációk egyenértékű SQL változata, dokumentációs célból.
-- Prisma automatikusan kezeli az adatbázist: npx prisma migrate dev --name init
-- A valós adatbázis: prisma/dev.db

CREATE TABLE IF NOT EXISTS "User" (
    "id"           INTEGER  PRIMARY KEY AUTOINCREMENT,
    "username"     TEXT     NOT NULL UNIQUE,
    "email"        TEXT     NOT NULL UNIQUE,
    "passwordHash" TEXT     NOT NULL,
    "role"         TEXT     NOT NULL DEFAULT 'user',
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Poll" (
    "id"        INTEGER  PRIMARY KEY AUTOINCREMENT,
    "question"  TEXT     NOT NULL,
    "isActive"  INTEGER  NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" INTEGER  REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Option" (
    "id"     INTEGER PRIMARY KEY AUTOINCREMENT,
    "text"   TEXT    NOT NULL,
    "pollId" INTEGER NOT NULL REFERENCES "Poll"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Vote" (
    "id"       INTEGER  PRIMARY KEY AUTOINCREMENT,
    "userId"   INTEGER  NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "optionId" INTEGER  NOT NULL REFERENCES "Option"("id") ON DELETE CASCADE,
    "pollId"   INTEGER  NOT NULL,
    "castAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "pollId")
);

-- Seed: admin fiók (jelszó: admin123, bcrypt hash)
-- A valós hash-t a prisma/seed.js generálja futásidőben.
-- INSERT INTO "User" ("username","email","passwordHash","role")
--   VALUES ('admin','admin@voting.local','$2b$10$...','admin');

-- Seed: demo szavazások
INSERT OR IGNORE INTO "Poll" ("id","question","isActive")
  VALUES (1,'Mi legyen a következő projekt programozási nyelve?',1);
INSERT OR IGNORE INTO "Poll" ("id","question","isActive")
  VALUES (2,'Melyik frontend keretrendszert tanuljuk meg?',1);
INSERT OR IGNORE INTO "Poll" ("id","question","isActive")
  VALUES (3,'Mikor tartsuk a következő csapattalálkozót?',1);

INSERT OR IGNORE INTO "Option" ("id","text","pollId")
  VALUES (1,'JavaScript',1),(2,'Python',1),(3,'Go',1),(4,'Rust',1);
INSERT OR IGNORE INTO "Option" ("id","text","pollId")
  VALUES (5,'React',2),(6,'Vue',2),(7,'Angular',2),(8,'Svelte',2);
INSERT OR IGNORE INTO "Option" ("id","text","pollId")
  VALUES (9,'Hétfőn',3),(10,'Szerdán',3),(11,'Pénteken',3);
