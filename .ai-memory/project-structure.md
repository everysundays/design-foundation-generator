# AI Memory Structure

## Directory Structure
```
.ai-memory/
├── README.md                    # Project overview and main documentation
├── sprint-progress.md          # Current sprint status and daily updates
├── features/                   # Individual feature requirements
│   ├── color-wheel/           # Color wheel feature
│   │   ├── requirements.md    # Detailed requirements
│   │   ├── technical-spec.md  # Technical specifications
│   │   └── progress.md        # Feature-specific progress
│   ├── color-scales/          # Color scales feature
│   │   ├── requirements.md
│   │   ├── technical-spec.md
│   │   └── progress.md
│   └── ...                    # Other features
├── technical/                  # Technical documentation
│   ├── architecture.md        # System architecture
│   ├── data-structure.md      # Data structures
│   └── conventions.md         # Coding conventions
├── decisions/                  # Important decisions and their context
│   ├── color-model.md         # HEX to HSL transition
│   └── ...
└── references/                # External references and standards
    └── ads-standards.md       # ADS design system standards
```

## Feature Documentation Template
Each feature folder should contain:

### requirements.md
```markdown
# [Feature Name] Requirements

## Overview
Brief description of the feature

## User Stories
- As a [user] I want to [action] so that [benefit]

## Functional Requirements
1. Requirement 1
   - Sub-requirement
   - Acceptance criteria

## Technical Requirements
1. Technical requirement 1
   - Implementation details
   - Constraints

## Dependencies
- Other features
- External systems

## Success Criteria
- Measurable outcomes
```

### technical-spec.md
```markdown
# Technical Specification

## Architecture
- Components
- Interfaces
- Data flow

## Implementation Details
- Algorithms
- Data structures
- Edge cases

## Testing Strategy
- Unit tests
- Integration tests
- Performance criteria
```

### progress.md
```markdown
# Feature Progress

## Current Status
- [ ] Task 1
- [x] Task 2

## Blockers
- Current issues
- Dependencies waiting

## Next Steps
- Upcoming tasks
- Priority order
```

## Benefits of This Structure
1. **Feature Isolation**: Each feature has its own complete documentation
2. **Clear Progress Tracking**: Easy to track progress per feature
3. **Context Preservation**: Technical decisions and requirements are stored together
4. **Easy Navigation**: Logical folder structure makes information easy to find
5. **AI-Friendly**: Structure helps AI maintain context between sessions

## Recommendations for AI Memory Management

1. **Daily Updates**:
   - Update sprint-progress.md at start/end of each session
   - Mark completed tasks and add new requirements
   - Document any issues or blockers

2. **Context Preservation**:
   - Keep technical decisions with their reasoning
   - Link related documents using markdown references
   - Maintain version history of important changes

3. **Feature Development Flow**:
   - Start with requirements gathering
   - Create technical specification
   - Track progress during implementation
   - Update documentation as features evolve

4. **Communication Protocol**:
   - Clear task handoffs between sessions
   - Document assumptions and questions
   - Keep reference to ADS standards
``` 