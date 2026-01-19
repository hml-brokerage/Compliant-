-- Add per-occurrence and aggregate limit tracking for General Liability (GL) only
ALTER TABLE "generated_cois"
  -- GL (General Liability) per occurrence and aggregate limits
  ADD COLUMN "glPerOccurrence" DOUBLE PRECISION,
  ADD COLUMN "glAggregate" DOUBLE PRECISION;
