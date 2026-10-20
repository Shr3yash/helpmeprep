---
failureModes:
- Ignoring event time, so a late click lands in the wrong hour and the aggregate lies.
- A window that never closes because one partition stopped sending watermarks.
- Counting in a consumer with no checkpoint, so a restart double-counts the afternoon.
- Reaching for a streaming job when a nightly SQL query would answer the question.
sayThis:
- Clicks land on a log. A stream job windows them by event time and writes aggregates. I need
  watermarks so a late event has a defined home.
- Workers that pull jobs are not a stream processor. I want Flink, or an equivalent, when
  the result is a continuous aggregate and order and time matter.
- Checkpoints make restart deterministic. The sink still has to be idempotent if I write to
  a database that is outside the checkpoint.
gaps:
- The public Flink page is paywalled. The free Kafka page stops at the log. Candidates then
  implement 'realtime analytics' as a consumer that increments Redis and cannot explain late
  data or a restart.
- Event time versus processing time is the concept that makes windowed metrics correct, and
  it is missing from the free technology map.
- 'This page also says when not to bother: a lot of ''streaming'' interviews are satisfied
  by a queue and an idempotent worker. Use a stream processor when the window is the product.'
references:
- title: Hello Interview, public Flink outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/deep-dives/flink
- title: Flink, event time and watermarks
  url: https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/
quiz:
- kind: mc
  question: A click happened at 10:59 and arrived at 11:02. Which time should decide its hourly
    bucket?
  choices:
  - Processing time, always, because it is simpler.
  - Event time, if the product means 'clicks that occurred in that hour.'
  - The average of the two.
  - Kafka partition time, which is not a thing.
  answer: 1
  explain: Processing time measures your pipeline. Event time measures the world. Ads and
    billing care about the world, and then you must define lateness.
- kind: mc
  question: 'A watermark at time T means:'
  choices:
  - Every event ever has been processed.
  - The operator believes future events will have timestamps after T, within the lateness
    you configured.
  - The checkpoint failed.
  - The window is a count of 100.
  answer: 1
  explain: Watermarks close windows. A stuck source that does not advance the watermark stalls
    every downstream window.
- kind: short
  question: When is a plain consumer enough?
  reveal: 'When each record is an independent job: send this email, claim this task, resize
    this image. When the output is ''counts and uniques over the last five minutes, correctly,
    across restarts and late data,'' you want a stream processor with windows, state, and
    checkpoints.'
title: Stream processing
description: 'What a system like Flink is for: continuous computation over a log, windows,
  watermarks, and the difference from a pile of workers.'
track: system-design
section: Key technologies
order: 280
---

A stream processor reads a log forever, keeps state, and emits an updated answer. Flink, Spark Structured Streaming, Kafka Streams, and a few cloud cousins do this. A pool of workers pulling jobs does not, even if the jobs happen to come from Kafka.

## Why it exists

You can write a consumer that increments a counter. It will work until a restart replays an hour of events and the counter doubles, or a batch of late events falls into the next minute, or you need the count per ad per city and the state no longer fits in a hash map you manage yourself. A stream processor checkpoints state and offsets together, so a restart continues rather than redoing the side effect blindly. It also understands time.

## Time

**Processing time** is when your job saw the event. **Event time** is when it happened, carried in the payload. Windows (tumbling five minutes, sliding one hour, a session that ends after inactivity) should usually be event-time windows for anything a human will call a metric.

A **watermark** is the job's hypothesis that events earlier than T have already arrived. When the watermark passes the end of a window, the window closes and emits. Events later than the watermark are late. You either drop them, update the result (a retractable sink), or put them in a side output. Say which. A source that stops advancing watermarks freezes every window downstream, which is a production incident mode worth naming.

## State and sinks

Keyed state (the count for this ad, the set of users in this window) lives with the key's partition and is checkpointed. The sink that receives the aggregate should be idempotent, because some sinks sit outside the checkpoint transaction. Writing "hour=11, ad=9, clicks=1042" as an upsert is safe. Blindly incrementing a row is not, unless the checkpoint and the write are tied together.

## When to skip it

If the interview is "send a notification when an order is placed," draw a queue and a worker. If the interview is "top ads in the last five minutes" or "dedupe clicks across a day," draw a log and a stream job, and spend your time on the window, the late-event rule, and the hot key.
