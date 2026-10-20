---
failureModes:
- Averaging a latency that is bimodal, so a 5% timeout hides inside a pretty mean.
- Logging request bodies full of resumes, tokens, or card numbers.
- A health check that returns 200 while the work queue is an hour behind.
- No trace id across the queue, so a failed grade cannot be tied back to the request.
sayThis:
- 'I will alert on symptoms a user feels: error rate, p99 latency, and age of the oldest queued
  job. CPU is a debugging tool, not the page.'
- p99, not the average. And a burn alert on the SLO, so a slow leak pages before a cliff does.
- Every log line carries a request id, and the worker logs the same id it pulled off the message.
gaps:
- Observability is not a free concept page. It appears as a premium 'design metrics monitoring'
  problem and as a footnote in technology chapters. Interviewers still ask 'how do you know
  it is broken?' on every design.
- RED versus USE, SLOs, and cardinality blowups are missing from the free path. One bad label
  (user id on a metric) will take down the monitoring system, which is a delightful outage
  to describe and a bad one to have.
- This page connects the signals to the failure modes you already named, instead of listing
  tools.
references:
- title: Google SRE, monitoring distributed systems
  url: https://sre.google/sre-book/monitoring-distributed-systems/
- title: OpenTelemetry documentation
  url: https://opentelemetry.io/docs/
quiz:
- kind: mc
  question: Which alert matches user pain most directly?
  choices:
  - CPU above 70% for one minute.
  - p99 latency of the checkout route above the SLO for ten minutes.
  - Disk used by logs.
  - A deploy happened.
  answer: 1
  explain: CPU can be high on a healthy box and low on a wedged one. Latency and errors are
    what users experience.
- kind: mc
  question: Why is user_id a dangerous metric label?
  choices:
  - Users dislike being measured.
  - 'Cardinality explodes: one time series per user will overwhelm the metrics database.'
  - OpenTelemetry forbids strings.
  - It breaks tracing.
  answer: 1
  explain: 'Labels should be low-cardinality: route, status, region. Put user id in a log
    or a trace, where it is an event, not a series.'
- kind: short
  question: What three signals do you want on a request path?
  reveal: 'Rate, errors, and duration (RED): how many requests, how many failed, and the latency
    distribution. For the queue, add the age of the oldest message. Together those tell you
    it is broken before a customer does.'
title: Observability
description: 'Logs, metrics, and traces: what you watch so you know the system is broken before
  a user files the ticket.'
track: system-design
section: Core concepts
order: 170
---

Observability is how you answer "is it broken, and where?" without SSH. In a design interview you do not need a vendor tour. You need the three signals you would page on, and the id that ties a user's failure to a log line.

## Three kinds of telemetry

**Metrics** are numbers over time, cheap to keep, and the thing you alert on. For a request path, record rate, error rate, and a latency histogram (RED). For a worker, record queue age, success, and retry count. For a machine, CPU, memory, and disk (USE) explain a symptom. They are not the symptom.

Alert on p95 or p99 and on error ratio, ideally against an SLO ("99.9% of redirects under 50 ms") with a burn-rate alert. A threshold on the mean hides the tail. A threshold on CPU pages you for a backup job.

**Logs** are discrete events. Give them a level, a request id, and structured fields. Do not log payloads that contain secrets, resumes, or payment data. Log the decision ("idempotency replay", "upstream 503, attempt 2") so a future you can reconstruct it.

**Traces** follow one request across services and through a queue. Propagate the trace id on the message. Without that, the worker's failure is an orphan. You do not need tracing on day one of a design. You need to say the id survives the async boundary.

## What "healthy" means

A process health check should fail when the process cannot do the job: the database pool is exhausted, or the worker cannot dequeue. A check that always returns 200 keeps a broken box in the load balancer.

For async systems the user-facing health is the lag. A website that returns 200 while grades sit for six hours is down, and only the queue-age alert knows it.

## Cardinality and cost

Every unique combination of labels is a time series. Route and status code are fine. User id, raw URL, or exception message is how you knock over the monitoring cluster. High-cardinality facts belong in logs and traces, sampled if the volume is huge.

Say you would dashboard the deep-dive bottleneck specifically: cache hit rate, replica lag, 429s from the model provider, double-claim attempts. The metric should match the failure mode you already wrote down.
