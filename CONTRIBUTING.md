# Contributing to Eunoia

Thank you for your interest in contributing to Eunoia! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/freemell/Eunoia/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node version)
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**:
   - Follow the existing code style
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation as needed
4. **Test your changes**: Run `npm run build` and `npm run lint`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** with:
   - Clear description of changes
   - Reference related issues
   - Screenshots for UI changes

## Development Setup

1. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Eunoia.git`
2. Install dependencies: `npm install`
3. Set up environment variables (see `env-template.txt`)
4. Run development server: `npm run dev`

## Code Style

- Use TypeScript for type safety
- Follow existing code formatting (Prettier/ESLint)
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions and services
- `prisma/` - Database schema and migrations
- `public/` - Static assets

## Testing

- Test wallet connections with different wallets
- Test AI chat responses
- Verify Solana transactions on devnet first
- Test UI components across different browsers

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing to Eunoia! 🚀

