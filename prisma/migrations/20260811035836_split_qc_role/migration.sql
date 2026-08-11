-- Split the QUALITY_UNIT role into HEAD_OF_QC (superset) and QC_USER.
--
-- Existing QUALITY_UNIT users are migrated to HEAD_OF_QC rather than
-- QC_USER: HEAD_OF_QC carries every permission QUALITY_UNIT previously had
-- (plus Section 17 release-decision authority), so this preserves every
-- existing account's current capabilities instead of silently downgrading
-- them. Accounts that should be scoped down to QC_USER can be changed via
-- the admin panel after this migration.
--
-- final_sign_offs.role is re-typed from Role to a new, narrower SignOffRole
-- enum (PRODUCTION_OPERATOR, HEAD_OF_PRODUCTION, QC) because Section 18 has
-- exactly three signature slots, and HEAD_OF_QC / QC_USER must both be able
-- to fill the single "QC" slot (either one provides the required QC
-- co-signature) rather than becoming two separate slots.

-- 1. Re-type final_sign_offs.role first, while it can still read the old
--    Role values, so the old "Role" type is no longer referenced anywhere
--    once we get to step 2.
CREATE TYPE "SignOffRole" AS ENUM ('PRODUCTION_OPERATOR', 'HEAD_OF_PRODUCTION', 'QC');

ALTER TABLE "final_sign_offs"
  ALTER COLUMN "role" TYPE "SignOffRole"
  USING (
    CASE "role"::text
      WHEN 'QUALITY_UNIT' THEN 'QC'
      ELSE "role"::text
    END
  )::"SignOffRole";

-- 2. Recreate the Role enum with HEAD_OF_QC/QC_USER in place of
--    QUALITY_UNIT. Postgres has no ALTER TYPE ... DROP VALUE, so the type
--    has to be swapped: create the new type, migrate the column, drop the
--    old type, rename the new type into its place.
CREATE TYPE "Role_new" AS ENUM ('PRODUCTION_OPERATOR', 'HEAD_OF_PRODUCTION', 'HEAD_OF_QC', 'QC_USER', 'MANAGEMENT_COMPLIANCE', 'SYSTEM_ADMINISTRATOR');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'QUALITY_UNIT' THEN 'HEAD_OF_QC'
      ELSE "role"::text
    END
  )::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
