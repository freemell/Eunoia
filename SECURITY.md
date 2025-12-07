# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it privately:

1. **Email**: [Add your security contact email]
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

- We will acknowledge your report within 48 hours
- We will provide a detailed response within 7 days
- We will keep you informed of the progress

## Security Best Practices

### For Users

- **Never share your private keys or seed phrases**
- **Always verify transaction details before signing**
- **Use hardware wallets for large amounts**
- **Keep your wallet software updated**
- **Be cautious of phishing attempts**

### For Developers

- **Never commit API keys or secrets to the repository**
- **Use environment variables for sensitive data**
- **Validate all user inputs**
- **Implement rate limiting on API endpoints**
- **Use HTTPS in production**
- **Keep dependencies updated**

## Known Security Considerations

### Wallet Integration

- Private keys are **never** stored or transmitted by Eunoia
- All transactions require explicit user approval via wallet
- Wallet connections use standard Solana Wallet Adapter protocols

### API Security

- API keys are stored server-side only
- Rate limiting is implemented on chat endpoints
- Input validation on all user-provided data

### Database

- Encryption keys are stored securely
- Database connections use SSL/TLS
- Sensitive data is encrypted at rest

## Updates

Security updates will be released as patches. Please keep your installation updated.

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.

