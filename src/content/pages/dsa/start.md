---
failureModes:
- Starting to code before you have named the structure (tree, DAG, union-find).
- Building a class hierarchy for a problem that is three hash maps.
- Finishing with no complexity statement and no test for the empty input.
sayThis:
- This is a DAG, so I will topo-sort it and treat a short result as a cycle.
- I am going to get a correct version and run it before I make it clever.
gaps:
- The shorter graph ladder (union-find, Dijkstra with a hop limit) is still a checklist on
  the Mercor tab, not a separate article. Promote one when you want it searchable.
- The dependency resolver is a drill I wrote myself to practice multi-part graph problems.
references:
- title: Mercor company track
  url: /helpmeprep/companies/mercor
- title: DoorDash company track
  url: /helpmeprep/companies/doordash
quiz:
- kind: mc
  question: In a 60-minute multi-part coding block, what should you protect first?
  choices:
  - A clever abstraction for part 4.
  - A correct solution and a test for the part you are on, plus the complexity out loud.
  - The fastest asymptotic answer even if it is untested.
  - A GUI.
  answer: 1
  explain: Correct parts beat a half-finished optimal sketch. Say the complexity before they
    ask.
- kind: short
  question: Where do you look before you start the dependency resolver?
  reveal: The C++ toolkit page for the heap, the pair hash, and the headers. Then the resolver.
    The Mercor tab still has the shorter graph ladder. The DoorDash tab has the service-shaped
    drills (merge windows, partial failure, O(1) random pick).
title: DSA practice
description: Timed coding drills. The first worked problem is a four-part dependency
  resolver for the Mercor graph block.
track: dsa
section: Start here
order: 10
slug: dsa
---

This track holds drills you want to reread, not a second copy of every LeetCode statement.

For Mercor's coding block, the structure to have in your hands is: BFS and DFS, Kahn's topological sort, directed cycle detection, union-find, and Dijkstra. The language is C++. The [toolkit](/helpmeprep/dsa/cpp-toolkit) is the heap and the pair hash. The [dependency resolver](/helpmeprep/dsa/dependency-resolver) is a four-part mock you can time at 60 minutes: can we install, in what order, name one cycle, then the parallel install time. Say the structure in the first five minutes. Prefer `unordered_map` and functions. Write a test for empty input, a cycle, and a disconnected node. State complexity per part without being asked. The company tab still has the shorter ladder (course schedule through the harder DAG problems) if you want more reps of the same idea.

For a service-shaped coding round (DoorDash-style), the algorithm is wrapped in a service: read the given types, run the given test, then handle status codes. The company tab has that checklist. If `std::sort` is banned, write merge sort.

When the next drill is worth keeping, add `src/content/pages/dsa/<name>.md` with `track: dsa`. Include a solution you wrote, the complexity, the tests, and a quiz. The sidebar lists it next to this page because the track is already in `src/content/tracks.json`. A good second page is union-find (accounts merge) or "cheapest flights within K stops," where plain Dijkstra is the wrong tool.
