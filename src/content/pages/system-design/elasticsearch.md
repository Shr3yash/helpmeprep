---
failureModes:
- Dual-writing the database and the index from the request, then debugging documents that
  never arrived.
- A mapping that typed a field wrong, which you cannot fix without reindexing.
- Deep pagination with from/size, which rereads every hit on every shard.
- Using it as the primary store and discovering a partial update is not a transaction.
sayThis:
- Postgres is the source of truth. Elasticsearch is a derived index, fed by the outbox. I
  can rebuild it.
- I search with BM25 for tokens, and I page with search_after, not with a large offset.
- Filters that must be exact (status, tenant) are filters, not scored clauses. The tenant
  filter is mandatory so one customer cannot see another's documents.
gaps:
- The public Elasticsearch deep dive explains the index and basic queries. Rebuild-from-outbox,
  mapping changes, and search_after are the operational pieces candidates skip.
- Hybrid search (BM25 plus vectors, merged with reciprocal rank fusion) is now a common interview
  fork and is easy to miss if vectors live in a separate premium page.
- Multi-tenant security at the query layer gets less airtime than shards and replicas. A missing
  tenant filter is a breach, not a relevance bug.
references:
- title: Hello Interview, public Elasticsearch deep dive
  url: https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch
- title: Elastic, search_after
  url: https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html
quiz:
- kind: mc
  question: Why is Elasticsearch a poor source of truth?
  choices:
  - It cannot store JSON.
  - Updates are not transactional with your other rows, and the index is optimized to be rebuilt,
    not to be a ledger.
  - It does not replicate.
  - It only stores numbers.
  answer: 1
  explain: Treat it as a derived view. The database commits the fact. A consumer updates the
    document. You can reindex from the database.
- kind: mc
  question: 'from=10000, size=10 is a problem because:'
  choices:
  - Elasticsearch cannot count that high.
  - Each shard still scores and sorts the first 10,010 hits, and the coordinator throws most
    of them away.
  - It disables BM25.
  - It locks the index.
  answer: 1
  explain: Deep offsets are quadratic in cost and unstable under inserts. search_after continues
    from the last sort key.
- kind: short
  question: What is BM25 doing?
  reveal: Scoring a document by how often the query terms appear, damped so repetition does
    not dominate, and weighted by how rare the term is across the corpus. It is the default
    lexical ranker. It does not understand synonyms unless you analyzed them in, and it is
    not a vector distance.
title: Elasticsearch
description: 'A distributed inverted index for search: how queries actually run, and why it
  should not be your source of truth.'
track: system-design
section: Key technologies
order: 230
---

Elasticsearch (and OpenSearch) shard an inverted index. Text is analyzed into tokens, tokens point at documents, and a query is a fast set operation over those postings plus a score, usually BM25. Use it when users type a query and you need relevance, facets, and typo tolerance. Do not use it as the system of record for money or inventory.

## The shape of a cluster

An index has shards. Each shard is a Lucene index on one node, with replicas for reads and for survival. You choose shard count up front more than you wish you had to; too few and you cannot parallelize, too many and a small index drowns in overhead. Replicas add read capacity and a copy. They do not add write capacity on the primary shard of a document.

Documents have a mapping. The mapping is a schema even though people call the engine schemaless. Changing a field from text to keyword is a reindex, not an alter. Say that before you promise flexible documents.

## Feeding it

The application writes Postgres, including an outbox row. A consumer indexes the document. Failures retry. A periodic reconcile compares counts or checksums. Dual writes from the request handler will miss, and you will not notice until a search demo.

Deletes and updates are soft at the segment level. Segments merge in the background. A document you just indexed may be briefly invisible (refresh interval, often a second). For a search box that is fine. For "I just created it and the next screen is a search" you may need a refresh or a read from the database.

## Queries

Put exact constraints (tenant, status, time range) in a filter context so they can be cached and do not affect score. Put the user's words in the scored query. Page with `search_after` on a unique sort, not with a large `from`. Aggregations are how you build facets; they cost heap, so bound them.

If you also have embeddings, a hybrid query runs BM25 and a vector search and merges ranks (reciprocal rank fusion is the simple version). Say which one you trust when they disagree. For a people search, lexical match on a name should beat a vague embedding neighbor.

Security is a filter you cannot forget: every query is constrained to the tenant in the token. Index-per-tenant isolates noisy neighbors and makes deletion easy, at the cost of thousands of small indexes. A shared index with a strict filter is the other way. Pick one.
