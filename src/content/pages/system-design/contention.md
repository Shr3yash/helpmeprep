---
failureModes:
- Two buyers read '1 seat left' and both insert a ticket.
- A lock with no timeout held by a dead process.
- Retrying a contended row in a tight loop and making the hotspot worse.
- A distributed lock around an operation that could have been a single conditional update.
sayThis:
- I will not lock the whole table. I will update the seat with a conditional WHERE status
  = 'open' and treat zero rows updated as 'someone else got it.'
- If the hot row is a counter everyone increments, I shard the counter or I append events
  and aggregate.
- A queue in front of a hot key turns a spike into a drain rate the database can survive.
gaps:
- 'The public contention article is paywalled. Free sharding pages mention hot keys without
  the tactics: conditional update, optimistic version, lease, partition the counter, or serialize
  through a queue.'
- Distributed locks are over-prescribed. Many interview problems are one row in one database,
  and a conditional UPDATE is the whole solution.
- Fairness (who gets the scarce seat, who gets the lock) is a product rule and is rarely stated.
  First-committer-wins is a choice, not a law.
references:
- title: Hello Interview, public contention outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/patterns/dealing-with-contention
- title: Postgres, explicit locking
  url: https://www.postgresql.org/docs/current/explicit-locking.html
quiz:
- kind: mc
  question: 'Two transactions try to buy the last seat. The safe statement is:'
  choices:
  - UPDATE seats SET status='sold' WHERE id=:id, after both have read status='open'.
  - UPDATE seats SET status='sold' WHERE id=:id AND status='open', and check that one row
    changed.
  - A Redis lock around a read and a later write, with no fencing.
  - Last write wins.
  answer: 1
  explain: The predicate and the update are one statement. The loser sees zero rows and returns
    'sold out.' A lock in another system around a non-atomic pair of calls still races.
- kind: mc
  question: A single inventory counter is updated 20,000 times a second. What helps?
  choices:
  - More read replicas.
  - Shard the counter into buckets and sum them, or append a log and aggregate asynchronously.
  - A bigger unique index.
  - SELECT FOR UPDATE on the whole table.
  answer: 1
  explain: Replicas do not take writes. One row cannot absorb unlimited updates. Split it
    or stop updating it synchronously.
- kind: short
  question: Optimistic versus pessimistic, in practice?
  reveal: 'Optimistic: update where version = :v, and retry if you lose. Good when conflicts
    are rare. Pessimistic: lock the row first, then update. Good when conflicts are expected
    and retries would thrash. Either way, hold the lock for milliseconds, not for a user''s
    think time.'
title: Contention and locking
description: 'What to do when many writers want one row: locks, atomic updates, leases, and
  queues that smooth the spike.'
track: system-design
section: Patterns
order: 420
---

Contention is many operations trying to change the same piece of state. The database will serialize them for you if you ask correctly. It will also fall over if you ask it to serialize tens of thousands of updates to one row. Name which situation you are in.

## One row, modest concurrency

Make the write conditional so it can only succeed from the state you observed:

```sql
UPDATE seats
SET status = 'sold', owner = :user
WHERE id = :id AND status = 'open';
```

If the update count is zero, you lost. Return a conflict and let the user pick another seat. An integer `version` column is the same trick for richer edits: `WHERE version = :expected`, then increment it. That is optimistic concurrency. It is the right default for profiles, documents, and carts.

Pessimistic locking (`SELECT … FOR UPDATE`) is for the case where you must read several rows, decide, and write, and a retry would be expensive or incorrect. Keep the transaction short. Do not call a payment provider while you hold the row lock. Record the intent, commit, then call out.

## Leases instead of immortal locks

If a human or a worker holds the right to edit, store `lease_until` and a holder id. Heartbeat to extend. Anyone may take it after expiry. This is how you avoid a crashed client pinning a ticket forever. See the task-routing problem for the full shape.

## When the row itself is too hot

A flash sale that decrements one counter will serialize on that counter no matter how many app servers you add. Options, from least to most machinery:

- Batch updates in memory and flush a sum a few times a second, if you can tolerate a short oversell window and correct it.
- Shard the counter into N rows and sum on read. Oversell is still possible unless the sum is itself guarded.
- Put requests on a queue and let a single consumer apply them in order. Throughput becomes the consumer's throughput, which is the honest capacity. The HTTP call returns "queued" or waits with a timeout.
- Change the product so you do not need a synchronous global count (reserve in bulk per worker, reconcile later).

A distributed lock around the hot key does not increase the key's capacity. It only adds a failure mode. Use it when you truly have one critical section across services, not as a reflex.
