# Security Policy

## Supported Version

Security fixes are applied to the current `main` branch. Older commits and
unmaintained forks are not supported.

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting:

<https://github.com/yasvanth511/global-events/security/advisories/new>

Include:

- A clear description of the issue and its impact.
- Reproduction steps or a minimal proof of concept.
- Affected routes, files, versions, or commits.
- Any suggested mitigation.

Do not include real credentials, private event data, or personal information in
the report.

The maintainer will acknowledge a valid report as soon as practical, assess
severity, prepare a fix, and coordinate disclosure when appropriate. Public
details should wait until a fix or mitigation is available.

## Security Expectations

- Never commit secrets, API keys, tokens, passwords, or `.env` files.
- Treat uploaded spreadsheets as untrusted input.
- Validate workbook type, size, headers, and required values.
- Read spreadsheet values only; never execute formulas or render raw HTML.
- Keep dependencies updated through reviewed pull requests.
- Use least-privilege permissions in GitHub Actions and deployment systems.
