# Rule: Code Quality

## Absolute Rules — Never Violate

- NEVER write `any` in TypeScript. Use `unknown` with type guards, or define the proper type.
- NEVER leave `TODO`, `FIXME`, `HACK`, or `XXX` comments in code you generate unless explicitly asked to stub something.
- NEVER use `console.log` in production code paths. Use the workspace `logger` utility (`packages/utils/src/logger.ts`).
- NEVER write synchronous file I/O in the main process or renderer. Always use async I/O.
- NEVER import from a sibling package's `src/` directly. Always use the package's public export from `package.json#exports`.
- NEVER use `var`. Use `const` by default, `let` only when mutation is required.
- NEVER use `==`. Always use `===`.
- NEVER mutate function arguments or external state without explicit documentation of the side effect.
- NEVER write a function longer than 60 lines. Extract into named helpers with clear responsibilities.
- NEVER write a file longer than 400 lines. If you reach 300 lines, plan a split before continuing.
