---
failureModes:
- A uniqueness check that is not atomic, so two racing inserts both succeed.
- Near-duplicate thresholds so aggressive that legitimate distinct items collapse.
- A merge that is transitive and silently unions three people into one.
- Dedup state that expires before the retry window, so the duplicate lands anyway.
sayThis:
- Exact duplicates are a unique constraint on a natural key or an idempotency key, in the
  same transaction as the insert.
- Near duplicates are a candidate generation problem. I block on a cheap key, score the pairs,
  and only then spend a costly check on the uncertain band.
- I will not merge A with C just because both looked like B, without a cap or a review on
  large clusters.
gaps:
- Dedup is not a public pattern. It is scattered across idempotency keys and an occasional
  search chapter. Exact dedup and near-duplicate detection are different systems, and interviews
  (ads, crawlers, marketplaces, datasets) ask for both.
- Candidate generation (MinHash, simhash, blocking keys) versus the expensive scorer is the
  cost-control story. Free material rarely separates them.
- This page names the transitive-merge failure, which is how entity resolution corrupts a
  dataset even when every pairwise decision looked reasonable.
references:
- title: Hello Interview, public API design (idempotency keys)
  url: https://www.hellointerview.com/learn/system-design/core-concepts/api-design
- title: Google Research, detecting near-duplicates at scale
  url: https://research.google/pubs/pub33026/
quiz:
- kind: mc
  question: Exact dedup of a retried payment belongs where?
  choices:
  - In a best-effort log scan at the end of the day.
  - In a unique key committed with the payment.
  - In the CDN.
  - In a weekly human review only.
  answer: 1
  explain: If the constraint is not in the write path, you have already double-charged by
    the time the scan runs.
- kind: mc
  question: 'You have a million profiles and must find duplicates. Comparing all pairs is:'
  choices:
  - Fine, it is only a million squared, about 10^12, and an LLM can do that overnight.
  - Impossible at that cost. Block on email, phone, and name tokens, then score only candidates.
  - Solved by sorting the list once.
  - A SQL join without a predicate, which the planner will optimize away.
  answer: 1
  explain: All-pairs is quadratic. Blocking and locality-sensitive hashing make the candidate
    set linear-ish. Then you spend the expensive model on the ambiguous pairs.
- kind: short
  question: What goes wrong with transitive merges?
  reveal: If A matches B and B matches C, union-find merges A and C even when a direct look
    would say they differ. A chain of weak matches becomes one giant cluster. Cap cluster
    size, require a stronger check to join large clusters, and sample clusters for review.
title: Deduplication
description: Exact dedup with a key, near-duplicate detection at scale, and the merges that
  go wrong.
track: system-design
section: Patterns
order: 490
---

Dedup means two things, and designs fall over when they use the tool for the wrong one.

## Exact

The same logical event arrives twice: a retried request, a redelivered queue message, a crawler that fetches a URL it already stored. You have a key. Put a unique constraint on it.

For requests, the key is the idempotency key. For events, it is the event id. For a crawler, it is the canonical URL plus a content hash, so you can tell "same URL, new bytes" from "same URL, same bytes." The insert that records "I have seen this" commits with the side effect. A filter in front (`if key in redis`) is an optimization, not the guarantee. Redis can evict. The database constraint cannot.

Keep the record at least as long as duplicates can still arrive. A crawler that revisits forever can store the hash and not the body. A payment retry window is a day, not forever, but it is not five seconds.

## Near duplicates

Profiles, web pages, support tickets, and training data are duplicates without sharing a key. All-pairs comparison is quadratic and you should say the number so the interviewer hears you refuse it.

**Block** first. Exact normalized email or phone. Same domain and title. Same geohash and business name. Blocks are allowed to miss some true pairs; they must be cheap.

**Candidate generation** inside a block, or across the corpus with MinHash / simhash / an embedding neighborhood, produces pairs that might match. **Scoring** sorts those pairs into definite-yes, definite-no, and unsure. Spend the expensive check (a human, a model call, a slow feature) only on unsure. That is how a budget of 50,000 model calls can police a million records.

## Merges

Union-find is the right structure for "these ids are the same entity." It is also how errors spread. Keep the evidence on each edge. Do not collapse a cluster of thousands because of a chain of weak links. Prefer a survivor record and aliases over deleting the duplicates, so you can undo.

For streaming dedup (ads, clicks), a bloom filter or a short-lived cache can say "probably new" and a durable unique key behind it says "definitely." The filter controls cost. The key controls correctness. Say which decision is allowed to be wrong.
