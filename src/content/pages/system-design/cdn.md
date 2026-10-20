---
failureModes:
- A cache key that ignores a cookie, so one user sees another's personalized page.
- Caching a 302 or an authenticated JSON response at the edge.
- No invalidation story, so a takedown or an updated thumbnail lives for the whole TTL.
- Origin stampedes when a viral object expires on every edge at once.
sayThis:
- Images and video segments are cached at the edge, keyed by the URL. The URL includes a version
  or a content hash so I never have to purge the world.
- HTML for a logged-in user is not cached in a shared CDN cache. Anonymous, identical responses
  can be.
- I set a long TTL on immutable assets and a short one, or no cache, on APIs that depend on
  the caller.
gaps:
- CDNs show up as a box and as a paragraph inside caching. Cache-key design, authenticated
  responses, and shield tiers (an origin shield so 200 edges do not all miss at once) are
  usually missing.
- Range requests for video and signed URLs for private objects are the actual YouTube and
  Dropbox follow-ups, and they are not on the free CDN blurb.
- Invalidation is described as 'purge.' Versioned URLs make purge the exception for abuse
  and legal takedowns, not the steady-state plan.
references:
- title: Hello Interview, public caching (CDN section)
  url: https://www.hellointerview.com/learn/system-design/core-concepts/caching
- title: MDN, HTTP caching
  url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
quiz:
- kind: mc
  question: Which response is safe on a shared CDN cache?
  choices:
  - GET /feed for a logged-in user.
  - 'A versioned thumbnail at /img/abc123.jpg with Cache-Control: public, max-age=31536000.'
  - A Set-Cookie login response.
  - GET /account with the user's email.
  answer: 1
  explain: Immutable public bytes are the CDN's job. Anything that varies by user must vary
    the cache key or skip the shared cache.
- kind: mc
  question: 'An origin shield helps because:'
  choices:
  - It encrypts the object twice.
  - Edge misses go to one intermediate cache instead of all stampeding the origin.
  - It replaces the database.
  - It makes private data public.
  answer: 1
  explain: A popular object expiring on every PoP at once is a self-inflicted denial of service.
    A shield collapses those misses.
- kind: short
  question: How do you cache private downloads?
  reveal: Do not put them in a shared public cache. Issue a short-lived signed URL (CDN or
    object storage) after your API checks authorization. The URL is the capability. The bytes
    can still be cached at the edge under that signature if the CDN supports it, and the signature
    expires.
title: CDNs
description: 'Edge caches for bytes and HTTP responses: cache keys, invalidation, and what
  must never be cached.'
track: system-design
section: Key technologies
order: 260
---

A CDN places caches in many cities so a user's packets stop close to home. The first request for an object (a miss) fetches from your origin and stores the response. Later requests in that city are hits. The win is latency and origin load. The risk is serving the wrong bytes to the wrong person, for too long.

## What belongs there

Versioned static assets, images, and video segments. Give the object a URL that changes when the bytes change, and a long `Cache-Control: public, max-age=...`. You then almost never purge. Purges are for takedowns, security mistakes, and the rare mutable URL you could not avoid.

Anonymous identical pages (a marketing page, a public video watch page's shell) can be cached if the cache key includes everything that changes the body: path, relevant query parameters, and sometimes `Accept-Encoding` or language. Do not include a random cookie or the key will never hit.

## What does not

Personalized JSON, account pages, and anything with a `Set-Cookie` that is specific to a user. `Cache-Control: private` keeps it in the browser and out of the shared edge. APIs that authorize per caller should generally bypass the CDN cache or vary on an authorization header you have thought about carefully. Varying on the full bearer token is a per-user cache with extra steps and a leak risk if you get the vary wrong.

## Video and large files

Clients request byte ranges. The CDN and the origin must both honor `Range`. Segmented playlists (HLS or DASH) make each segment an independent cacheable object. That is the usual answer for YouTube-shaped designs, and it is covered on that problem page.

## Miss behavior

A hot object that expires everywhere becomes a burst of origin requests. Jitter TTLs, use an origin shield, or serve stale while one request refreshes. The same stampede you can describe for Redis applies at the edge, with more zeros.
