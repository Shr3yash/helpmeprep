---
failureModes:
- A sequential scan on a hot table because the predicate does not match the index prefix.
- Long transactions that hold row locks and pile up behind a queue claim.
- Using it as a blob store or a queue with no partial index, so the table and the index grow
  without bound.
- Read replicas used for a read-your-writes path, with no one watching lag.
sayThis:
- Postgres is my source of truth. I will show the two indexes and the one query plan I care
  about.
- For the work queue I want a partial index on the open rows and FOR UPDATE SKIP LOCKED so
  workers do not block each other.
- I will partition append-only history by month. I will not shard until a single primary's
  write rate is the bottleneck I measured.
gaps:
- The public Postgres deep dive is paywalled. Free readers are told 'relational database'
  as a box and never see SKIP LOCKED, partial indexes, or EXPLAIN.
- JSON, full text, and pgvector make Postgres a reasonable v1 for search and embeddings. Guides
  that jump straight to Elasticsearch and a vector database hide that option, which is often
  the right interview answer.
- Connection pooling (PgBouncer) and idle-in-transaction timeouts are operational facts that
  explain 'the database stopped accepting connections' even when CPU is low.
references:
- title: Hello Interview, public Postgres outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/deep-dives/postgres
- title: Postgres, SELECT FOR UPDATE
  url: https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE
- title: Postgres, EXPLAIN
  url: https://www.postgresql.org/docs/current/sql-explain.html
quiz:
- kind: mc
  question: What does FOR UPDATE SKIP LOCKED buy a work queue?
  choices:
  - A full table lock that is fair.
  - Each worker locks the next unlocked row and skips rows other workers hold, without waiting.
  - A guarantee of exactly-once delivery across processes.
  - Automatic sharding.
  answer: 1
  explain: Workers compete without blocking on each other. You still need a lease so a crashed
    worker's row returns to the pool.
- kind: mc
  question: A query filters on user_id and sorts by created_at. The index is (created_at).
    What do you expect?
  choices:
  - An index-only scan that is optimal.
  - A sort or a scan that does not use user_id, because the leading column is wrong.
  - A hash join against the index.
  - Postgres will rewrite the index.
  answer: 1
  explain: Leading column should be user_id if that is the equality. Then created_at serves
    the sort.
- kind: short
  question: When do you leave Postgres?
  reveal: When one primary cannot take the write rate after you have removed unused indexes
    and batched, or when a specialized access pattern (log-scale search, huge fan-out time
    series, billion-scale ANN) is the product. Not because a diagram looks more senior with
    more logos.
title: Postgres
description: 'The default database in a design interview: transactions, indexes, locks, and
  the point at which you stop asking it to do everything.'
track: system-design
section: Key technologies
order: 200
---

If you do not have a reason to pick something else, pick Postgres. It has transactions, a serious planner, constraints, and enough extension points that you can defer the second database until the design forces it.

## What you use it for

The source of truth for entities that change and that must agree with each other: users, orders, tasks, ledgers. A transaction is your concurrency story. Isolation defaults to read committed. When two workers might claim one row, take a row lock explicitly.

```sql
WITH next AS (
  SELECT id FROM tasks
  WHERE status = 'open'
  ORDER BY priority DESC, created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE tasks t
SET status = 'claimed', lease_until = now() + interval '15 minutes'
FROM next
WHERE t.id = next.id
RETURNING t.*;
```

Pair that with `CREATE INDEX ON tasks (priority DESC, created_at) WHERE status = 'open'`. The index stays small. Closed tasks do not bloat it.

## Indexes and plans

B-tree by default. GIN for jsonb containment, arrays, and full text. GiST for ranges and geo. Say "I would EXPLAIN the hot query" and mention what you are looking for: a sequential scan on a big table, a row estimate wildly off from reality, a sort that spills to disk.

`INSERT … ON CONFLICT` is your idempotent write. Unique constraints are not optional decoration. They are how you make a retry safe.

## Scale inside one cluster

Read replicas for read-heavy traffic that tolerates lag. Connection pooling in front, because Postgres wants a modest number of real connections and your app will open thousands. Partition by time for append-only tables so retention is dropping a partition.

Writes still go to one primary. When that primary's IOPS or CPU is the ceiling, shard by a key you can name, or move an append-only stream to a log. Do not run a distributed lock manager inside Postgres for fun. `SKIP LOCKED` and advisory locks cover a surprising number of interview problems.

## What it should not be

It should not store video. It should not be the only copy of a search corpus you cannot rebuild, unless you accept that search features will stay modest (`tsvector` is genuinely useful at moderate size). It should not serve a million-QPS key lookup that is really a cache. Put Redis in front and keep Postgres correct.
