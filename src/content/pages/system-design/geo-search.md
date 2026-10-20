---
failureModes:
- Sorting the entire driver table by distance on every request.
- A geohash query that misses neighbors across a cell boundary.
- Using straight-line distance when the product promise is drive time.
- A hot cell (downtown at dinner) that is one shard and one hotspot.
sayThis:
- I will index drivers by geohash or by a grid cell, query the cell and its neighbors, then
  sort that small set by distance.
- Straight-line distance is the index. If the rider cares about ETA I will refine the top
  candidates with a routing service, not the whole city.
- Cells in the core of the city are hot. I will split those cells further or cache the candidate
  list for a second.
gaps:
- There is a public proximity deep dive, and the pattern index lists proximity services, but
  the pattern article itself is paywalled. The free deep dive is easy to treat as a Redis
  GEO tutorial and miss cell-boundary underfetch and ETA versus distance.
- Updating location at high frequency (a moving driver) is a write-scaling problem sitting
  next to the read. Many answers only design the query.
- Privacy (not storing a precise trail forever, coarsening stored points) is absent from the
  usual geo chapter and matters for a real dispatch system.
references:
- title: Hello Interview, public proximity search
  url: https://www.hellointerview.com/learn/system-design/deep-dives/proximity-search
- title: Redis, GEO commands
  url: https://redis.io/docs/latest/commands/geoadd/
quiz:
- kind: mc
  question: Why query neighboring geohash cells, not only the cell the user is in?
  choices:
  - Geohash is random.
  - The closest point can sit just across the cell edge, and a point near a corner needs the
    surrounding cells too.
  - SQL requires it.
  - It improves write throughput.
  answer: 1
  explain: Cell membership is a filter, not a distance. Always look at the ring of neighbors,
    then compute real distance and trim.
- kind: mc
  question: 'Drive-time ETA for every driver in a metro is a bad idea because:'
  choices:
  - ETA is the same as Euclidean distance.
  - Routing is expensive. Compute it for the short list the geo index already ranked.
  - Maps are not available in interviews.
  - ETAs cannot be cached for a few seconds.
  answer: 1
  explain: Use the cheap distance to get candidates. Spend the routing budget on the top K.
- kind: short
  question: How do you ingest location updates without melting the database?
  reveal: Drivers send points every few seconds. Write the latest point to an in-memory store
    keyed by driver, and only persist a coarsened trail if the product needs history. The
    geo index updates in place. Do not insert a Postgres row per ping unless you have a real
    audit requirement and a time-series plan.
title: Geo and proximity search
description: 'Find things near a point: geohash and cells, the candidate query, and why ''nearest''
  is a product decision.'
track: system-design
section: Patterns
order: 470
---

Proximity search answers "what is near here?" The naive plan, compute distance to every row and sort, dies at a city-sized table. You need an index that throws away far-away rows before you do any real math.

## The index

**Geohash** encodes a lat/long as a string of bits. A shared prefix means "same rough area." You store the hash on the driver and index it. A query computes the user's cell and the neighboring cells (eight of them, more at a corner or when the cell is coarse) and does `WHERE geohash LIKE prefix` or `IN` the neighbor list. Then you compute true distance (haversine is fine) and keep the closest K.

**S2 or H3 cells** are the same idea with a more even globe. A quadtree or an R-tree (Postgres GiST, a spatial index in MySQL) is the version you get if you stay inside a relational database. Redis `GEO*` commands are a geohash sorted set, excellent when the set of online drivers fits in memory.

Pick a cell size from the product. Too coarse and each cell is a hotspot full of candidates. Too fine and you touch dozens of cells to fill a radius. It is normal to query a fine level and expand if you did not find enough results.

## Distance is not ETA

The index ranks by straight-line distance or by travel on an uncongested graph if you have one. Riders care about time. Take the top few dozen candidates and ask a routing service, with a short cache keyed by a coarsened origin and destination. Do not call it for every driver.

## Writes

Location is a hot, tiny, mostly-latest-value dataset. Update a Redis hash and the geo index. Snapshot to durable storage on a slow cadence if you must reconstruct "who was online." A row per GPS ping is a time-series product, not a matching product. Say so if someone asks for historical trails, and then talk retention and privacy: you do not need block-level precision stored for a year to match tonight's rides.

Downtown at 6 pm is one cell and one shard. Split busy cells, or cache the candidate id list for a second so a thousand riders do not each walk the same index.
