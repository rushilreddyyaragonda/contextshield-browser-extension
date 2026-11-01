# ContextShield Browser Extension

Privacy-oriented browser extension prototype for inspecting and controlling the context exposed by browser workflows.

## Analysis

- **Core experience:** a React control surface plus a standalone extension workspace, popup, and options pages.
- **Technical approach:** React + TypeScript + Vite for the product UI, with a Manifest-based extension surface and lightweight analysis utilities.
- **Portfolio value:** shows browser-platform thinking, privacy-by-design, and the translation of a security concern into usable controls.
- **Packaging:** the extension source is tracked; generated ZIP bundles are ignored so releases can be rebuilt reproducibly.
- **Current health:** production build and TypeScript check pass. ESLint passes.

## Run locally

```bash
npm install
npm run dev
```

For the extension workspace, see [`extension/README.md`](extension/README.md).
