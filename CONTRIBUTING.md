# Contributing to Safeword

Thank you for helping make Alexa+ safer for vulnerable users.

## Quick start

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature-name`.
3. Make a focused change.
4. Run `npm run typecheck`, `npm run build`, and `npm run evaluate`.
5. Open a pull request explaining what changed and why.

## Good first contributions

- Add labeled scam examples to `data/test-scams.json`.
- Improve a tool fallback without exposing sensitive data.
- Add Telugu, Hindi, or Tamil copy and test cases.
- Improve the simulated Alexa+ experience or accessibility.
- Correct or expand the documentation.

## Code rules

- Use strict TypeScript and keep the existing package structure.
- Every MCP tool returns JSON in `content[0].text`.
- Every AWS call has a graceful `try/catch` fallback.
- Never log phone numbers, safe-word answers, credentials, or raw transcripts.
- Keep the full safe-word answer out of storage and source control.

## Pull request checklist

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `npm run evaluate` passes.
- [ ] New tool types and schemas are documented.
- [ ] The friction log is updated when developer experience reveals a real issue.
