---
failureModes:
- Jumping into classes before naming the use cases and the invariants.
- A God class that owns every method because splitting felt slower in the interview.
- Ignoring concurrency on a design that is obviously shared mutable state.
sayThis:
- I will list the operations, then the types, then who is allowed to mutate what.
- I am keeping the board small enough to talk about one hard method in depth.
gaps:
- Most LLD material starts with a parking-lot class diagram. The first page here is a TTL
  cache instead, because that is the follow-up I actually expect in a coding round.
- A second problem (a job runner, a parking lot) is still to do.
references:
- title: TTL cache with LRU
  url: /helpmeprep/lld/ttl-cache
- title: DoorDash company track
  url: /helpmeprep/companies/doordash
quiz:
- kind: mc
  question: What belongs in an LLD interview before the class diagram?
  choices:
  - The cloud region.
  - The use cases and the invariants the objects must hold.
  - A Kafka partition count.
  - A CDN cache key.
  answer: 1
  explain: LLD is the types and the rules. System design is the boxes. Do not start with either's
    tools.
- kind: short
  question: How do you add the first real LLD page?
  reveal: 'Create src/content/pages/lld/some-problem.md with track: lld, a section, an order,
    and a quiz. The sidebar and the home-page count pick it up on the next build.'
title: Low-level design
description: Class and object design. Start with the TTL cache, then add the next problem
  as a markdown file.
track: lld
section: Start here
order: 10
slug: lld
---

Low-level design interviews ask you to model types, relationships, and a few operations in code-level detail. The first worked problem on this track is an [in-memory cache with TTL and LRU eviction](/helpmeprep/lld/ttl-cache). It is a common follow-up in service-style coding rounds: O(1) get and put, expiry, and a rule that failures are not cached for the success TTL. Read it once, then close it and redraw the two structures and the lock from memory.

The system-design track is still the bulk of the site, because that is the Mercor loop. This track is where a problem becomes types and one hard method.

When you add the next problem, use the same shape: what is in scope, the types, the tricky method, the concurrency story, and what you would not build. Put the quiz in frontmatter or in `src/content/quizzes/lld/<slug>.yaml`. A parking lot or a multi-threaded job runner is a reasonable second page. Do not paste a problem from a paid course. Write the version you can redraw from memory.

You can also mine the system-design notes. The claim query on the labeling page is already halfway to an object: `TaskQueue.claim(skill) -> Task` with a lease. Writing that as a class, with tests, is a good next page.
