---
failureModes:
- Writing code before you have run the provided test and read the given classes.
- Retrying a 400, or treating every upstream failure as fatal when only one dependency is
  hard.
- Pasting the whole AI Code Craft prompt into the assistant and not reading the diff.
- Executing a DAG in topological order so the on-time branch still refunds.
- A behavioral story with an invented number.
sayThis:
- If upstream returns 503 I retry with backoff. If it returns 400 I do not. Retrying a bad
  request repeats it.
- I am keeping the pure merge separate from the fetch so I can test each one.
- Same order id twice. State moved once. That is the idempotency key, and the check is inside
  the lock.
gaps:
- The coding round is service-shaped, not LeetCode. A generic DSA plan misses status codes,
  partial failure, and reading existing scaffolding.
- The AI Code Craft round grades how you direct an agent and how you verify, including duplicates
  and a process that stays running. Classic system-design pages do not rehearse that live
  loop.
- This tab is my own study plan built around DoorDash's public description of the loop. It
  is not a list of actual interview questions.
references:
- title: Idempotency and retries
  url: /helpmeprep/system-design/idempotency
- title: Rate limiting
  url: /helpmeprep/system-design/rate-limiting
- title: Food delivery dispatch
  url: /helpmeprep/system-design/food-delivery
- title: DoorDash on rebuilding interviews around AI
  url: https://careersatdoordash.com/blog/doordash-is-rebuilding-its-engineering-interviews-around-ai/
quiz:
- kind: mc
  question: 'The ICR is best prepared as:'
  choices:
  - A LeetCode contest.
  - 'A service problem: read their code, run their test, handle status codes, then the algorithm.'
  - A system-design whiteboard.
  - An open-book AI session.
  answer: 1
  explain: It is not a LeetCode-style round. Algorithms still show up inside the service.
- kind: mc
  question: 'A refund DAG says: if the order is late, refund. A topological execution of every
    node will:'
  choices:
  - Only refund late orders.
  - Also refund on-time orders, because topo order says when a node may run, not whether the
    branch was taken.
  - Deadlock.
  - Skip the start node.
  answer: 1
  explain: Follow the chosen branch. Do not run every node because the graph listed it.
- kind: short
  question: What has to be true of a duplicate order in the AI code craft round?
  reveal: A second delivery of the same id does not double-apply. The key is stable across
    retries, and the check-and-record happens inside the lock. Demo it with curl before you
    add features.
title: DoorDash
description: Prep plan for a DoorDash SWE loop. Interactive coding, AI code craft, and an
  engineering-values conversation.
track: system-design
section: Companies
order: 20
slug: companies/doordash
role: Software Engineer
when: Virtual onsite
where: Remote
summary: Not a LeetCode round. A service-shaped coding problem, then a live build from an
  empty directory with an AI assistant, then a behavioral conversation with an EM.
rounds:
- name: Interactive coding
  duration: 60 minutes (about 50 on the problem)
  format: Shared editor, live with an engineer. I write C++. No AI tools.
  scored:
  - Fundamentals, communication, and clarifying questions.
  - Problem solving and trade-offs.
  - Debugging, iteration, and extensible code.
  - 'Reliability: upstream failures, latency, missing data, HTTP status codes.'
  checklist:
  - 'Minutes 0–3: read every given class and run the provided test before writing.'
  - Ask what a 500, a 404, and a timeout should do.
  - Keep pure logic separate from the fetch.
  - 'Add tests: empty, invalid, boundary, duplicate, upstream error.'
  - State complexity and one extension.
  topics:
  - system-design/apis
  - system-design/idempotency
  - system-design/rate-limiting
  - dsa
  - dsa/cpp-toolkit
  - lld/ttl-cache
  practice:
  - 'Merge overlapping or touching intervals without std::sort. O(n log n) with my own merge
    sort.'
  - 'Aggregator endpoint: one hard dependency (fail with 500), the rest soft (200 plus a degraded
    list). Call the soft ones in parallel.'
  - 'Insert, delete, get-random in O(1): vector plus index map, swap-with-last remove. The bug
    is forgetting the last-element case.'
  - 'Also drill: k nearest eligible Dashers, sliding-window rate limit, LRU with TTL that
    does not cache failures.'
- name: AI code craft
  duration: 60 minutes (about 50 building)
  format: Build from an empty directory with an AI coding assistant, screen shared.
  scored:
  - Problem solving, not pasting the prompt and walking away.
  - 'AI fluency: small prompts, context, reading the output.'
  - Code quality and catching the corners the model skipped.
  - Communication and scope. Velocity matters. A running demo matters more than a perfect
    design.
  - Correctness under duplicates and near-simultaneous requests. Test coverage is not the
    grade. Running the system is.
  checklist:
  - 'Minute 1: ask what must be running at the end and how you will demo it (curl, ports).'
  - Copy the prompt into PROMPT.md. Write the decisions you clarified.
  - Something is running by minute 20. Demo a duplicate by minute 35.
  - One slice at a time. Read every diff. Commit when it is green.
  - Idempotency key stable across retries, checked inside the lock.
  - If you have seen the problem, or think the tool has, say so.
  topics:
  - system-design/idempotency
  - system-design/sagas
  - system-design/long-running
  - system-design/queues
  practice:
  - 'Rewards checker from an empty folder: a process that stays up, POST orders returns 202,
    duplicates do not double-count, a bad payload is 400.'
  - 'Refund workflow: separate services, follow the chosen branch of the DAG, do not refund
    an on-time order just because it appears in a topological order, same idempotency key
    on the refund call.'
  - 'Dispatch starter: read an existing small codebase, fix assignment bugs, then add decline
    and reassignment.'
- name: Engineering values
  duration: 30 minutes
  format: With an engineering manager. One or two stories with follow-ups, then my questions.
  scored:
  - Relevant experience.
  - Ownership.
  - 'Make room at the table (inclusion), in their words: the best idea wins and the person
    closest to the problem speaks.'
  - '1% better every day: your own growth, and iterating on something you shipped.'
  checklist:
  - About 90 seconds, then stop. Say I, one real number, one lesson.
  - 'Tie the story to a customer: Dashers, merchants, or consumers.'
  - Have a real inclusion story ready. Do not improvise one.
  - Bring two questions about the team.
  topics:
  - system-design/idempotency
  - system-design/observability
  practice:
  - One ownership story, one debugging story, one inclusion story, one failure story.
  - Say each out loud in under two minutes.
---

## Coding round

Expect models, a mock upstream, and a service with a TODO. Read the given code and run the provided test before writing anything. Ask early whether built-ins like `std::sort` are allowed.

Status codes to have ready: 200, 201, 202, 204. 400 and 401/403 are not retried. 404 means I decide (often empty). 409 conflict, 422 validation, 429 retry after `Retry-After`. 500 maybe, 502/503/504 retry with jitter. A timeout is retried only if the call is idempotent or carries a key.

Partial failure in an aggregator: the identity call is fatal, the others return what they have plus a `degraded` list. Don't hide a failure in a silent null.

## AI code craft

Plan briefly, then build. The standard library is enough. An `unordered_map` behind a `mutex` is enough to demo correctness; say persistence was cut on purpose.

The trap in a workflow problem: topological order is not control flow. Follow the branch that was actually taken. A retried call uses the same idempotency key, not a new UUID per attempt. Return 202 if the work is slow and do it on a worker so the process stays up.

Narrate while the model runs. Read every diff. If I reject a line, say why. End with a short summary that only claims what I actually ran.

## Values

About 90 seconds per story, one real number, one lesson. Tie it back to Dashers, merchants, or consumers. Don't guess a metric.

## Before the day

- Screen share tested on the whole desktop, not a window.
- `g++ -std=c++20`, `git`, and `curl` work offline. An empty scratch directory exists.
- If full-screen share fails, share the editor and terminal one after another and say so.
