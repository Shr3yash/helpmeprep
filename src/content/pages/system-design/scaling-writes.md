---
failureModes:
- Adding read replicas to fix a write bottleneck.
- Sharding on a key the hot writes do not include, so one shard still takes the spike.
- Async handoff with no durable queue, so a crash after you ack loses the write.
- A unique constraint that only exists inside one shard, allowing global duplicates.
sayThis:
- Writes go to one primary until they cannot. Then I partition by a key every write already
  has, and I keep a unique id so a retry hits the same shard.
- If the write is a burst, I ack a durable queue and apply it at the rate the database can
  take. The user sees 'accepted,' not 'committed to the report.'
- Indexes speed reads and tax writes. I will drop the ones this path does not need before
  I shard.
gaps:
- 'The public pattern article is paywalled. Free sharding pages explain keys and not the earlier,
  cheaper moves: fewer indexes, batching, and asynchronous apply.'
- Idempotency across shards (the dedup key must land on a deterministic shard) is a footnote
  people miss and then double-insert.
- Backpressure is part of write scaling. A design that accepts infinite writes into a finite
  database is a future incident, not a scalable system.
references:
- title: Hello Interview, public scaling-writes outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/patterns/scaling-writes
- title: Hello Interview, public sharding
  url: https://www.hellointerview.com/learn/system-design/core-concepts/sharding
quiz:
- kind: mc
  question: Which change increases write throughput on the primary?
  choices:
  - Another read replica.
  - Removing an unused index and batching commits, or sharding writes by a real key.
  - A CDN.
  - Raising the read-replica count from 2 to 6.
  answer: 1
  explain: Replicas do not take writes. Reducing write amplification and splitting the keyspace
    do.
- kind: mc
  question: 'You ack the client before the durable log has the write. You have chosen:'
  choices:
  - Higher durability.
  - Lower latency and a loss window. Say what you can lose.
  - Linearizability.
  - A free lunch.
  answer: 1
  explain: That trade is sometimes correct for metrics. It is not correct for payments. Name
    the lost-write behavior.
- kind: short
  question: How do you keep idempotency working after you shard?
  reveal: Hash the idempotency key to pick the shard, and store the dedup record on that same
    shard as the effect, or store dedup in a single keyed store that both attempts consult.
    A per-shard unique constraint does not stop the same logical write from landing on two
    shards.
title: Scaling writes
description: How to accept more writes than one primary wants to handle, without pretending
  replicas will do it.
track: system-design
section: Patterns
order: 440
---

A primary serializes commits through one log. Read replicas do not change that. When write rate, write latency, or data size is the ceiling, you have a short menu.

## Before you shard

Measure what a write costs. Every secondary index is a write. Every synchronous replica in another zone is latency. Drop indexes nobody queries. Batch many small inserts into one transaction if the producer can buffer for a few milliseconds. Move large payloads to object storage and write a pointer. These are not consolation prizes. They are often enough, and they make the later shard simpler.

## Absorb bursts

If the average fits and the peak does not, put a durable log in front. The API validates, appends, returns 202, and consumers apply at a steady rate. This is the right shape for click ingestion and for any "we must not lose it, but the report can wait a minute" path. It is the wrong shape for "the user is staring at a seat map." Size the consumer, alert on age, and apply backpressure when the log grows: 429 the least important producers first.

## Shard

Partition by a key present on every write. Each shard has its own log and its own primary, so write throughput scales with shard count until a single key is the hotspot. A hot key needs its own treatment (suffix buckets, or a queue in front of that key only).

Place rows that must commit together on the same shard. Accept that a global uniqueness check is now a directed lookup: generate an id that hashes to the shard, or do the uniqueness insert on a shard chosen by the unique value.

## Lose less on purpose

Synchronous quorum writes survive a node death and cost latency. Asynchronous writes are faster and can lose the tail. Pick per data type, not per cluster slogan. A metrics pipeline can drop. An outbox of payments cannot.

Say the number that forced your hand. "One primary does a few thousand non-trivial commits a second. This path is fifty thousand. I will shard by account id." That sentence is the pattern.
