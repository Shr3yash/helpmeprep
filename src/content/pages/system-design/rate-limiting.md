---
failureModes:
- 'A fixed window that allows twice the limit at the boundary: a burst at 0:59 and another
  at 1:00.'
- Limiting only at one app server, so N servers allow N times the budget.
- A global Redis INCR that becomes the hot key for your most important customer.
- Returning 429 with no Retry-After, so well-behaved clients retry immediately and make it
  worse.
sayThis:
- I will limit per API key and per IP at the gateway, with a token bucket so a small burst
  is allowed and the steady rate is not.
- The counter has to live somewhere shared. Redis, with a short script so the check and the
  increment are atomic. If Redis is down I fail open for a read API and fail closed for login.
- 429 includes Retry-After. I do not want polite clients to become the attack.
gaps:
- The public guide teaches rate limiting mainly as a worked problem and as a Redis feature.
  The concept page here separates the algorithm from the distributed implementation so you
  can answer either prompt.
- Fail-open versus fail-closed when the limiter's datastore is down is rarely in the free
  write-up. It is a one-line product decision and interviewers ask it.
- Cost-based limits (tokens per minute, not just requests) are the version you need for LLM
  providers. Request counting alone will not keep you under a token budget.
references:
- title: Hello Interview, public rate limiter breakdown
  url: https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter
- title: Redis, INCR
  url: https://redis.io/docs/latest/commands/incr/
quiz:
- kind: mc
  question: Why can a fixed one-minute window allow 2× the intended rate?
  choices:
  - Redis is eventually consistent.
  - A client can spend the whole budget at the end of minute N and the whole budget at the
    start of minute N+1.
  - TCP retries double the count.
  - The load balancer drops alternate requests.
  answer: 1
  explain: The window resets abruptly. A sliding window or a token bucket does not hand out
    two full budgets a second apart.
- kind: mc
  question: The limiter's Redis is unreachable. You are protecting password guesses. What
    do you do?
  choices:
  - Fail open, so users can still log in.
  - Fail closed. A missing limiter must not disable brute-force protection.
  - Allow unlimited attempts for five minutes.
  - Skip auth.
  answer: 1
  explain: Fail open is reasonable for a product read you would rather serve. Fail closed
    is the right call when the limit is a security control.
- kind: short
  question: Token bucket in one sentence.
  reveal: Each key has a bucket of tokens that refills at a steady rate up to a capacity.
    A request takes a token. If the bucket is empty, reject. Capacity is the burst. Refill
    rate is the sustained rate. Memory is O(1) per key.
title: Rate limiting
description: Token buckets, sliding windows, and where to enforce a limit so one client cannot
  sink the fleet.
track: system-design
section: Core concepts
order: 150
---

A rate limit is a promise about fairness and survival: no single caller, bug, or retry storm gets to consume the whole service. Decide the key (user, token, IP, tenant), the budget (requests, or a cost such as tokens), and the window. Then decide where the counter lives.

## Algorithms

**Fixed window.** Increment a counter that expires at the end of the minute. Tiny memory, and a burst at each boundary can double the rate. Say that flaw if you propose it.

**Sliding window log.** Keep the timestamps of recent requests and evict those outside the window. Accurate, and the memory grows with the limit. Fine for a strict per-user cap of 100. Painful at millions of keys with a high limit.

**Sliding window counter.** Blend the previous window's count with the current one, weighted by how far you are into the minute. Approximate, O(1), good enough for most APIs.

**Token bucket.** A bucket refills at `rate` up to `capacity`. Each call takes a token. This is the one to draw: it allows a burst (capacity) and enforces a steady rate. GCRA is the same idea with different arithmetic.

The arithmetic, with a mutex so two checks cannot both observe a stale balance:

```cpp
#include <algorithm>
#include <cassert>
#include <chrono>
#include <iostream>
#include <mutex>

// Token bucket. Refill is computed from elapsed time, capped at capacity.
// A burst of `capacity` is allowed; the steady rate is `rate_per_sec`.
class TokenBucket {
 public:
  TokenBucket(double rate_per_sec, double capacity)
      : rate_(rate_per_sec), capacity_(capacity), tokens_(capacity) {}

  bool allow(std::chrono::steady_clock::time_point now, double cost = 1.0) {
    std::lock_guard lock(mu_);
    if (seen_) {
      double elapsed = std::chrono::duration<double>(now - last_).count();
      if (elapsed > 0) tokens_ = std::min(capacity_, tokens_ + elapsed * rate_);
    }
    seen_ = true;
    last_ = now;
    if (tokens_ < cost) return false;
    tokens_ -= cost;
    return true;
  }

 private:
  std::mutex mu_;
  double rate_;
  double capacity_;
  double tokens_;
  bool seen_ = false;
  std::chrono::steady_clock::time_point last_{};
};

int main() {
  using clock = std::chrono::steady_clock;
  auto t = clock::time_point{};
  TokenBucket bucket(/*rate_per_sec=*/1.0, /*capacity=*/2.0);
  assert(bucket.allow(t));
  assert(bucket.allow(t));
  assert(!bucket.allow(t));
  t += std::chrono::seconds(1);
  assert(bucket.allow(t));
  assert(!bucket.allow(t));
  std::cout << "token bucket ok\n";
  return 0;
}
```


## Where it runs

Enforce at the edge for abuse, and again inside the service for a business rule ("this merchant gets 50 order posts a second"). A limit that lives only in process memory is multiplied by the number of machines. Put the shared counter in Redis. Do the read-modify-write in one Lua script or `INCR` plus `EXPIRE`, so two requests cannot both observe "under the limit."

Local token buckets plus a periodic sync are how you avoid making Redis a hot key. You trade a little overshoot for not serializing every request of your largest tenant through one key. For a login budget, overshoot is the wrong trade. For a feed API, it is fine.

Return **429** and `Retry-After`. Log the key that was limited so you can tell an attack from a broken client. When the counter store is down, fail open if availability of a read matters more, and fail closed if the limit is the security control.

For model providers, budget tokens as well as requests. A short prompt and a 100k-token prompt are not the same cost, and the provider's 429 will be in tokens whether you counted them or not.
