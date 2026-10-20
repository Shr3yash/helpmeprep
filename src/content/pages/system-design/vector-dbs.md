---
failureModes:
- A filtered search that post-filters an approximate neighborhood and silently drops the right
  document.
- Changing the embedding model without a second index, so queries and documents live in different
  spaces.
- Storing the only copy of the chunk text in the vector store and being unable to re-embed.
- A recall number from a benchmark with no filters, quoted as the recall you will see in production.
sayThis:
- I embed the query and search an HNSW index for the top candidates, then rerank a small set.
  The source of truth is the document table, and the index is rebuildable.
- Metadata filters are the hard part. If the filter is very selective I would rather filter
  first and search a smaller index than hope the neighbor list overlaps the filter.
- A model upgrade is a new index, populated in the background, then a cutover. I do not mix
  vectors from two models.
gaps:
- The public vector-database page is paywalled, and the free path barely mentions ANN. RAG
  and matching interviews now start here.
- Pre-filter versus post-filter, and the recall collapse that comes with a selective filter,
  is the deep dive interviewers push on. Product pages tend to show an unfiltered demo.
- Hybrid lexical plus vector search is how you stop embeddings from missing an exact SKU or
  a person's name. It belongs in the same answer.
references:
- title: Hello Interview, public vector database outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/deep-dives/vector-databases
- title: pgvector README
  url: https://github.com/pgvector/pgvector
- title: HNSW paper, Malkov and Yashunin
  url: https://arxiv.org/abs/1603.09320
quiz:
- kind: mc
  question: 'HNSW is best described as:'
  choices:
  - An exact scan that is somehow fast.
  - A graph where a greedy walk approximates nearest neighbors, trading a little recall for
    a lot of speed.
  - A B-tree on the embedding bytes.
  - A SQL join.
  answer: 1
  explain: It is approximate. You choose parameters that spend memory and build time to raise
    recall. Say the trade.
- kind: mc
  question: You upgrade the embedding model. What must be true before you serve it?
  choices:
  - Only new documents use the new model. Old vectors still match.
  - Queries and documents are embedded with the same model. Rebuild, then switch.
  - Nothing. Cosine similarity is model-invariant.
  - You normalize the old vectors by their length.
  answer: 1
  explain: Different models live in different spaces. Mixing them returns neighbors that are
    nonsense.
- kind: short
  question: Why can a selective filter wreck approximate search?
  reveal: The index finds geometric neighbors, then you discard those that fail the filter.
    If few neighbors pass, you have almost no hits even though many matching documents exist
    farther away in the graph. Filtering first, or using an index that knows the filter, fixes
    the candidate set. The cost is build complexity and sometimes recall tuning.
title: Vector databases
description: 'Approximate nearest-neighbor search over embeddings: HNSW and IVF, filters,
  and why the vector store is not the system of record.'
track: system-design
section: Key technologies
order: 300
---

A vector index answers "which stored vectors are closest to this query vector?" Approximate nearest-neighbor algorithms avoid scanning every row. The usual ones in interviews are **HNSW** (a layered graph you walk greedily; high recall, more memory, slower builds) and **IVF** (cluster the space, search a few clusters; faster builds, more tuning of lists and probes). Distance is cosine, dot product, or L2, and it must match how the model was trained.

## What you store

The source of truth is the document, the profile, or the chunk, in a database you can rebuild from. The vector store (pgvector, a dedicated engine, the vector type in your search cluster) holds the embedding, the model version, and the id. Text you will show to the user is fetched from the source by that id, not trusted as the only copy inside the index.

Chunking decides quality more than the brand of index. Too long and the embedding averages unrelated ideas. Too short and you lose context. Overlap chunks if sentences cross a boundary. Store the chunk's source offset so you can cite it.

## Filters

Real queries are "closest, among documents this tenant can see, of this type, newer than T." That is a filtered ANN. Two strategies:

- **Post-filter.** Search wide, drop mismatches. Simple, and recall falls off a cliff when the filter matches a small fraction of the corpus.
- **Pre-filter.** Restrict the candidate set first, then search. Better when the filter is selective. Harder if the index structure does not support it, and the remaining set may be too small for a good graph walk.

Say which you are doing. Measure recall on a labeled set with the filter on, not on a vendor's unfiltered benchmark.

## Hybrids and operations

Exact tokens (a name, a SKU, an error code) should also hit a lexical index. Merge with a simple rank fusion if you do not have a learned reranker, then rerank the top few dozen with a slower model if quality matters.

Updating one vector is cheap. Changing the model is a full re-embed: write a second index, dual-write new documents, backfill, then flip the query path. Keep the model version on every row so you can prove you are not mixing spaces.

Latency: a warmed HNSW query is milliseconds to tens of milliseconds for a million vectors, before you add a network hop and a rerank. Do not put a 200 ms rerank on a typeahead keystroke. Do put it on a search results page if it moves relevance.
