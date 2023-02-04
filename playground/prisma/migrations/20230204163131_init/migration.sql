-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "view" TEXT NOT NULL DEFAULT 'code',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
