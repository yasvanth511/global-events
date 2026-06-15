# Contributing

Thanks for helping improve Global Events.

## Development

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

## Change Process

1. Create a branch from the latest `main`.
2. Keep the change focused.
3. Add or update tests for changed behavior.
4. Update documentation when setup or behavior changes.
5. Open a pull request and complete the template.
6. Wait for required checks before merge.

Do not push directly to `main`.

## Destructive Changes

Changes that delete code, data, workflows, history, or repository controls
require special care:

- Explain exactly what will be removed and why.
- Separate deletion from unrelated feature work.
- Confirm that no supported behavior or required history is lost.
- Include a rollback or recovery plan.
- Never use force pushes, history rewrites, or destructive Git commands on
  shared branches.

Repository deletion is not an acceptable maintenance action. Archive the
repository instead, and create a verified external backup before any ownership
transfer or other high-risk administrative change.

## Security and Privacy

- Report vulnerabilities privately according to `SECURITY.md`.
- Do not commit credentials, private data, generated uploads, or local
  configuration.
- Use synthetic or public sample data in tests.

## Commit and Review Quality

- Use clear commit messages.
- Review the full diff before pushing.
- Avoid unrelated formatting or generated-file churn.
- Keep external dependencies necessary and well maintained.
