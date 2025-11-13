/*
  Warnings:

  - Added the required column `keyConcepts` to the `StudyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `StudyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "deadline" DATETIME NOT NULL,
    "dailyWordCount" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "keyConcepts" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyPlan_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudyDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudyPlan" ("createdAt", "dailyWordCount", "deadline", "documentId", "id", "name", "startDate", "totalDays", "updatedAt", "userId") SELECT "createdAt", "dailyWordCount", "deadline", "documentId", "id", "name", "startDate", "totalDays", "updatedAt", "userId" FROM "StudyPlan";
DROP TABLE "StudyPlan";
ALTER TABLE "new_StudyPlan" RENAME TO "StudyPlan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
