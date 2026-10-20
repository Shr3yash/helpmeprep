---
failureModes:
- A poison message that halts a partition because the consumer will not move its offset.
- A key that dumps one tenant onto one partition and leaves the rest idle.
- Committing offsets before the side effect, or committing them in a way that reprocesses
  non-idempotent work.
- Treating consumer lag as a vanity metric and not paging on it.
sayThis:
- I key the topic by order id so all events for one order stay in order. Parallelism is the
  number of partitions, and I cannot have more active consumers in a group than partitions.
- Another service that wants the same facts gets its own consumer group. It does not steal
  messages from the first group.
- The consumer writes its result idempotently and then commits the offset. A redelivery is
  a no-op.
gaps:
- The public Kafka page covers the log, partitions, and groups well. The outbox-to-Kafka path,
  and the choice between Kafka and a work queue, are where designs go wrong and are split
  across other chapters.
- Exactly-once transactions in Kafka are real and narrow (consume, produce, commit offsets
  atomically inside Kafka). They do not make an external payment exactly-once. Free summaries
  blur that.
- Retention versus compaction is a design choice. Compaction keeps the latest value per key,
  which is a different product from a week of click events.
references:
- title: Hello Interview, public Kafka deep dive
  url: https://www.hellointerview.com/learn/system-design/deep-dives/kafka
- title: Kafka documentation
  url: https://kafka.apache.org/documentation/
quiz:
- kind: mc
  question: You have 6 partitions and 10 consumers in one group. How many consumers are idle?
  choices:
  - None. Kafka load-balances messages.
  - 4. One partition has one consumer in the group.
  - 10. Groups do not share.
  - 1, the leader.
  answer: 1
  explain: Each partition is assigned to at most one consumer in the group. Extra consumers
    sit idle until you add partitions.
- kind: mc
  question: 'Compaction is appropriate when:'
  choices:
  - You need every click forever.
  - You only need the latest state per key, such as the current profile.
  - You need a delay queue.
  - You need a lock.
  answer: 1
  explain: Compaction drops older values for a key. It is a snapshot log, not an event archive.
- kind: short
  question: How does the transactional outbox land in Kafka?
  reveal: The business write and an outbox row commit in Postgres together. A publisher reads
    the outbox in order and appends to Kafka, marking the row published. A crash retries the
    append. Consumers dedupe by the event id. You never dual-write the database and Kafka
    from the request.
title: Kafka
description: 'A durable, partitioned log: when it is the right pipe, how keys and consumer
  groups work, and what it will not do for you.'
track: system-design
section: Key technologies
order: 220
---

Kafka is a distributed log. Producers append records to a topic. The topic is split into partitions. Each partition is an ordered, durable sequence replicated across brokers. Consumers read at their own pace and remember an offset.

That design is excellent at fan-out of facts: one write, many independent readers, replay if a reader had a bug. It is a clumsy work queue. Know which one you are drawing.

## Partitions and order

Order is guaranteed inside a partition, not across them. Choose the key to be the entity whose events must stay ordered. All messages for one conversation share a partition. The cost is skew: a hot key is a hot partition, and you cannot parallelize that key without breaking order. If you need both, partition by key for the ordered stage and fan out later.

More partitions means more parallelism and more files, leaders, and rebalance pain. Pick a number you can live with. You can add partitions later, and it changes key placement, so it is not free.

## Consumer groups

A group is a set of processes sharing the work of one subscription. Partitions are assigned among them. A second group sees every record again. That is how billing and notifications both observe orders without coordinating.

Rebalance happens when members join, leave, or die. A slow handler that exceeds the poll interval looks dead and causes a rebalance storm. Bound the handler or the batch.

## Delivery

The default mental model is at-least-once: you process, then commit the offset. A crash in between redelivers. Idempotent consumers make that safe. Kafka's own transactions can make "consume and produce to another topic" atomic. The moment the effect is an email, a charge, or a row in Postgres, you are back to an idempotency key.

Retention keeps data for a configured time or size. Compaction keeps the latest record per key. Click streams want retention. A changelog of account state wants compaction. Say which.

Producers should use acks that wait for replicas if the data matters, and they should retry with idempotent producer settings so a retried append does not duplicate inside the log. That still does not dedupe your consumer's side effect.
