---
failureModes:
- Spending the opening on arithmetic that ends with 'so it is large.'
- Using average QPS to size the peak. Peaks and retries are where you fall over.
- Forgetting replication and indexes, and sizing disk from the raw rows only.
- A latency budget that ignores a cross-region round trip you yourself added.
sayThis:
- I will skip the full capacity sheet until a number chooses a component. The one I want now
  is whether today's clicks fit on one machine.
- Peak is about ten times the average for a consumer app unless I know a sharper spike. I
  size the hot path for peak, and I size batch for the average.
- One hundred million daily active users, a few requests each, is on the order of ten thousand
  requests a second average. I will not pretend to more precision than that.
gaps:
- The public 'numbers to know' page is paywalled, and the free delivery framework tells you
  to skip estimation unless it matters. The result is candidates who either do no math or
  do ritual math. This page is a short, usable set of magnitudes and a rule for when to stop.
- Cost estimation for paid APIs (LLM tokens, SMS, card fees) is absent from the classic latency
  tables. Several of your interviews are cost problems wearing a systems costume.
- Replica multipliers and index overhead are the usual missing factors when someone sizes
  disk from a single copy of the rows.
references:
- title: Hello Interview, public numbers-to-know outline (article may be paywalled)
  url: https://www.hellointerview.com/learn/system-design/core-concepts/numbers-to-know
- title: Google, numbers every engineer should know (Jeff Dean)
  url: https://static.googleusercontent.com/media/research.google.com/en//people/jeff/stanford-295-talk.pdf
quiz:
- kind: mc
  question: About how long is a round trip across the US?
  choices:
  - 1 ms.
  - 10 ms.
  - On the order of 60–80 ms.
  - 2 seconds.
  answer: 2
  explain: Coast to coast is tens of milliseconds. A millisecond is inside a region. Two seconds
    is a timeout, not a distance.
- kind: mc
  question: 100 million DAU, 20 requests each per day. Rough average QPS?
  choices:
  - About 20.
  - About 2,000.
  - About 20,000.
  - About 2 million.
  answer: 2
  explain: 100e6 × 20 / 86400 ≈ 23,000. One significant figure is the point. Then ask what
    peak is.
- kind: short
  question: When do you actually do the math?
  reveal: 'When it decides between one machine and many, between sync and batch, or between
    ''this fits in memory'' and ''it does not.'' Example: daily click volume times bytes tells
    you whether an aggregator needs a fleet. A feed''s ''it is big'' does not.'
title: Back-of-the-envelope estimation
description: The few numbers worth memorizing, and how to use them only when they change the
  design.
track: system-design
section: Core concepts
order: 160
---

Estimation is a design tool with one job: choose between architectures. If the number will not change a box, do not spend the opening on it. Tell the interviewer you will do the math at the point of the decision, then do it there, out loud, with round numbers.

## Magnitudes worth having in your head

| Thing | Order of magnitude |
|---|---|
| L1 / memory / SSD random / cross-AZ / cross-US | ns / 100 ns / 100 µs / under 1–2 ms / ~70 ms |
| In-region Redis or DB point read | about 1 ms, plus your query |
| A modern server | tens of cores, 64–256 GB RAM, on the order of 1–10 Gbps |
| Seconds in a day | about 1e5 (86,400) |
| Comfortable single-node Postgres | low thousands of simple writes/s, much more for reads, until you measure |

These are interview numbers, not a benchmark. Say "on the order of" and move.

## A pattern that does not waste time

1. Write the daily volume from the requirement you were given, or from an assumption you state.
2. Divide by 1e5 to get average per second. Multiply by something like 10 for a consumer peak, unless the product is a ticket drop or a flash sale, in which case the peak *is* the design.
3. Multiply by the bytes you actually store, then by 2 or 3 for replicas and indexes.
4. Ask one question: does the hot set fit in memory? Does the write rate fit one primary? Does the token bill fit the budget?

Example. 500 million short links created per year is about 16 per second average. That is one database. The redirect path at 100× that rate is a cache problem, not a shard problem. The math just told you where to spend the deep dive.

## Cost-shaped math

When the scarce resource is money, estimate units times price. Two million grading calls times 1.5 thousand tokens is 3 billion tokens. If the provider allows 2 million tokens a minute, the batch takes on the order of a day of continuous sending, before retries. That single division tells you whether you need a second provider, a batch API, or a smaller prompt. It is more useful than a QPS slogan.

## Latency budgets

Start from the user promise (say 300 ms). Subtract the round trips you cannot avoid. What is left is the budget for the queue, the model, or the fan-out. If the remainder is negative, the design is already wrong and you should change it before you tune anything.
