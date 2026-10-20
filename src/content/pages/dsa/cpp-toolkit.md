---
failureModes:
- Declaring priority_queue<int> and treating top() as the minimum.
- Using unordered_map<pair<int,int>, T> with no hash. It does not compile.
- Holding an iterator or a reference across an insert that rehashes.
- Calling std::sort and then assuming equal elements kept their original order.
sayThis:
- The default priority_queue is a max-heap. A min-heap is priority_queue with greater.
- std::hash is not defined for pair. I will write a small hasher or pack the pair into a 64-bit key.
- I will not decrease a key inside a heap. I push the new distance and ignore stale entries.
gaps:
- A language cheat-sheet is not a substitute for the dependency-resolver drill. This page is the
  ten lines you should be able to type without looking them up.
- Paid courses often show Python. These notes are C++17 or C++20 and the standard library only.
references:
- title: Dependency resolver
  url: /helpmeprep/dsa/dependency-resolver
- title: cppreference, priority_queue
  url: https://en.cppreference.com/w/cpp/container/priority_queue
quiz:
- kind: mc
  question: Which declaration is a min-heap of ints?
  choices:
  - priority_queue<int> heap;
  - priority_queue<int, vector<int>, greater<>> heap;
  - set<int> heap;
  - stack<int> heap;
  answer: 1
  explain: The default compare is less<>, so top() is the largest. greater<> flips it.
- kind: mc
  question: Why does unordered_map<pair<int,int>, int> fail to compile?
  choices:
  - pair is too large for a hash table.
  - The standard library does not provide std::hash for pair.
  - unordered_map cannot hold integers.
  - pair must be stored in a vector first.
  answer: 1
  explain: You supply a hash, or you pack two 32-bit ints into one uint64_t key.
- kind: short
  question: Dijkstra needs a shorter distance for a node already in the heap. What do you do?
  reveal: Push the new pair. When you pop a node, skip it if the distance you pop is worse than
    the best you have recorded. priority_queue has no decrease-key.
title: C++ interview toolkit
description: Headers, STL idioms, a min-heap, a hash for pairs, and the pitfalls that cost a
  coding round.
track: dsa
section: Toolkit
order: 10
---

Bring this page into muscle memory before a timed round. The language for every drill on this site is C++17 or C++20, standard library only. If you want a third-party header, you are in the wrong file.

## Headers worth typing from memory

`vector`, `string`, `string_view`, `unordered_map`, `unordered_set`, `map`, `set`, `queue`, `stack`, `priority_queue`, `algorithm`, `numeric`, `optional`, `utility`, `chrono`, `mutex`. Add `iostream` only when you are printing a check. In an interview you usually return values and talk through a couple of asserts.

`string_view` is for a read-only slice of text you do not own. Do not store a `string_view` that points at a temporary `string`.

## Idioms that should be boring

Range-for, structured bindings (`auto [before, after] = edge`), `emplace` instead of a temporary pair, and `reserve` when you know the size. `std::size_t` for indexes you get from a container. `long long` for sums that can exceed 2^31. `std::optional` for "no order because of a cycle," not a magic sentinel you will forget.

Pass large inputs by `const` reference. Return `vector` by value. Named return value optimization is the compiler's job.

## Min-heap

`priority_queue` is a max-heap. Dijkstra and top-K of the smallest distances want the opposite. The compare is the third template argument. `greater<>` is enough. You do not write a functor unless the ordering is not the default pair order.

There is no decrease-key. Push the improved distance anyway. On pop, ignore an entry whose distance is worse than the best you have stored for that node. Say that out loud so it does not look like you forgot.

## Hash for a pair

`std::hash<std::pair<int,int>>` does not exist. Graph code that uses an adjacency map of edges will not compile until you provide one, or until you pack the endpoints. Packing is the interview-speed version when both ids fit in 32 bits: `uint64_t key = (uint64_t)u << 32 | (uint32_t)v`. A hasher is what you write when the types are not integers. The program below does both the heap and the hasher.

```cpp
#include <cassert>
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct PairHash {
  std::size_t operator()(const std::pair<int, int>& edge) const noexcept {
    std::size_t left = std::hash<int>{}(edge.first);
    std::size_t right = std::hash<int>{}(edge.second);
    return left ^ (right + 0x9e3779b97f4a7c15ULL + (left << 6) + (left >> 2));
  }
};

int main() {
  // Min-heap of (distance, node). greater<> flips the default max-heap.
  std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<>> heap;
  heap.emplace(5, 1);
  heap.emplace(1, 2);
  heap.emplace(3, 0);
  assert(heap.top() == std::make_pair(1, 2));
  heap.pop();
  assert(heap.top().first == 3);

  std::unordered_map<std::pair<int, int>, std::string, PairHash> edge_label;
  edge_label.emplace(std::make_pair(1, 2), "depends-on");
  assert(edge_label[std::make_pair(1, 2)] == "depends-on");
  assert(edge_label.find(std::make_pair(2, 1)) == edge_label.end());

  std::cout << "cpp toolkit ok\n";
  return 0;
}
```

## Pitfalls

**Rehash.** Inserting into an `unordered_map` can invalidate every iterator and reference. Do not keep a pointer into a map across an insert. `vector` invalidates on reallocation. `reserve` if you know you will grow.

**`vector<bool>`** is not a container of bools. Use `vector<char>` or a `deque<bool>` if you need real references.

**`std::sort` is not stable.** Equal elements may swap. Use `stable_sort` when the original order is part of the answer, and say the extra memory.

**Signed overflow** is undefined. A loop condition like `i <= n` when `n` is `INT_MAX` is a classic. Prefer sizes you can explain.

**`map` versus `unordered_map`.** The hash table is expected O(1) and unordered. The tree is O(log n) and sorted, which is what you want for a consistent-hash ring (`lower_bound`) or an ordered sweep. Do not pay for order you never use.

**Heap without a handle.** If the problem needs "change this node's priority," a heap of pairs plus lazy deletion is the standard-library answer. A hand-rolled indexed heap is a different problem. Do not start it in minute 40.
