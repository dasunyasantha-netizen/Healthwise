# HealthWise launcher integration

HealthWise implements the canonical Pickiti/SysWise return-navigation contract in
`src/services/launchSource.ts`; `src/App.tsx` and `src/components/Header.tsx` consume it.

The authoritative checklist for changes and new apps is:
[`docs/pickiti/new-app-integration.md`](https://github.com/dasunyasantha-netizen/Syswise/blob/main/docs/pickiti/new-app-integration.md).

Do not replace the resolver with a hard-coded `/`, `/apps` or `/pickiti` link.
