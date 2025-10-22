# Mangle Rules Changelog

All notable changes to JunoSixteen game rules will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-25

### Added
- **content.dl**: Basic level progression and XP gates
- **compliance.dl**: Time-lock, deadline, and certificate rules  
- **security.dl**: Admin access control and audit requirements
- Risk question logic (Questions 5 & 10)
- Team question mechanics (Question 9)
- Level reset penalties for failed risk questions
- Point multipliers (2x risk, 3x team)
- Certificate tier eligibility (bronze/silver/gold)
- DSGVO-compliant data access rules
- Rate limiting and suspicious activity detection

### Rules Summary
- `allow(User, Module)` - Level gate access control
- `penalty(User, Topic, Type)` - Risk failure penalties
- `certificate_tier(User, Topic, Tier)` - Certificate eligibility
- `violation(User, Topic, Type)` - Time-lock and deadline violations
- `audit_required(Action)` - Mandatory audit logging
- `admin_access(User, Resource)` - Administrative permissions

### Security Notes
- All user data in facts uses IDs only (no PII)
- Audit trail for all policy decisions
- Session-based access control
- IP-based geographic restrictions

### Testing
- 15 golden test cases covering main scenarios
- Risk question pass/fail logic
- Team success calculations  
- Point multiplier combinations
- Certificate tier requirements

## [Unreleased]

### Planned
- Advanced team dynamics rules
- Multi-level certificate chains
- Performance optimization rules
- Custom learning path recommendations
- Integration with external compliance systems 