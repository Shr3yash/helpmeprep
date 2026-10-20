---
failureModes:
- A partition key with one hot value, which no amount of cluster size will cool down.
- A query you forgot, which would require a full scan or a second table you do not maintain.
- Last-writer-wins on a counter, so increments disappear.
- A strongly consistent read on every page view, paying latency you did not need.
sayThis:
- I am choosing the partition key to be the entity I always have in the hot query. A second
  access pattern is a second table, updated in the same logical write.
- Cassandra and DynamoDB scale writes because any replica can take one. I give up ad hoc joins
  and multi-row transactions across keys.
- I will use a conditional write for the idempotency record. I will not read-modify-write
  a counter without a primitive that understands increments.
gaps:
- 'Public deep dives exist for both products and are good on data modeling. Candidates still
  mix them up with a relational database that happens to be hosted. The missing sentence is:
  the key design is the product design.'
- DynamoDB transactions and Cassandra lightweight transactions exist and are limited. Free
  comparisons often say 'no transactions' flatly, which is too crude, or ignore them, which
  is how you over-promise.
- Hot partition math (a 10 GB item collection, a throttled partition) is more concrete than
  'watch out for hot keys' and rarely gets a number.
references:
- title: Hello Interview, public DynamoDB deep dive
  url: https://www.hellointerview.com/learn/system-design/deep-dives/dynamodb
- title: Hello Interview, public Cassandra deep dive
  url: https://www.hellointerview.com/learn/system-design/deep-dives/cassandra
- title: AWS, DynamoDB partition keys
  url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html
quiz:
- kind: mc
  question: 'You must look up orders by user and by restaurant. In Cassandra you:'
  choices:
  - Add a secondary index and stop thinking about it.
  - Build two tables with different partition keys and write both.
  - Pick one and full-scan for the other.
  - Join them at query time.
  answer: 1
  explain: Table-per-query is the model. Secondary indexes exist and are a trap when cardinality
    is high or the query is hot.
- kind: mc
  question: 'A single DynamoDB partition key receiving 50,000 writes a second will:'
  choices:
  - Spread automatically across the table's capacity.
  - Throttle, because a partition has a ceiling regardless of table provisioning.
  - Turn into a relational join.
  - Failover to Postgres.
  answer: 1
  explain: Table-level capacity does not save a hot partition. You have to change the key,
    often by adding a shard suffix and merging on read.
- kind: short
  question: What does quorum mean here?
  reveal: A write is successful when W replicas accept it, a read when R respond. If R + W
    is greater than the replication factor, you overlap and see the latest write, at the cost
    of waiting. DynamoDB exposes this as consistent versus eventually consistent reads. Cassandra
    lets you pick the consistency level per query.
title: DynamoDB and Cassandra
description: 'Wide-column and key-value stores you design around a known query: partition
  keys, quorum, and the queries you cannot add later.'
track: system-design
section: Key technologies
order: 240
---

DynamoDB and Cassandra descend from the same idea: a table whose primary key decides placement, replicated with a quorum, able to take writes on many nodes. You talk to them when the access pattern is known and the write rate will not fit one Postgres primary. You do not talk to them because NoSQL sounds scalable.

## Model the query first

The **partition key** is the unit of placement and the unit of hotness. All items with that key live together. A sort key orders items inside the partition (DynamoDB) or forms the rest of the primary key (Cassandra clustering columns).

Example: messages partitioned by `conversation_id`, sorted by `sent_at`. Loading a conversation is one partition read. Loading a user's inbox is a different query and a different table, `inbox_by_user`, that you write at send time. If you do not want to write that second table, you do not get that query.

Cassandra secondary indexes and DynamoDB GSIs can serve another pattern. A GSI is another table Amazon maintains, with its own capacity and its own lag. A hot GSI key is a hot partition you do not control as directly. Prefer an explicit table when the second pattern is hot.

## Consistency and contention

Default reads can be stale. Ask for a strongly consistent read when the next screen must show the write, and pay the latency. Conditional writes (`attribute_not_exists`, compare-and-set) are how you implement idempotency and optimistic concurrency. They are not a general multi-row transaction. DynamoDB transactions exist across items in one account and have a size and cost limit. Cassandra lightweight transactions use Paxos and are much slower than a normal write. Say the limit if you rely on them.

Counters need a counter type or an event log you sum. Last-writer-wins on a numeric column drops increments.

## Capacity

DynamoDB will throttle a single partition well before the table's nominal throughput is exhausted. Cassandra will too, in practice, because one key's replicas are three machines, not the cluster. When a key is hot, write `key#bucket` and merge, or queue in front of that key.

Neither store is a good home for a query you invent next month. If the product is still discovering its queries, stay on Postgres.
