---
failureModes:
- A composite index with the range column first, so the equality filter cannot use it.
- Indexing every column 'to be safe' and turning a write-heavy table into an index-maintenance
  problem.
- A selective filter applied after a vector search, so you fetch a thousand neighbors and
  throw away 990.
- Expecting an inverted index to support a transactionally consistent join with your primary
  table.
sayThis:
- Equality columns first, then the range or sort column. This query is skill = rust and level
  >= 4, so the index is (skill, level, expert_id).
- A partial index on status = 'open' keeps the queue index small. Closed tasks do not belong
  in it.
- B-tree for the point and range lookups I can name. LSM when the table is append-heavy. Inverted
  for text. A geo index only for the proximity query.
gaps:
- The public guide's indexing article is behind the lock, and the free data-modeling page
  only points at it. Candidates who stay on the free path design tables with no indexes and
  then 'add Redis.'
- Free material rarely shows a partial index, a covering index, or the leftmost-prefix rule
  with a real query. Those three sentences are most of the SQL signal in a design interview.
- Geospatial and vector indexes get a separate deep dive or a premium page. This page puts
  them next to B-trees so you pick an index family instead of a product name.
references:
- title: Hello Interview, public indexing outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/core-concepts/db-indexing
- title: Postgres, indexes
  url: https://www.postgresql.org/docs/current/indexes.html
- title: Postgres, GiST and SP-GiST
  url: https://www.postgresql.org/docs/current/gist.html
quiz:
- kind: mc
  question: A query filters status = 'open' AND priority >= 5 ORDER BY created_at. Which index
    matches?
  choices:
  - (created_at, status, priority)
  - (status, priority, created_at)
  - (priority) only
  - A hash index on created_at
  answer: 1
  explain: Equality first (status), then the range (priority), and created_at can ride along
    as the sort if the planner can use the rest. Leading with the sort column does not serve
    the equality.
- kind: mc
  question: Why do LSM engines favor writes?
  choices:
  - They update the row in place inside a B-tree page.
  - They append to a memory table and flush sorted runs, paying for reads with compaction
    and bloom filters.
  - They skip the disk entirely.
  - They lock the whole table.
  answer: 1
  explain: The write is a sequential append. Reads may check several runs. Compaction is the
    background cost.
- kind: short
  question: When do you reach for an inverted index instead of a B-tree?
  reveal: When the query is 'documents containing these tokens,' not 'rows with this id.'
    The index maps term to postings. It is the heart of search engines and of Postgres GIN
    on tsvector or jsonb. It is a poor fit for transactional point updates of a balance.
title: Indexing
description: 'B-trees, LSM trees, inverted indexes, and geospatial indexes: what each one
  makes cheap, and what it costs on the write path.'
track: system-design
section: Core concepts
order: 70
---

An index is a second data structure that makes one class of lookup cheap and makes every write do more work. Name the query, then name the index. The other order is how you get a slow database with a large disk.

## B-trees

The default in Postgres, MySQL, and most relational engines. Leaves are sorted, so equality, range, and `ORDER BY` can all use the same structure. A composite index `(a, b, c)` supports predicates that use a left prefix: `a`, then `a,b`, then `a,b,c`. It does not efficiently support `b` alone.

Put columns you test with `=` first. Put the range or the sort last. A covering index includes the extra columns the query selects, so the engine never visits the table. A partial index restricts who is in the index (`WHERE status = 'open'`). That is the right tool for a work queue: the index stays proportional to the backlog, not to history.

Hash indexes only do equality. They are rarely the thing you ask for by name.

## LSM trees

Log-structured merge trees, used by Cassandra, RocksDB, LevelDB, and many modern storage engines, turn a write into an append to a memory buffer. When the buffer fills, it flushes as a sorted run. Reads check the memory buffer and then the runs, skipping runs with a bloom filter. Compaction merges runs so reads do not degrade forever.

Choose an LSM-backed store when the workload is write-heavy and the reads are by the primary key you designed. The bill comes due as write amplification and as worse performance on read-modify-write of a random old row.

## Inverted indexes

An inverted index maps a term to the list of documents that contain it. That is search. Rankers (BM25) score those postings. Postgres can do a smaller version with `tsvector` and GIN. Elasticsearch and OpenSearch are this structure with a distributed query layer. Updates are not like row updates: changing one word rewrites a segment, which is why search indexes are often rebuilt from a change stream rather than updated in place on the request path.

## Geospatial and vector indexes

Geospatial indexes (geohash, R-tree, S2 cells) answer "what is near this point?" without scanning the planet. You still decide the radius and the tie-break. Vector indexes (HNSW, IVF) answer "what is near this embedding?" approximately. Both degrade when you also apply a very selective filter. Say whether you filter first (and risk a tiny candidate set the index cannot navigate) or search first and filter after (and risk missing good neighbors that failed the filter). That sentence is the whole deep dive.

Every index costs memory and write latency. In the interview, two or three justified indexes beat a schematic covered in them.
