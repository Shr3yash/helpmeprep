---
failureModes:
- Generating a new idempotency key on every retry, which guarantees a duplicate charge.
- Checking the dedup table outside the transaction that performs the side effect.
- Storing the key forever with no plan, or storing it for less time than clients retry.
- Treating a 200 from an upstream as proof the effect happened. Some 200s are incomplete.
sayThis:
- The client sends one key for the logical operation and reuses it on retry. I store the key
  and the response. A replay returns the same response and does not move money again.
- At-least-once delivery is fine because the consumer's write is conditional on a unique constraint.
- I retry 429 and 5xx with jittered backoff. I do not retry 400. A timeout is retried only
  with the same key.
gaps:
- Public API pages mention idempotency keys in a list. They do not walk the race (two retries
  in flight), the storage (same database as the side effect), or the TTL (longer than the
  client's retry budget).
- Retry policy is usually 'exponential backoff' with no distinction between a malformed request
  and a downed dependency. That distinction is the DoorDash-style reliability follow-up and
  the Mercor failure-mode follow-up.
- End-to-end versus hop-by-hop dedup is rarely drawn. Deduping at the queue and not at the
  payment provider still double-charges if the worker retries the provider with a new key.
references:
- title: Stripe, idempotent requests
  url: https://docs.stripe.com/api/idempotent_requests
- title: AWS, making retries safe with SQS
  url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-at-least-once-delivery.html
quiz:
- kind: mc
  question: Two requests with the same idempotency key arrive together. What must be true?
  choices:
  - Both execute the charge. The second one refunds.
  - One wins the insert of the key. The other waits and returns the stored result.
  - The load balancer drops one.
  - Redis pub/sub orders them.
  answer: 1
  explain: Uniqueness has to be atomic with the effect. A check-then-act in the app loses
    the race.
- kind: mc
  question: Which status should you retry?
  choices:
  - 400 Bad Request.
  - 422 Unprocessable.
  - 503, and 429 after the Retry-After delay.
  - A validation error the user must fix.
  answer: 2
  explain: Retry the transient failures. Retrying a 400 repeats a request the server has already
    refused.
- kind: short
  question: How long do you keep an idempotency record?
  reveal: Longer than the client is willing to retry, and longer than the upstream's ambiguity
    window. Twenty-four hours is a common product default for payments. Too short and a late
    retry double-applies. Too long is just storage, which is the cheaper bug.
title: Idempotency and retries
description: How to make a second delivery of the same request harmless, which is the only
  way retries are safe.
track: system-design
section: Core concepts
order: 140
---

A retry is a guess. The first attempt may have succeeded and the response got lost. If the operation is not idempotent, the retry is a second operation. Design the key before you design the retry loop.

## The record

The client generates a unique key for the logical action (one checkout, one refund, one message send) and sends that same key on every retry. The server stores:

- the key, scoped to the caller so two customers cannot collide,
- a hash of the request, so the same key with a different body is a 409 rather than a silent replay of the wrong charge,
- the response, once you know it.

The insert of that row and the side effect commit together, or the side effect is conditional on a unique constraint (`ON CONFLICT DO NOTHING`, then read the winner). A `SELECT` followed later by an `INSERT` is a race you will lose under double-click.

If the first attempt is still in progress, the second should wait or receive a 409, not start a second charge. Store an `in_progress` state with a lease so a crashed attempt can be resumed.

## Where dedup has to live

Dedup at every boundary that can retry independently. The queue consumer dedups so a redelivery does not double-apply. The call to the payment provider uses a key the provider understands, stable across your retries. Deduping only in your API and then calling the provider with a fresh UUID moves the bug one box to the right.

## Retry policy

Retry when the failure might vanish: a timeout, a connection reset, 429, 502, 503, 504. Do not retry 400, 401, 403, 404 (unless you have defined 404 as "not ready"), or 422. Back off exponentially, add jitter so you do not reconverge, and cap the attempts. A circuit breaker stops you from hammering a dependency that is clearly down; queue the work or fail the user with a clear error.

Timeouts are not proof of failure. They are proof you stopped waiting. That is why the key exists.

```sql
INSERT INTO idempotency_keys (owner_id, key, request_hash, state)
VALUES (:owner, :key, :hash, 'in_progress')
ON CONFLICT (owner_id, key) DO NOTHING;
```

The same rule in memory, which is what you write when the interview asks for the race without a database. The SQL above is still the durable version.

```cpp
#include <cassert>
#include <iostream>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>
#include <utility>

// In-memory stand-in for the idempotency row. The real system does this insert
// in the same transaction as the side effect. Same key + same body replays.
// Same key + different body is a conflict. A second caller waits on in_progress.
enum class IdemState { InProgress, Done };

struct IdemRecord {
  std::string request_hash;
  IdemState state = IdemState::InProgress;
  int response = 0;
};

enum class BeginResult { Started, Replay, Conflict, Busy };

class IdempotencyStore {
 public:
  BeginResult begin(const std::string& owner, const std::string& key, const std::string& request_hash) {
    std::lock_guard lock(mu_);
    auto& slot = rows_[owner + "\n" + key];
    if (!slot) {
      slot = IdemRecord{request_hash, IdemState::InProgress, 0};
      return BeginResult::Started;
    }
    if (slot->request_hash != request_hash) return BeginResult::Conflict;
    if (slot->state == IdemState::InProgress) return BeginResult::Busy;
    return BeginResult::Replay;
  }

  void finish(const std::string& owner, const std::string& key, int response) {
    std::lock_guard lock(mu_);
    auto it = rows_.find(owner + "\n" + key);
    if (it == rows_.end() || !it->second) return;
    it->second->state = IdemState::Done;
    it->second->response = response;
  }

  std::optional<int> response(const std::string& owner, const std::string& key) const {
    std::lock_guard lock(mu_);
    auto it = rows_.find(owner + "\n" + key);
    if (it == rows_.end() || !it->second || it->second->state != IdemState::Done) return std::nullopt;
    return it->second->response;
  }

 private:
  mutable std::mutex mu_;
  std::unordered_map<std::string, std::optional<IdemRecord>> rows_;
};

int main() {
  IdempotencyStore store;
  assert(store.begin("u", "k", "hash-a") == BeginResult::Started);
  assert(store.begin("u", "k", "hash-a") == BeginResult::Busy);
  assert(store.begin("u", "k", "hash-b") == BeginResult::Conflict);
  store.finish("u", "k", 201);
  assert(store.begin("u", "k", "hash-a") == BeginResult::Replay);
  assert(store.response("u", "k") == 201);
  std::cout << "idempotency store ok\n";
  return 0;
}
```

