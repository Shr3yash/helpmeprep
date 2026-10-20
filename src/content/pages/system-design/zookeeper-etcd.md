---
failureModes:
- Using ZooKeeper or etcd as a general database for user content.
- A lock or lease with no session timeout, so a dead owner holds it forever.
- Clients without jitter all reconnecting after a leader election and extending the outage.
- Storing a large blob as a value and blowing the request size or the watch fan-out.
sayThis:
- I need a source of truth for who is the leader and for a handful of config keys. That is
  etcd or ZooKeeper. The product rows stay in Postgres.
- A lease expires if the holder does not refresh it. Expiry is the feature that makes a crash
  survivable.
- Kafka and many older systems use ZooKeeper for membership. Newer Kafka can run without it.
  I will not add one casually if the platform already has a coordinator.
gaps:
- The public ZooKeeper page is paywalled, and etcd is not a separate free topic. Candidates
  either ignore coordination or invent a lock in Redis without saying what happens when Redis
  partitions.
- The split between 'consistent metadata' and 'product data' is the whole lesson and is easy
  to miss if the page is a feature list of znodes.
- This page pairs the two tools and tells you when a database advisory lock or a conditional
  row is enough, so you do not add a consensus system for a single-row claim.
references:
- title: Hello Interview, public ZooKeeper outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/deep-dives/zookeeper
- title: etcd documentation
  url: https://etcd.io/docs/
quiz:
- kind: mc
  question: Which workload belongs in etcd?
  choices:
  - Ten million chat messages a day.
  - The current leader of a shard, and a few kilobytes of cluster config.
  - Video thumbnails.
  - A full-text index.
  answer: 1
  explain: Consensus systems stay small and strongly consistent. They are the map, not the
    territory.
- kind: mc
  question: 'A session lease helps because:'
  choices:
  - It makes writes faster than Postgres.
  - If the holder crashes and stops refreshing, the lock or membership entry disappears on
    its own.
  - It replaces replication.
  - It disables watches.
  answer: 1
  explain: Failure detection is 'the heartbeat stopped.' Without expiry you must delete locks
    by hand.
- kind: short
  question: When would you not introduce ZooKeeper?
  reveal: When one Postgres primary already serializes the critical section. A row lock or
    an advisory lock is simpler and has one less quorum to operate. Add a dedicated coordination
    service when many systems need to agree on membership or config and that agreement must
    survive the database you are electing a leader for.
title: ZooKeeper and etcd
description: Small, strongly consistent stores for configuration, leases, and membership.
  Not a place to put your product data.
track: system-design
section: Key technologies
order: 290
---

ZooKeeper and etcd run a consensus protocol (Zab, Raft) so a small set of nodes agree on a log of updates. Reads and writes of that log are linearizable as long as a quorum is alive. The data is a tree of small keys. Clients can watch a key and learn when it changes. Sessions expire if a client stops heartbeating.

That is a powerful and narrow tool. The cluster is typically three or five nodes. The dataset should fit in memory and stay modest. Throughput is nothing like Kafka or Redis. You use it for metadata that must not fork: who is the primary, what is the current config generation, which workers are alive, a lock that must have one holder.

## Leases and locks

A lock is a key that exists only while the holder's session is alive, or a lease with a TTL the holder refreshes. If you crash, you stop refreshing, and someone else may take it after the timeout. The timeout is the unavailability you accept in exchange for not waiting forever. Work done under the lock must be idempotent or fenced: a slow holder whose lease expired must not keep writing. A fencing token (a number that increases every time the lock is granted, checked by the storage system) is the grown-up version.

## Watches

A watch is how workers learn that config changed without polling themselves into a stampede. When the watch fires, clients must jitter and re-read. A thundering herd after a leader election is a known way to turn a one-second failover into a one-minute outage.

## What not to do

Do not store product rows, queues of user jobs, or anything large. Do not run a single-node "coordination service" and call it highly available; consensus needs a quorum, which means an odd number of nodes in more than one failure domain. And do not add etcd because the diagram looked empty. If the critical section is one table, Postgres can hold the lock. If the thing you are electing is the Postgres primary, the election store has to be outside Postgres, and then a coordinator earns its place.
