# RaceHub Firebase client

This legacy client has no payment or subscription check. It uses the reviewed `old-racehub-client-firebase` source through a local package dependency.

## Setup

The `functions` package uses Node.js 22 and the Firebase v1 callable API.
Run `npm ci --ignore-scripts` in `functions` before deployment.
The local HTTPS server binds to IPv4 loopback. Browser API calls must use the same local origin.

- Place both repositories beside each other.
- Run `npm install` in `old-racehub-client-firebase` first. Then run `npm install` in this repository.
- Create your own Firebase project with Authentication, Firestore, Storage, and Cloud Functions.
- Save that project's client configuration in local `config/firebase-config.json`. This file is ignored by Git.
- Deploy this repository's `customToken` function and security rules to that project. Its deployment identity must be able to sign Firebase custom tokens.

The browser requests a custom token after Firebase sign-in. The native process receives only that token. The server mints a token only for the verified caller. No RaceHub subscription is required. The instance operator supplies the cloud infrastructure. Cloud usage can have costs.

This is a legacy source release. Its recorder start code is incomplete. Its Electron and native dependencies need a separate platform compatibility check. No complete app or live Firebase integration test ran for this release.

## Community

See [LICENSING.md](LICENSING.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [SECURITY.md](SECURITY.md). RaceHub-owned source uses CC0. Third-party terms remain in force. The operator supplies any optional cloud infrastructure.
