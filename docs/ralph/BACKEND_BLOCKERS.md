# StockPulse Backend Blockers

## Purpose

This document contains ONLY issues that cannot currently be completed
because of an external dependency or environment limitation.

A code defect is NOT a blocker.

A missing implementation is NOT a blocker.

A failing test is NOT a blocker.

Those must be fixed.

---

# Blocker Rules

When blocked:

DO NOT:

- add mock implementation
- add fallback
- fake provider response
- mark feature REAL_WORKING
- skip the feature silently

Instead:

1. document the blocker
2. document the exact required action
3. continue with independent tasks

---

# Active Blockers

None.

---

# Blocker Template

## BLOCKED-XXX

### Feature

<feature>

### Priority

<P0/P1/P2/P3>

### Status

BLOCKED

### Exact Blocker

<exact reason>

### Why Code Cannot Resolve It

<explanation>

### Required External Action

<required action>

### Environment / Configuration

<required environment>

### Current Implementation

<what already exists>

### What Has Been Verified

<evidence>

### What Remains

<remaining work>

### Temporary Handling

NONE

No mock or fallback is permitted.

---

# Resolved Blockers

None.

When resolved, move the blocker here and document:

- resolution
- date
- verification
- commit