---
failureModes:
- A gateway that calls the database itself and becomes a second, unowned backend.
- Health checks so shallow that a wedged process stays in rotation, or so deep that a dependency
  blip removes the whole fleet.
- No drain period, so a deploy kills in-flight requests.
- Auth logic copied into every service and drifting, or auth logic only at the gateway and
  never repeated on an internal path someone calls directly.
sayThis:
- The load balancer spreads connections and stops sending traffic to dead targets. The gateway
  authenticates, limits, and routes. The service authorizes the object.
- I will drain a target for the length of my longest request before I kill it.
- Internal traffic still checks a service identity. The gateway is not the only place a request
  can come from.
gaps:
- The public map lists both boxes, and there is a free API-gateway deep dive. Load balancers
  are mostly inside the networking page. Candidates conflate them and then put business logic
  in whichever one they drew first.
- Deploy mechanics (draining, slow start, sticky sessions for websockets) are follow-ups the
  free pages mention lightly.
- mTLS or a signed internal header between gateway and service is how you stop anyone who
  can reach the cluster from skipping auth. It is rarely drawn.
references:
- title: Hello Interview, public API gateway deep dive
  url: https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway
- title: Hello Interview, public networking essentials
  url: https://www.hellointerview.com/learn/system-design/core-concepts/networking-essentials
quiz:
- kind: mc
  question: Which task belongs on an API gateway rather than in a random service?
  choices:
  - Deciding whether this user owns this invoice.
  - Authenticating the token, enforcing a coarse rate limit, and routing /v1/orders to the
    order service.
  - Computing a leaderboard.
  - Claiming a queue row.
  answer: 1
  explain: Cross-cutting edge concerns belong at the gateway. Object authorization belongs
    with the data.
- kind: mc
  question: During a deploy, in-flight requests get reset. What did you skip?
  choices:
  - A CDN.
  - 'Connection draining: stop assigning new work, wait, then stop the process.'
  - Consistent hashing.
  - A larger instance type.
  answer: 1
  explain: The balancer must know the target is going away and must be given time to finish
    or to retry idempotent calls.
- kind: short
  question: L4 versus L7 in one sentence each.
  reveal: L4 balances TCP connections without reading HTTP. L7 can route on host, path, and
    header, and can terminate TLS. Use L7 at the edge of an HTTP API. Use L4 when you need
    to pass through a protocol it should not parse, or when the cost of parsing dominates.
title: API gateways and load balancers
description: What to terminate at the edge, what a gateway is allowed to do, and how health
  checks and deploys interact.
track: system-design
section: Key technologies
order: 270
---

These two boxes sit in front of your services and people mix them up. Split them by what they are allowed to understand.

A **load balancer** has a list of targets and a health check. It sends new connections to targets that are healthy, using round-robin, least-connections, or a hash of the client. Layer 4 does this on TCP. Layer 7 terminates TLS and can route `api.example.com/v1/search` to a different fleet from `/v1/upload`. It does not know what an order is.

An **API gateway** is an L7 edge with opinions: it checks the token, applies rate limits, requests a size cap, rewrites a path, and emits a standard error. It might fan in several public APIs. It should not contain product rules and it should not be the only copy of authorization. Services still check that this caller can touch this id, because internal callers exist.

## Health and deploys

A health check that always returns 200 is decoration. A health check that requires every dependency including the data warehouse will drain the fleet during a partial outage and turn a brownout into a blackout. Check that the process can serve the request it is about to receive: thread pool not exhausted, local cache loaded, primary database reachable for a write tier.

On deploy, mark the target draining, wait out the p99 of in-flight work (and the websocket you decided was sticky to that process), then stop it. New tasks start receiving traffic only after they pass a readiness check, ideally with a slow start so a cold cache does not take a full share immediately.

## Stickiness and streams

WebSockets and long polls want either a shared pub/sub (any node can finish the delivery) or stickiness. Stickiness fails when that node dies, so the client must reconnect and resume from a cursor anyway. Design the resume path. Do not design a world where one process is precious.

## Internal calls

Once traffic is inside the mesh, a header the gateway set ("this user id") is only as trustworthy as the network. Sign it or use mTLS so a random pod cannot invent a user. Timeouts and retries at this layer follow the idempotency rules: retry GETs, retry POSTs only with a key, and keep a budget so five services do not multiply a single user click into a retry storm.
