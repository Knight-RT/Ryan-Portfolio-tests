# Ryan Portfolio independent acceptance tests

This repository tests the published browser interface against SPEC.md. It does not contain or inspect portfolio implementation code. Every test references one requirement, R1 through R9. GitHub API responses are intercepted with deterministic populated, empty, and failure fixtures; no GitHub credentials are required.

Use Node.js 22 and install dependencies and Chromium:

```sh
npm ci
npx playwright install chromium
```

Start the portfolio separately. In PowerShell:

```powershell
$env:BASE_URL = 'http://127.0.0.1:8000'
npm test
npm run report
```

To keep downloaded browsers inside this repository, set `$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.cache\ms-playwright"` before both installation and testing. The local lab verification used this isolated cache. Type-check the suite with `npx tsc`.

BASE_URL is mandatory, with no live-site default. R3 defaults to ryan.tan.0310@gmail.com and https://www.linkedin.com/in/ryan-tan0310/. CONTACT_EMAIL and LINKEDIN_URL may override those expected values. Explicitly empty values select pending mode, requiring visible pending messages and no email or LinkedIn links. Both contact values must be configured before deployment; pending-mode acceptance is for the lab draft and is not deployment approval.

The suite uses Chromium only, isolated contexts, and retained traces on failures. R4 locates cards by repository URL and validates their displayed fields without prescribing a card element type. Null fields must avoid displaying literal null or undefined; no particular fallback wording is required. R5 and R6 allow several clear English empty/error messages. A manually triggered workflow can test a supplied reachable URL; it never runs against a default live portfolio.

