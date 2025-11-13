/*
  Warnings:

  - Added the required column `contentPreview` to the `DailyGoal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wordCount` to the `DailyGoal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyPlanId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "contentPreview" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "reflections" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyGoal_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyGoal" ("completed", "createdAt", "date", "dayNumber", "endIndex", "id", "reflections", "startIndex", "studyPlanId", "updatedAt") SELECT "completed", "createdAt", "date", "dayNumber", "endIndex", "id", "reflections", "startIndex", "studyPlanId", "updatedAt" FROM "DailyGoal";
DROP TABLE "DailyGoal";
ALTER TABLE "new_DailyGoal" RENAME TO "DailyGoal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
