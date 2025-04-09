# Contributing to Jarvis IDE

Thank you for your interest in contributing to Jarvis IDE! This document will help you get started.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/jarvis-ide.git
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Press F5 in VS Code to start debugging
3. Make your changes
4. Run the tests:
   ```bash
   npm test
   ```
5. Run tests with coverage:
    ```bash
   npm run coverage
   ```

## Pull Requests

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md following the Keep a Changelog format
3. The PR title should follow the Conventional Commits format
4. Include tests for any new functionality
5. Ensure all tests pass
6. Link any related issues

## Style Guide

- Use TypeScript
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await instead of callbacks
- Write unit tests for new code

## Documentation

- Keep documentation up to date
- Document new features
- Include code examples
- Use clear and concise language

## Testing

- Write unit tests for new code
- Update existing tests when changing functionality
- Aim for high test coverage
- Test edge cases
- Test error conditions

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc)
- refactor: Code changes that neither fix bugs nor add features
- perf: Performance improvements
- test: Adding or updating tests
- chore: Updating build tasks, package manager configs, etc

## License

By contributing to Jarvis IDE, you agree that your contributions will be licensed under the MIT license.
