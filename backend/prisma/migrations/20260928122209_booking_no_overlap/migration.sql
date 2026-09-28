CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT booking_valid_range CHECK ("endTime" > "startTime");

ALTER TABLE "Booking"
ADD CONSTRAINT booking_no_overlap
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startTime", "endTime") WITH &&
) WHERE (status <> 'CANCELLED');