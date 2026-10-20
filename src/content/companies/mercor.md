---
failureModes:
- A design that is still on requirements at minute 30, so failure modes and SQL never happen.
- Naming a graph problem as 'I'll just use a class' and stalling on traversal.
- Defending the first algorithm after the interviewer has handed you a hint.
- Waiting to be asked how you use coding agents, then giving a vague answer.
sayThis:
- This is a DAG, so topological order, and a short order means a cycle.
- That choice is O(V+E), one pass. The failure mode is a cycle, which I will report instead
  of looping.
- Good point, that changes the budget. I will spend the model calls only on the uncertain
  band.
gaps:
- This tab is my own practice plan around the general shape of the loop. It is not a list
  of actual interview problems.
- Public system-design courses do not include the cost-shaped algorithms round (limited model
  calls, noisy scores). The worked problems on inference, eval, matching, and labeling exist
  here so this round has somewhere to land.
references:
- title: Delivery framework
  url: /helpmeprep/system-design/delivery
- title: Talent marketplace
  url: /helpmeprep/system-design/talent-marketplace
- title: Expert task routing
  url: /helpmeprep/system-design/labeling
- title: Agent evaluation
  url: /helpmeprep/system-design/agent-eval
quiz:
- kind: mc
  question: On the 45-minute design, when should the drawing be done?
  choices:
  - At the end, as a summary.
  - By about minute 20–25, so the rest is depth, SQL, and failures.
  - Only if they ask you to draw.
  - After the coding block.
  answer: 1
  explain: The strongest signal is a working design early, then failure modes you volunteer.
- kind: mc
  question: 'In the algorithms round, a hint means:'
  choices:
  - Defend the original idea so you look consistent.
  - Update immediately and restate the new cost.
  - Ignore it until you finish the derivation.
  - Ask to skip the problem.
  answer: 1
  explain: Taking the hint is the differentiator they describe.
- kind: short
  question: What do you do in the first five minutes of the coding block?
  reveal: Read every part, name the structure out loud (graph, DAG, cycle), and pick plain
    functions over classes unless the API is the problem.
title: Mercor
description: Prep plan for a Mercor SWE onsite. System design, a multi-part coding block,
  and an algorithms discussion.
track: system-design
section: Companies
order: 10
slug: companies/mercor
role: Software Engineer, Agents
when: Onsite
where: In person
summary: 45-minute system design, a 60-minute coding block plus 30-minute review, and a 30-minute
  algorithms discussion. Each session is scored by a different engineer.
rounds:
- name: System design
  duration: 45 minutes
  format: Live discussion, no coding. Draw it.
  scored:
  - 'Product sense: a small set of requirements and a design that matches them.'
  - 'Data storage and search: real tables, indexes, filters, and ranking.'
  - Optimizations you can justify with a cost, not a logo.
  - Technical communication, including failure modes you raise yourself.
  checklist:
  - 'By minute 25: requirements, API, entities, data model, and a high-level drawing.'
  - Write two indexes and one SQL statement for the hot path.
  - Name three failure modes before they ask (dependency down, duplicate work, hostile input).
  - Offer one deep dive and let them pick.
  topics:
  - system-design/delivery
  - system-design/indexing
  - system-design/postgres
  - system-design/talent-marketplace
  - system-design/labeling
  - system-design/agent-eval
  - system-design/rag
  - system-design/idempotency
  practice:
  - 'Prompt: search and rank experts for a role (talent marketplace page), 45 minutes, timer
    at 25.'
  - 'Prompt: route labeling tasks to experts, including the SKIP LOCKED claim.'
  - 'Prompt: an eval harness for coding agents, using your sandbox split.'
  - 'Prompt: grade an interview with a rubric, versions, and a human review queue.'
  - 'Failure-mode drill: pick any box and list six ways it breaks, in three minutes.'
- name: Coding challenge
  duration: 60 minutes solo, then 30 minutes review
  format: Multi-part problem on your laptop. Correct first, then faster.
  scored:
  - 'Fundamentals, especially graphs: traversal, cycles, reachability, complexity.'
  - Problem solving and original thinking on later parts.
  - 'Communication in the review: approach, complexity, tests, what you would change.'
  checklist:
  - Read all parts. Say the structure out loud in the first five minutes.
  - unordered_map and functions. A class only if the API is the problem. Write C++.
  - 'Tiny tests: empty, single node, cycle, disconnected.'
  - A comment per part with time and space, read out before they ask.
  - A correct partial beats a half-finished optimal on every part.
  topics:
  - dsa
  - dsa/cpp-toolkit
  - dsa/dependency-resolver
  - system-design/queues
  practice:
  - 'Ladder: course schedule (cycle), course schedule II (order), parallel courses (longest
    path in a DAG), recipes from supplies.'
  - 'Union-find: redundant connection, accounts merge.'
  - Dijkstra and 'at most K edges' (plain Dijkstra is wrong there).
  - 'Mock: dependency resolver in four parts (transitive deps, install order, the cycle path,
    parallel install time plus who must reinstall).'
- name: Algorithms
  duration: 30 minutes
  format: Live reasoning about a messy quantitative problem. Not a memorized puzzle.
  scored:
  - Reasoning rather than retrieval.
  - Taking a hint immediately.
  - Putting a number on the trade-off (calls, dollars, latency, accuracy).
  - Saying where your approximation is wrong, before they do.
  checklist:
  - Baseline, cost, better idea, new cost, where it breaks, how you would notice.
  - If they nudge, say the nudge changed the design. Do not defend the first idea.
  - Stay precise when you are unsure. Hand-waving is the negative note.
  topics:
  - system-design/dedup
  - system-design/estimation
  - system-design/rate-limiting
  - system-design/top-k
  practice:
  - Dedup a million profiles with at most 50k model calls. Block, then score, then spend the
    model on the uncertain band. Watch transitive merges.
  - Pick the top 10 of 500 candidates when every score is noisy and you have about 3,000 evaluations.
  - Schedule 2 million grading calls under a token rate limit and a dollar budget.
  - Assign 5,000 tasks to 400 experts with capacity. Greedy versus min-cost flow, and where
    greedy is wrong.
  - Estimate a pass rate within two points. Paired comparisons on the same tasks.
- name: How you ship, and how you use models
  duration: Woven through the day
  format: Bring it up. They will not always ask.
  scored:
  - Evidence you ship quickly, with a number and a time box.
  - Evidence you use coding agents in real work and still own diagnosis and tests.
  checklist:
  - '90 seconds: situation, what was at stake, what you did, a number, how the model was used,
    how long it took.'
  - Do not recite. Stop and let them ask.
  topics:
  - system-design/llm-inference
  - system-design/agent-eval
  - system-design/rag
  practice:
  - Say two project stories out loud in under two minutes each.
  - Prepare the tools answer with one habit you actually have.
---

## The day

Several sessions, each scored by a different engineer, so one weak session doesn't decide it. Ask what tools are allowed in each block. Don't assume an assistant is allowed.

Three habits, until they are boring: name the structure in the first two minutes, say the cost when you pick an approach, and say what breaks before moving on.

## Using coding agents

Have a short, honest answer ready: what I use them for (scaffolding, mapping unfamiliar code, drafting tests) and what I keep for myself (diagnosis, test design, reviewing every diff). One concrete habit beats a list of tools.

## Stories

About 90 seconds each. One number I can defend, one line on how I used a model, then stop and let them ask. Keep job titles and dates consistent with the resume they have.

## Questions to ask

- What does the team own end to end, and what is hard about it right now?
- How do you know an agent pipeline change worked?
- What does a normal week of shipping look like, and how big is a PR?
- Where do cost and quality trade off: model choice, number of calls, or human review?

## Bring

A laptop with `g++ -std=c++20` working offline, a scratch repo, a drawing tool, a charger, and a display adapter.
