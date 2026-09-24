---
type: decision
status: accepted
date: 2026-09-23
tags: [product]
project: slots-lite
---

# 006 — results are data: an illustration, never a game

## Context

A slot machine is a gambling device. A library that draws one for hero art could drift into
behaving like one — a win evaluator, a pay table, reel weights called odds, a spin that decides.

## Decision

The library draws; it does not play. There is no evaluator, no payout, no odds, no state. A result
(`jackpot`, `three`, `bars`, `cherries`, `mixed`) is a name that **constructs** the payline cells,
correct by construction. The reel weight table exists only so that a random machine does not look
like a jackpot every third seed, and it is called a weight, not a probability. Tests check results
against a checker written longhand in the test file (cards-lite's M4 method), so the library never
needs one.

## Consequences

- A request for "the win amount", "RTP" or "a clickable spin that decides" is out of scope by this
  ADR, not by oversight.
