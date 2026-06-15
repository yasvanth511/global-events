# Repository Protection Controls

## GitHub Controls

The repository should keep these settings enabled:

- Protected default branch with no force pushes or deletion.
- Pull requests required for changes to `main`.
- Required CI status checks and resolved review conversations.
- Secret scanning and push protection.
- Dependabot alerts and security updates.
- Private vulnerability reporting.
- Read-only default GitHub Actions token permissions.
- GitHub Actions pinned to full commit SHAs.

## Account Controls

The repository owner should:

- Enable two-factor authentication and keep recovery codes offline.
- Add a passkey or hardware security key.
- Review active sessions, personal access tokens, OAuth applications, and
  deploy keys regularly.
- Give collaborators the least repository permission they need.
- Keep deployment and hosting accounts protected separately.

## Backup Controls

Branch protection does not survive deletion of the repository. Maintain at
least one external backup outside this GitHub repository.

Example mirror backup:

```bash
git clone --mirror https://github.com/yasvanth511/global-events.git
git -C global-events.git bundle create ../global-events-backup.bundle --all
git bundle verify global-events-backup.bundle
```

Store the verified bundle in a separate account, storage provider, or offline
location. A branch, release, artifact, or workflow backup inside this same
repository is not sufficient because it would be deleted with the repository.

Review the backup after important releases and before ownership or repository
administration changes.
