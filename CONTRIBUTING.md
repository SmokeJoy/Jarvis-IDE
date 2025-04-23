# Contributing to Jarvis IDE

Thank you for your interest in contributing to Jarvis IDE! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)).

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/jarvis-ide.git
cd jarvis-ide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Make your changes and ensure they follow our coding standards:
   ```bash
npm run lint
npm run format
npm run test
   ```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation in the `docs/` directory
3. Add tests for any new functionality
4. Ensure all tests pass and there are no linting errors
5. Submit a pull request with a clear description of the changes

## Coding Standards

- Follow the TypeScript style guide
- Write meaningful commit messages
- Add JSDoc comments for new functions and classes
- Update type definitions in `src/shared/types`
- Follow the MAS (Message Architecture System) pattern
- Keep the code modular and maintainable

## Testing

- Write unit tests for new functionality
- Update existing tests when modifying code
- Aim for high test coverage
- Use Vitest for testing

## Documentation

- Update documentation for any changed functionality
- Add JSDoc comments for public APIs
- Keep the architecture diagrams up to date
- Document any new configuration options

## Commit Messages

Format: `type(scope): description`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks

Example:
```
feat(webview): add support for dark theme
```

## Branch Naming

Format: `type/description`

Types:
- feature
- bugfix
- hotfix
- docs
- refactor

Example:
```
feature/add-remote-control
```

## Need Help?

- Check the [documentation](docs/)
- Open an issue with questions
- Join our [discussions](https://github.com/jarvis-ide/jarvis-ide/discussions)

## License

By contributing to Jarvis IDE, you agree that your contributions will be licensed under the MIT License.
