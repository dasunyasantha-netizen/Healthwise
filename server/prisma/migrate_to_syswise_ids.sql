-- HealthWise → SysWise integer ID migration
-- Run ONCE on healthwise_db after deploying new code.
-- Maps existing UUID userId columns to SysWise integer IDs.
-- Only 1 real user: Dasun Don (phone +94760786776) → syswise_id=2
-- Test user (test@test.com / 0771234567) has no SysWise account — data dropped.

BEGIN;

-- 1. Create Session table
CREATE TABLE IF NOT EXISTS "Session" (
    "userId"       INTEGER NOT NULL PRIMARY KEY,
    "syswiseToken" TEXT    NOT NULL,
    "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Add integer columns alongside existing String userId columns
ALTER TABLE "Settings"          ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "WorkoutPlan"       ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "WorkoutSession"    ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "MealLog"           ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "FastingSession"    ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "Habit"             ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "HabitCompletion"   ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "HealthMeasurement" ADD COLUMN IF NOT EXISTS "userIdInt" INTEGER;
ALTER TABLE "Exercise"         ADD COLUMN IF NOT EXISTS "createdByUserIdInt" INTEGER;

-- 3. Populate via hardcoded mapping (phone → syswise_id)
--    +94760786776 → 2 (Dasun Don)
UPDATE "Settings" s
SET "userIdInt" = 2
FROM "User" u WHERE s."userId" = u.id AND u.phone = '+94760786776';

UPDATE "WorkoutPlan" wp
SET "userIdInt" = 2
FROM "User" u WHERE wp."userId" = u.id AND u.phone = '+94760786776';

UPDATE "WorkoutSession" ws
SET "userIdInt" = 2
FROM "User" u WHERE ws."userId" = u.id AND u.phone = '+94760786776';

UPDATE "MealLog" ml
SET "userIdInt" = 2
FROM "User" u WHERE ml."userId" = u.id AND u.phone = '+94760786776';

UPDATE "FastingSession" fs
SET "userIdInt" = 2
FROM "User" u WHERE fs."userId" = u.id AND u.phone = '+94760786776';

UPDATE "Habit" h
SET "userIdInt" = 2
FROM "User" u WHERE h."userId" = u.id AND u.phone = '+94760786776';

UPDATE "HabitCompletion" hc
SET "userIdInt" = 2
FROM "User" u WHERE hc."userId" = u.id AND u.phone = '+94760786776';

UPDATE "HealthMeasurement" hm
SET "userIdInt" = 2
FROM "User" u WHERE hm."userId" = u.id AND u.phone = '+94760786776';

UPDATE "Exercise" e
SET "createdByUserIdInt" = 2
FROM "User" u WHERE e."createdByUserId" = u.id AND u.phone = '+94760786776';

-- Also update Settings height → keep as-is, column already added to Settings schema
-- Copy height from User to Settings
UPDATE "Settings" s
SET "height" = u.height
FROM "User" u
WHERE s."userId" = u.id AND u.height IS NOT NULL
  AND s."userIdInt" IS NOT NULL;

-- 4. Delete rows belonging to unmapped (test) users
DELETE FROM "Settings"          WHERE "userIdInt" IS NULL;
DELETE FROM "WorkoutPlan"       WHERE "userIdInt" IS NULL;
DELETE FROM "WorkoutSession"    WHERE "userIdInt" IS NULL;
DELETE FROM "MealLog"           WHERE "userIdInt" IS NULL;
DELETE FROM "FastingSession"    WHERE "userIdInt" IS NULL;
DELETE FROM "Habit"             WHERE "userIdInt" IS NULL;
DELETE FROM "HabitCompletion"   WHERE "userIdInt" IS NULL;
DELETE FROM "HealthMeasurement" WHERE "userIdInt" IS NULL;

-- 5. Drop old FK constraints
ALTER TABLE "Settings"          DROP CONSTRAINT IF EXISTS "Settings_userId_fkey";
ALTER TABLE "WorkoutPlan"       DROP CONSTRAINT IF EXISTS "WorkoutPlan_userId_fkey";
ALTER TABLE "WorkoutSession"    DROP CONSTRAINT IF EXISTS "WorkoutSession_userId_fkey";
ALTER TABLE "MealLog"           DROP CONSTRAINT IF EXISTS "MealLog_userId_fkey";
ALTER TABLE "FastingSession"    DROP CONSTRAINT IF EXISTS "FastingSession_userId_fkey";
ALTER TABLE "Habit"             DROP CONSTRAINT IF EXISTS "Habit_userId_fkey";
ALTER TABLE "HabitCompletion"   DROP CONSTRAINT IF EXISTS "HabitCompletion_userId_fkey";
ALTER TABLE "HealthMeasurement" DROP CONSTRAINT IF EXISTS "HealthMeasurement_userId_fkey";
ALTER TABLE "Exercise"          DROP CONSTRAINT IF EXISTS "Exercise_createdByUserId_fkey";

-- Drop unique constraint on Settings.userId
ALTER TABLE "Settings" DROP CONSTRAINT IF EXISTS "Settings_userId_key";

-- 6. Drop old string columns
ALTER TABLE "Settings"          DROP COLUMN "userId";
ALTER TABLE "WorkoutPlan"       DROP COLUMN "userId";
ALTER TABLE "WorkoutSession"    DROP COLUMN "userId";
ALTER TABLE "MealLog"           DROP COLUMN "userId";
ALTER TABLE "FastingSession"    DROP COLUMN "userId";
ALTER TABLE "Habit"             DROP COLUMN "userId";
ALTER TABLE "HabitCompletion"   DROP COLUMN "userId";
ALTER TABLE "HealthMeasurement" DROP COLUMN "userId";
ALTER TABLE "Exercise"          DROP COLUMN "createdByUserId";

-- 7. Rename int columns
ALTER TABLE "Settings"          RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "WorkoutPlan"       RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "WorkoutSession"    RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "MealLog"           RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "FastingSession"    RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "Habit"             RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "HabitCompletion"   RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "HealthMeasurement" RENAME COLUMN "userIdInt"          TO "userId";
ALTER TABLE "Exercise"          RENAME COLUMN "createdByUserIdInt" TO "createdByUserId";

-- 8. Restore unique constraint on Settings.userId
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_key" UNIQUE ("userId");

-- 9. Add height column to Settings if not already present (in case schema not yet applied)
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION;

-- 10. Drop User table
DROP TABLE IF EXISTS "User";

COMMIT;
