# Project Starter Guide

## Project Structure
```
project-root/
├── .ai-memory/           # AI's working memory and processes
│   ├── manifesto.md     # Project principles and AI guidelines
│   ├── process.md       # Development process documentation
│   ├── decisions.md     # Confirmed decisions from discussions
│   └── way-of-work.md   # Collaboration guidelines
│
├── features/            # Feature specifications and requirements
│   ├── feature-name/    
│   │   ├── README.md    # Feature overview
│   │   ├── specs.md     # Detailed specifications
│   │   └── assets/      # Feature-specific assets
│   └── README.md        # Features index
│
├── src/                 # Source code (framework-specific structure)
│   └── README.md       # Framework-specific guidelines and structure
│
└── README.md           # Project overview
```

## Starter Prompt
```
I want to start a new project with the following structure:

1. Clear separation between:
   - Feature specifications (/features)
   - AI's working memory (.ai-memory)
   - Implementation code (src)

2. Each feature should:
   - Have its own folder in /features
   - Include complete specifications before implementation
   - Include visual references if applicable
   - Be documented with clear acceptance criteria

3. AI memory should focus on:
   - Process and way of work
   - Decision tracking and confirmation
   - Collaboration guidelines

4. Source code structure should:
   - Follow framework best practices
   - Be documented in src/README.md
   - Be organized based on project needs

Please help me set up this project structure and guide me through the development process following these principles.
```

## Guidelines for AI
1. **Always Start with Features**
   - Request feature specifications first
   - Create feature documentation before implementation
   - Validate requirements are complete
   - Get explicit confirmation for requirements

2. **Decision Making Process**
   - Propose decisions clearly and wait for confirmation
   - Document confirmed decisions in .ai-memory/decisions.md
   - Format: [DATE] [CONTEXT] - [DECISION] (Confirmed by: [USER])
   - Never proceed with major changes without confirmation
   - Reference decisions when implementing related features

3. **Maintain Clean Structure**
   - Keep .ai-memory focused on process and decisions
   - Ensure feature docs are in /features
   - Prevent mixing of concerns
   - Adapt src/ structure to project needs

4. **Implementation Flow**
   - Start only after feature specs are confirmed
   - Follow feature specs strictly
   - Reference relevant decisions during implementation
   - Document technical decisions in src/README.md

5. **Review Process**
   - Check against feature specs
   - Validate structure compliance
   - Ensure documentation completeness
   - Verify decisions are being followed

## Decision Mechanics
1. **Proposal Stage**
   ```
   I propose the following decision:
   Context: [Brief context of the decision]
   Decision: [Clear statement of the proposed decision]
   Impact: [What this affects and why it matters]
   
   Please confirm if you agree with this decision.
   ```

2. **Confirmation Stage**
   - Wait for explicit user confirmation
   - Accept variations of: "Confirmed", "Agreed", "Yes", etc.
   - Document in decisions.md with timestamp

3. **Implementation Stage**
   - Reference decision ID/date when implementing
   - Follow decision exactly as confirmed
   - Raise concerns if decision needs revision 