# CI Failure Diagnosis

This document records the failures observed in the GitHub Actions pipeline and explains the cause of each issue.

---

## Failure 1: Dependency Installation Configuration

### Step Name

Install dependencies

### Error Evidence

The workflow used:

```bash
npm install
```

### Cause

The install job used `npm install` instead of `npm ci`. Using `npm install` can produce non-reproducible installations because dependency versions may differ from those recorded in the lockfile.

### Impact

CI builds may behave differently from local development environments, causing inconsistent results and difficult debugging.

### Fix Applied

Replaced:

```bash
npm install
```

with:

```bash
npm ci
```

to ensure deterministic and reproducible dependency installation.

---

## Failure 2: Incorrect Workflow Sequencing

### Step Name

Run tests

### Error Evidence

The test job did not contain a `needs: install` declaration.

### Cause

The test job was running in parallel with the install job instead of waiting for dependency installation to finish.

### Impact

Tests could begin before dependencies were available, causing pipeline failures.

### Fix Applied

Added:

```yaml
needs: install
```

to the test job so that tests only run after the install job completes successfully.

---

## Failure 3: Missing Repository Checkout and Dependency Installation in Test Job

### Step Name

Run tests

### Error Evidence

The test job contained only:

```bash
npm test
```

without any repository checkout or dependency installation steps.

### Cause

Each GitHub Actions job runs on a fresh virtual machine. Since the test job did not perform checkout or install dependencies, required files and packages were unavailable.

### Impact

The test stage failed because node modules and source files were missing.

### Fix Applied

Added the following steps to the test job:

```yaml
- uses: actions/checkout@v4

- uses: actions/setup-node@v4
  with:
    node-version: '18'

- name: Install dependencies
  run: npm ci
```

---

## Failure 4: Incorrect Assertion in calculateDiscount.test.js

### Step Name

Run tests

### Error Message

The test expected a value of 100 after applying a 10% discount.

Original assertion:

```javascript
expect(calculateDiscount(100, 10)).toBe(100);
```

### Cause

The function implementation was correct, but the test expectation was wrong. Applying a 10% discount to 100 should produce 90.

### Impact

The unit test failed even though the application logic was working correctly.

### Fix Applied

Updated the assertion to:

```javascript
expect(calculateDiscount(100, 10)).toBe(90);
```

and added a comment explaining the change.

---

## Failure 5: Incorrect Matcher Used in formatCurrency.test.js

### Step Name

Run tests

### Error Message

```text
expect(received).toBe(expected) // Object.is equality

If it should pass with deep equality, replace "toBe" with "toStrictEqual"

Expected: {"amount": 10.01, "currency": "USD"}
Received: serializes to the same string
```

### Cause

The test used `toBe()` to compare objects. The `toBe()` matcher checks object references instead of object contents.

Original assertion:

```javascript
expect(formatCurrency(10.005, 'USD')).toBe({
  amount: 10.01,
  currency: 'USD'
});
```

### Impact

The test failed even though the returned object contained the correct values.

### Fix Applied

Replaced `toBe()` with `toEqual()`:

```javascript
expect(formatCurrency(10.005, 'USD')).toEqual({
  amount: 10.01,
  currency: 'USD'
});
```

and added a comment explaining why deep equality was required.

---

# Summary

The CI pipeline failures were caused by:

1. Non-reproducible dependency installation using `npm install`.
2. Missing sequencing between install and test jobs.
3. Missing checkout and dependency installation in the test job.
4. Incorrect expected value in `calculateDiscount.test.js`.
5. Incorrect matcher (`toBe`) used for object comparison in `formatCurrency.test.js`.

After applying the fixes, all test suites passed successfully and the CI pipeline was restored to a healthy state.
