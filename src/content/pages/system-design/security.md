---
failureModes:
- 'Broken object-level authorization: the id in the URL is the only check, so anyone can read
  anyone else''s invoice.'
- A prompt or a document that is treated as instructions, so uploaded text can redirect a
  tool or a grade.
- Secrets in the repo, the image, or the logs.
- 'Unbounded input: a 2 GB ''resume'' or a zip bomb that exhausts a parser on the request
  thread.'
sayThis:
- Authentication tells me who they are. Authorization checks this principal can act on this
  object. I will check it on every read and write, not only at login.
- I treat model output and uploaded documents as data, not as instructions, and I do not let
  a model call a privileged tool without a policy check.
- PII has a retention limit and an access log. I can tell you who read a resume.
gaps:
- Security is a bullet in the public requirements checklist and not a free page. Candidates
  either ignore it or recite 'we will use HTTPS' and stop.
- Object-level authorization and multi-tenant isolation are the bugs that actually ship. Transport
  encryption is assumed, not the deep dive.
- Prompt injection and tool-use policy are absent from classic guides. If the system calls
  a model, they are in scope, and this page puts them next to SQL injection so the pattern
  is obvious.
references:
- title: OWASP API Security Top 10
  url: https://owasp.org/API-Security/
- title: OWASP Top 10
  url: https://owasp.org/www-project-top-ten/
quiz:
- kind: mc
  question: A request GET /invoices/123 succeeds for a logged-in user who does not own invoice
    123. What failed?
  choices:
  - TLS.
  - Object-level authorization.
  - Rate limiting.
  - The CAP theorem.
  answer: 1
  explain: The session is valid and the object exists. The missing check is 'does this principal
    own this id?'
- kind: mc
  question: Where should a database password live?
  choices:
  - In the git repo, so deploys are reproducible.
  - In a secret store, injected at runtime, never logged.
  - In the mobile app, so it can query directly.
  - In a public environment variable on the status page.
  answer: 1
  explain: Code is widely copied. Secrets are fetched at runtime, scoped, and rotatable.
- kind: short
  question: What is prompt injection, analogously?
  reveal: 'The same bug as SQL injection: untrusted text (a resume, a chat turn, a web page)
    is concatenated into a prompt that the model treats as instructions. Separate the instruction
    channel from the data channel, constrain tool calls with an allow-list, and do not let
    the model directly perform a privileged action.'
title: Security basics
description: 'The security sentences a system design needs: identity, authorization, secrets,
  injection, and abuse.'
track: system-design
section: Core concepts
order: 180
---

Most design interviews do not want a threat-model workshop. They do want to hear that you noticed who is allowed to do what, and what happens when the input is hostile. Five sentences cover the usual probe.

## Identity and authorization

Authenticate at the edge (session cookie or a short-lived token). Authorize in the service that owns the object, every time: this user, this invoice, this action. The vulnerable pattern is "they are logged in, and they named an id." Admin paths are a separate role, not a hidden URL.

Multi-tenant systems (a lab, a merchant, a company) should carry the tenant in the token and in the query. A missing tenant predicate is a data leak, not a performance bug. If you shard by tenant, isolation gets easier. If you do not, tests have to prove a query cannot cross tenants.

## Data

TLS everywhere outside a tightly controlled mesh. Encrypt sensitive columns or disks if the data is regulated, and do not invent your own cipher. Secrets come from a secret manager, rotate, and never land in logs or images.

Collect less. Resumes, recordings, and payment data need a retention clock and an access log. "We keep everything forever in the data lake" is a privacy incident with a delay.

## Input

Validate size, type, and schema at the edge. Parse documents asynchronously so a malicious file spends a worker's time, not your web server's. Parameterize SQL. Escape output. Treat anything a user uploaded, including text that will be shown to a model, as data.

If a model can call tools, the tool layer enforces policy. The model does not get a raw shell, a raw SQL connection, or the ability to email an arbitrary address because a PDF said "ignore previous instructions."

## Abuse

Rate-limit authentication and expensive endpoints. Use unguessable ids so a crawler cannot walk `/users/1` through `/users/1000000`. Record audit events for money movement, permission changes, and data export. Assume a script will find any endpoint you ship.

Say these in proportion to the product. A URL shortener needs abuse and auth. A payments or hiring system needs all of the above, and you should bring it up before you are asked.
