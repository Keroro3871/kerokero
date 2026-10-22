# Project Guidelines

## Architecture

This repository currently consists of a standalone JavaScript helper in [Test.js](../Test.js). `getMax` is a pure function that returns the larger of two inputs; there are no application layers, framework, or dependencies to account for.

## Build and Test

There is no package manifest, build script, lint command, or configured test runner. Check JavaScript syntax with `node --check Test.js`. No automated tests or single-test command are defined.

## Conventions

- Keep simple logic as plain JavaScript functions; follow the existing function declaration and explicit conditional-return style in `Test.js`.
- Preserve the helper's behavior for equal inputs: it returns the second argument.
- Existing explanatory comments are written in Korean.
