-- One table. Provinces, commodities and UMP live in packages/contract/src/reference.ts.
-- No secondary index: each one would double the row writes against D1 Free's 100,000 per day (docs/adr/0004).
CREATE TABLE prices (
  commodity_id TEXT    NOT NULL,   -- 'cat_1' or 'com_3'
  area_id      INTEGER NOT NULL,   -- 0 national, 1..34 province
  date         TEXT    NOT NULL,   -- ISO yyyy-mm-dd
  price        INTEGER NOT NULL,   -- rupiah per kg
  PRIMARY KEY (commodity_id, area_id, date)
) WITHOUT ROWID;
