# Governance

## Maintainer

`@yasvanth511` is the repository owner and final maintainer for Global Events.

The maintainer is responsible for:

- Reviewing and merging pull requests.
- Managing releases and deployments.
- Responding to security reports.
- Maintaining repository access and protection settings.
- Deciding project scope and resolving disputes.

## Change Control

- Changes to `main` must arrive through pull requests.
- Required automated checks must pass before merge.
- Force pushes and branch deletion are prohibited on `main`.
- Security, workflow, ownership, and governance changes require explicit
  maintainer review.
- Destructive changes must be isolated, justified, and recoverable.

## Repository Preservation

This repository must not be deleted as routine maintenance.

If development stops:

1. Mark the project as unmaintained in the README.
2. Disable deployments and rotate or remove deployment secrets.
3. Create and verify an external mirror or archive.
4. Archive the GitHub repository instead of deleting it.

If ownership changes, verify the backup and branch protections before the
transfer.

GitHub branch rules protect branches and history inside the repository, but
they cannot prevent the personal account owner from deleting the repository.
Account security and an external backup are therefore required preservation
controls.
