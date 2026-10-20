---
failureModes:
- A hot key that lives on one shard and saturates it.
- Using Redis as the only copy of data you cannot rebuild, with persistence you have not tested.
- A lock without a lease, so a dead holder blocks everyone, or a lock with a lease that expires
  while the holder is still working.
- KEYS in production, or a large sorted set that you ZRANGE from the start on every request.
sayThis:
- Redis is the shared cache and the counter. Postgres remains the source of truth. If Redis
  is empty I can refill from the database, more slowly.
- For a leaderboard I use a sorted set. For a rate limit I use a token bucket in a small Lua
  script so it is atomic.
- A lock is a key with a TTL and a random token, released only if the token still matches,
  so I do not delete someone else's lock.
gaps:
- 'The public Redis deep dive is strong on cache, locks, leaderboards, rate limits, pub/sub,
  and hot keys. It is easier to miss persistence modes (RDB versus AOF) and the fact that
  pub/sub does not store messages: a subscriber that was down missed them.'
- Cluster slot ownership and 'this key and that key must be in the same hash tag to transact
  together' rarely make the free summary. Multi-key scripts fail across slots.
- 'This page adds the rebuild test: if Redis disappeared tonight, what would you lose? If
  the answer is ''money,'' it is the wrong store.'
references:
- title: Hello Interview, public Redis deep dive
  url: https://www.hellointerview.com/learn/system-design/deep-dives/redis
- title: Redis documentation
  url: https://redis.io/docs/latest/
quiz:
- kind: mc
  question: Which Redis structure answers 'top 10 by score' efficiently?
  choices:
  - A list you sort in the client.
  - A sorted set, ZRANGE by score.
  - A hash of all users.
  - Pub/sub.
  answer: 1
  explain: Sorted sets keep members ordered by score. You still have to shard if one set is
    enormous, and merges of top-K across shards are a follow-up.
- kind: mc
  question: 'Redis pub/sub will:'
  choices:
  - Store every message for a subscriber that reconnects an hour later.
  - Deliver to subscribers that are connected at publish time, and drop the rest.
  - Replace Kafka with exactly-once delivery.
  - Lock a row in Postgres.
  answer: 1
  explain: Pub/sub is ephemeral. If you need replay, use a stream or a log.
- kind: short
  question: How do you release a lock safely?
  reveal: 'The lock value is a random token the holder knows. Release is a script: delete
    the key only if the value still equals the token. Combined with a TTL, a crashed holder
    expires, and a slow holder cannot delete the lock a new holder already acquired.'
title: Redis
description: 'An in-memory data structure server: cache, counter, lock, rate limiter, and
  the ways it fails when you treat it like a database.'
track: system-design
section: Key technologies
order: 210
---

Redis keeps data structures in memory and serves them over the network in well under a millisecond inside a region. Use it when the working set fits, the access is by key, and losing the cache is an inconvenience rather than an incident. Use Redis Cluster when one machine's memory or CPU is not enough. Keys hash to slots, and a multi-key transaction only works for keys you have forced into the same slot with a hash tag.

## Jobs it is good at

**Cache.** Cache-aside in front of Postgres. Set a TTL. Coalesce misses. Do not store the only copy of an order.

**Counters and rate limits.** `INCR` is atomic. A token bucket fits in a short Lua script so the refill and the take happen together. See the rate-limiting page.

**Leaderboards.** A sorted set gives you insert and top-K in log time of the set. One global set becomes a hot key. Shard by time bucket or by range and merge.

**Locks and leases.** `SET key token NX PX ttl`. The TTL is mandatory. Release with a compare-and-delete. A lock is not a queue, and it will not stay correct if the holder's work outlives the TTL. Renew the lease with a heartbeat if the work is long, and make the work idempotent in case the lease expires anyway.

**Streams.** A small log with consumer groups, useful when you want Redis and the volume is modest. It is not a substitute for Kafka once you want long retention and many independent consumers.

## Persistence and failure

RDB snapshots and AOF can persist Redis, and replication gives you a failover candidate. That still does not make it the ledger. Restores lose the last snapshot window. Failover can lose acknowledged writes depending on configuration. Say the loss mode if someone asks you to keep money there.

Eviction policy matters the day memory fills. `allkeys-lru` will throw away data. `noeviction` will start rejecting writes. Pick the one that matches whether this instance is a cache or a store.

Hot keys are the production incident. Replicate reads, or split the key. `KEYS *` and unbounded `SMEMBERS` are how you stall the single thread that serves everyone.
