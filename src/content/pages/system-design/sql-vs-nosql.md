---
failureModes:
- Picking a wide-column store because 'we will be big,' then being unable to express the query.
- Using a document database as a dumping ground and reimplementing joins in the client.
- Assuming NoSQL means you do not need a schema. You have a schema. It is just unenforced.
- Putting money or inventory in a database that cannot do the transaction you need.
sayThis:
- I will start in Postgres. The workload is relational, the queries are not known in full,
  and I want constraints. I would leave when write throughput or a single access pattern forces
  a different primary key design.
- Dynamo-style storage is for a known key lookup at high write volume. If I need arbitrary
  filters, I am building a second index and I should say so.
- Graph databases earn their keep on variable-length traversals. A follow graph of one hop
  is still a table.
gaps:
- The free public guide folds this choice into data modeling and a technology overview. There
  is no first-class page that forces the decision, so candidates name a product ('I'll use
  Cassandra') before they name the access pattern.
- Transactions are the actual fork in the road and are easy to skip. If two rows must change
  together or not at all, say that before you pick a store that makes it hard.
- Secondary indexes on NoSQL are not free. This page treats 'I will query by another field'
  as a design change, not a flag.
references:
- title: Hello Interview, public data modeling
  url: https://www.hellointerview.com/learn/system-design/core-concepts/data-modeling
- title: Hello Interview, public key technologies overview
  url: https://www.hellointerview.com/learn/system-design/in-a-hurry/key-technologies
- title: Postgres documentation, tutorial
  url: https://www.postgresql.org/docs/current/tutorial.html
quiz:
- kind: mc
  question: Which requirement most strongly argues for a relational database?
  choices:
  - A single key lookup at a million writes per second.
  - Several entities that must update atomically, with ad hoc filters you have not all seen
    yet.
  - A time-series of metrics that is only ever appended.
  - A vector similarity search.
  answer: 1
  explain: Unknown queries plus multi-row transactions are the relational sweet spot. The
    other three have better specialized tools.
- kind: mc
  question: You need 'orders by customer' and 'orders by restaurant' at huge write volume
    in a key-value store. What did you just sign up for?
  choices:
  - Nothing. One table serves both.
  - A second table or index, written in the same logical update, with its own hot-key story.
  - A full table scan, which is fine.
  - A graph database automatically.
  answer: 1
  explain: Key-value and wide-column stores want one primary access path. A second path is
    another structure you maintain.
- kind: short
  question: Give the default and the exit ramp.
  reveal: Default to Postgres while the data is relational and fits one primary with replicas.
    Leave when a measured access pattern (append-only events, pure key lookup, hierarchical
    documents, multi-hop graphs, vectors) is distorted by forcing it into tables, or when
    write scale forces a shard key you understand.
title: SQL versus NoSQL
description: 'A decision you can say in under a minute: when a relational database is the
  design, and when a key-value, wide-column, document, or graph store earns its place.'
track: system-design
section: Core concepts
order: 60
---

"SQL versus NoSQL" is a bad question. The useful question is: what is the access pattern, and which invariants must the storage engine enforce?

## Start here unless you have a reason

A relational database with real constraints is the right first drawing for most product systems. You get transactions, joins for the queries you did not predict, and a planner that uses indexes. Postgres in particular covers JSON when a slice of the row is schemaless, full text for a modest search, and even vectors. Reaching for a second database on minute ten is how designs become unexplainable.

You outgrow it for specific reasons, not for prestige:

- Write throughput that cannot be handled by one primary even after you have removed unnecessary indexes and batched.
- A data shape that is always fetched by one key and is enormous (events, time series).
- A query the relational engine is bad at (nearest vectors at scale, heavy full-text with custom ranking, multi-hop graph traversals).

## What the other families are for

**Key-value** (Redis, DynamoDB used as a key lookup): the key is the query. Excellent for caches, sessions, idempotency records, and "give me this id." Poor the moment you filter on a non-key field.

**Wide-column** (Cassandra, Scylla, DynamoDB with composite keys): you design the table around one query. The partition key decides where the row lives and what is hot. You can scale writes. You cannot casually add a where-clause. Many query shapes means many tables.

**Document**: a hierarchy that is stored and fetched together (a menu, a product with variants). Good when the document is the unit of consistency. Bad when you need to query inside every document and then join across them.

**Graph**: relationships are the data, and queries are "friends of friends" or "what depends on this package" with a depth you do not know up front. A single join is not a graph problem.

**Search and vector engines** are indexes, not sources of truth. They are allowed to be rebuilt.

## The invariant test

Ask one question before you leave Postgres: which updates must be atomic? Seat inventory and a payment auth. A task claim and a lease. An account debit and a ledger line. If those sit in one database, a transaction is a couple of statements. If they sit in two, you have a saga, compensation, and a new class of bugs. Sometimes that split is worth it. It should be a sentence you say on purpose.

Schema-on-read does not delete the schema. It moves the pain to every reader. For data you will query six months from now, a constraint at write time is cheaper than a cleanup job.
