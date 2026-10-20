---
failureModes:
- Reading every page and never drawing a design against a clock.
- Treating a memorized diagram as the answer when the interviewer changes a requirement.
- Skipping the company track until the night before.
sayThis:
- I'll spend the first few minutes on requirements and the contract, then draw a design that
  meets them, and use the rest of the time on the bottleneck you care about.
- I don't have a single correct architecture. I have a simple one I can defend, and I can
  say what I would change if the scale or the consistency requirement moved.
gaps:
- The public introduction explains what design interviews assess, then points at a long course.
  It does not give a 45-minute clock, and it does not connect the rubric to a specific onsite.
- Quizzes and progress on the public guide are part of their product. Here every quiz is unlocked
  and scores stay on this machine.
- AI systems (inference serving, RAG, agent eval, expert routing) are not in the free problem
  list. They are first-class worked problems in this track because that is the work you actually
  do.
references:
- title: Hello Interview, public introduction
  url: https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction
- title: Hello Interview, public delivery framework
  url: https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery
quiz:
- kind: mc
  question: What should you do when system design is new and the interview is soon?
  choices:
  - Read every technology page, then hope a problem comes up that matches.
  - Learn the delivery clock, then practice full problems out loud on a timer.
  - Skip requirements and start drawing boxes so you look fast.
  - Only drill the company whose interview is first, and ignore fundamentals.
  answer: 1
  explain: Structure plus timed practice beats coverage. The company tab tells you which problems
    to repeat.
- kind: mc
  question: Where do quiz scores and completion marks live?
  choices:
  - In a hosted account tied to this repo.
  - In localStorage in this browser.
  - In git, committed with the page.
  - They reset on every navigation.
  answer: 1
  explain: Nothing is uploaded. Clearing site data clears progress.
- kind: short
  question: Name the five beats of a design answer, in order.
  reveal: Requirements, core entities, API, high-level design (after a short data-flow when
    the system is a pipeline), then deep dives. On a 45-minute loop the first four should
    be done by about minute 25.
title: How to use these notes
description: What these notes are, how the tracks fit together, and how I practice with them.
track: system-design
section: Start here
order: 10
---

These are my own interview-prep notes, not a course. The system-design track is the main part. The company tabs are prep plans for specific loops (Mercor, DoorDash). Low-level design and DSA are smaller and still growing.

## What a design interview is actually grading

You are given a fuzzy product and about 45 minutes. The interviewer is not waiting for a secret diagram. They are watching whether you can narrow the problem, propose a design that meets the contract you just wrote, and then go deep on the part that is actually hard. Four habits show up on almost every rubric, whatever the company calls them:

- **Navigation.** You pick the three features that matter and you do not drown in the rest.
- **Design.** The pieces fit. A request can be walked from the client to storage and back.
- **Technology judgment.** You name a real datastore, a real index, and the cost of that choice.
- **Collaboration.** You take a hint, you draw without being asked, and you state what breaks.

Mid-level candidates are expected to finish a coherent design. Senior candidates should get there quickly enough to spend the second half on one hard problem: ranking, hot keys, exactly-once side effects, or model cost. Staff conversations add scope, migration, and organizational constraints. You do not need a different framework for each level. You need the same framework, run faster, with a deeper second half.

## How the track is organized

Read **Delivery** until the clock is automatic. Then skim a core concept only when a problem forces it. Technologies are reference pages: Postgres, Redis, Kafka, and the rest, written so you can defend a choice in two minutes. Patterns are the moves you reuse (fan-out, sagas, claim-with-lease). Worked problems are the reps.

Each page ends with a few callouts and a quiz. The failure-mode callout is the list you should be able to recite. "Say this" is phrasing, not a script to memorize word for word. "Gaps" is what the free public guides tend to skip. Quizzes are all unlocked. Multiple choice is scored in this browser. Short answers reveal when you click.

## A study loop that fits a job and a semester

One hour is enough if it is deliberate.

1. Pick one problem. Set a timer for 25 minutes. Talk out loud. Draw on paper or Excalidraw. Stop when the timer ends, even if the design is incomplete.
2. Spend 15 minutes comparing your drawing to the worked problem. Write down the one gap, not ten.
3. Spend 10 minutes on the concept page that gap points at. Do the quiz.

Do not highlight. Do not watch a second explanation of the same diagram. The failure mode of interview prep is consuming material you cannot reproduce.

Before a company loop, open that company's tab and do the rounds in order, including the stories. Do not invent a metric in the room.

## What this site will not do

No login, nothing sent anywhere. Progress is localStorage. Search is an index built with the static site. A new page is a markdown file, and a new track is one more entry in `src/content/tracks.json`.
