# Prompt Context Management - User Guide

## What are Prompt Contexts?

Prompt contexts are pieces of information that help the AI assistant understand you better and provide more relevant, personalized responses. Think of them as background knowledge that gets automatically included in every conversation with the AI.

### Why Use Prompt Contexts?

- **Personalization**: The AI learns about your role, preferences, and working style
- **Consistency**: Get consistent responses across all your conversations
- **Efficiency**: Avoid repeating the same background information in every chat
- **Team Alignment**: Share organizational knowledge and standards with your team
- **Better Results**: More relevant and actionable AI responses

## Understanding Context Scopes

Prompt contexts are organized into four levels, from most specific to most general:

### 1. Personal Contexts (Highest Priority)
- **What**: Information specific to you as an individual
- **Examples**: Your role, responsibilities, working style, preferences
- **Who can edit**: Only you
- **When applied**: Always applied to your conversations

### 2. Team Contexts
- **What**: Information relevant to your specific team or department
- **Examples**: Team goals, processes, current projects, team standards
- **Who can edit**: Team members with appropriate permissions
- **When applied**: Applied when you're working on team-related tasks

### 3. Organizational Contexts
- **What**: Company-wide information and standards
- **Examples**: Company values, policies, brand guidelines, organizational structure
- **Who can edit**: Organizational administrators
- **When applied**: Applied to maintain company consistency

### 4. Global Contexts (Lowest Priority)
- **What**: Universal knowledge and best practices
- **Examples**: Industry standards, general best practices, common frameworks
- **Who can edit**: System administrators
- **When applied**: Applied as baseline knowledge for all users

## How Context Priority Works

When multiple contexts are enabled, they follow a specific hierarchy:

1. **Personal contexts override everything else** - Your personal preferences take precedence
2. **Team contexts override organizational and global** - Team-specific needs come next
3. **Organizational contexts override global** - Company standards override general ones
4. **Global contexts provide the foundation** - Universal knowledge fills in gaps

Within each scope level, contexts are ordered by their priority number (1 = highest priority, 100 = lowest priority).

## Managing Your Prompt Contexts

### Accessing Context Preferences

1. Navigate to **Context Preferences** in your account settings
2. You'll see a list of all available contexts organized by scope
3. Each context shows:
   - **Name** and **Description**
   - **Scope** (Personal, Team, Organizational, Global)
   - **Priority** level
   - **Toggle** to enable/disable
   - **Usage statistics** (how often it's been applied)

### Enabling and Disabling Contexts

**To enable a context:**
1. Find the context you want to use
2. Click the toggle switch to turn it **ON** (blue/green)
3. The context will now be applied to all your AI conversations

**To disable a context:**
1. Find the context you want to stop using
2. Click the toggle switch to turn it **OFF** (gray)
3. The context will no longer be applied to your conversations

### Viewing Context Details

**To see what's in a context:**
1. Click the **"View"** button next to any context
2. A modal will open showing:
   - Complete context content
   - When it was created and last modified
   - Who created it
   - Usage statistics
   - Any template variables used

### Editing Your Personal Contexts

**To edit a personal context:**
1. Click the **"Edit"** button next to a personal context you own
2. Update any of the following fields:
   - **Name**: A clear, descriptive title
   - **Description**: What this context is for and when to use it
   - **Content**: The actual information to share with the AI
   - **Priority**: How important this context is (1-100, where 1 is highest)
3. Click **"Save"** to apply your changes

**Note**: You can only edit contexts you created or have been given permission to edit.

### Creating New Personal Contexts

**To create a new personal context:**
1. Click the **"Add New Context"** button
2. Fill in the required information:
   - **Name**: Choose a clear, descriptive name
   - **Description**: Explain what this context is for
   - **Content**: Write the information you want the AI to know
   - **Priority**: Set the importance level (1-100)
3. Click **"Create"** to save your new context

## Best Practices for Writing Effective Contexts

### Content Guidelines

**Be Specific and Actionable**
```
❌ Poor: "I'm a manager"
✅ Good: "I'm a Product Manager at a SaaS company, responsible for roadmap planning, user research coordination, and cross-functional team leadership. I prefer data-driven decisions and concise communication."
```

**Include Relevant Details**
- Your role and responsibilities
- Your working style and preferences
- Important constraints or requirements
- Key goals or priorities

**Use Clear, Structured Format**
```
# My Role
Product Manager at TechCorp

## Key Responsibilities
- Roadmap planning and prioritization
- User research and feedback analysis
- Cross-functional team coordination

## Working Style
- Prefer data-driven decisions
- Value concise, actionable communication
- Focus on user impact and business outcomes
```

### Content Length and Focus

**Keep Contexts Focused**
- Each context should cover one specific area or topic
- Aim for 500-2000 characters for most contexts
- Break large topics into multiple specific contexts

**Example: Instead of one massive "About Me" context, create separate contexts:**
- "My Role and Responsibilities"
- "My Communication Preferences"
- "Current Projects and Priorities"
- "My Leadership Style"

### Using Template Variables

Template variables are a powerful feature that allows you to create dynamic, reusable contexts that automatically substitute placeholders with actual values when the context is applied to AI conversations.

#### What Template Variables Are

Template variables are placeholders in your context content that get automatically replaced with real values when the context is used. They use the format `{{variable_name}}` and allow you to create contexts that adapt to different situations without having to manually edit them.

#### Available Built-in Variables

- `{{user_name}}` - Your full name
- `{{user_email}}` - Your email address
- `{{current_date}}` - Today's date
- `{{tenant_name}}` - Your organization name

#### How to Use Template Variables

**1. In Context Content**

When writing your context content, you can include template variables that will be automatically replaced:

**Example Context Content:**
```
Hi, I'm {{user_name}} and I work at {{tenant_name}}.

Today is {{current_date}} and I'm focusing on quarterly planning.

Please send any follow-up communications to {{user_email}}.

## My Current Priorities
- Q1 planning (due this week)
- Team performance reviews
- Budget preparation for {{tenant_name}}
```

**What the AI Actually Sees:**
```
Hi, I'm Glen Hobbs and I work at LeaderForge.

Today is January 17, 2025 and I'm focusing on quarterly planning.

Please send any follow-up communications to glen@brilliantperspectives.com.

## My Current Priorities
- Q1 planning (due this week)
- Team performance reviews
- Budget preparation for LeaderForge
```

**2. Custom Template Variables**

You can also define your own custom template variables in the "Template Variables" section when editing a context:

**Format (in the Template Variables field):**
```
project_name=LeaderForge Platform
current_sprint=Sprint 23
team_size=8 developers
budget_cycle=Q1 2025
```

**Then use them in your context content:**
```
I'm currently working on {{project_name}} during {{current_sprint}}.

Our team of {{team_size}} is focused on delivering features for {{budget_cycle}}.

When discussing technical decisions, please consider our {{team_size}} team capacity.
```

#### Practical Use Cases

**1. Personal Context with Dynamic Dates**
```
Context Name: Daily Work Focus
Content:
Today is {{current_date}} and I'm {{user_name}}, CTO at {{tenant_name}}.

My current priorities this week:
- {{current_priority}}
- {{urgent_deadline}}
- Team check-ins

Template Variables:
current_priority=Architecture review for new features
urgent_deadline=Budget presentation due Friday
```

**2. Team Context with Project Variables**
```
Context Name: Current Project Context
Content:
We're working on {{project_name}} with a team of {{team_size}}.

Current sprint: {{current_sprint}}
Release target: {{release_date}}
Key stakeholder: {{stakeholder_email}}

When making recommendations, consider our {{team_size}} capacity and {{release_date}} deadline.

Template Variables:
project_name=User Authentication Redesign
team_size=5 engineers
current_sprint=Sprint 24
release_date=February 15, 2025
stakeholder_email=product@leaderforge.com
```

**3. Organizational Context with Company Variables**
```
Context Name: Company Standards
Content:
At {{tenant_name}}, we follow these principles:

- Customer-first approach
- Data-driven decisions
- Quarterly planning cycles
- Budget reviews every {{budget_cycle}}

All communications should reflect {{tenant_name}}'s values.

Template Variables:
budget_cycle=3 months
review_period=quarterly
```

#### Benefits of Template Variables

**Reusability**
- Create one context that works across different projects, time periods, or situations
- No need to manually update contexts when details change

**Consistency**
- Ensure accurate information (dates, names, emails) without typos
- Maintain consistent formatting across all contexts

**Efficiency**
- Update variables once instead of editing multiple contexts
- Automatically stay current with dates and dynamic information

**Personalization**
- Contexts automatically adapt to the specific user and organization
- Same context template can be shared across team members but personalized

#### How Variables Are Processed

1. **When you save a context** - Template variables are stored separately from content
2. **When context is applied** - System replaces all `{{variable_name}}` placeholders with actual values
3. **AI receives** - Fully resolved content with all variables substituted

#### Managing Template Variables

**In the Edit Modal:**
1. **Template Variables Field** - Enter custom variables in `key=value` format (one per line)
2. **Content Field** - Use `{{variable_name}}` syntax in your context content
3. **Preview** - See how variables will be resolved (coming in future updates)

**Best Practices:**
- **Use descriptive names** - `current_project` instead of `proj`
- **Keep values current** - Update variables regularly
- **Document variables** - Include comments about what each variable represents
- **Test substitution** - Verify variables resolve correctly in AI responses

## Understanding Context Application

### When Contexts Are Applied

Contexts are automatically applied to your AI conversations when:
- You start a new chat session
- The AI needs background information to provide better responses
- You're working on tasks related to the context scope

### How to Tell if Contexts Are Working

**Indicators that contexts are being applied:**
- AI responses are more personalized and relevant
- AI remembers your role and preferences without you repeating them
- AI provides suggestions that align with your working style
- AI uses appropriate terminology for your industry/role

### Troubleshooting Context Issues

**If contexts don't seem to be working:**

1. **Check if contexts are enabled**
   - Go to Context Preferences
   - Verify the toggle is ON for contexts you want to use

2. **Verify context content**
   - Click "View" to see what information is in the context
   - Make sure the content is clear and relevant

3. **Check context priority**
   - Higher priority contexts (lower numbers) take precedence
   - Personal contexts always override team/organizational contexts

4. **Start a new conversation**
   - Contexts are applied when conversations begin
   - Try starting a fresh chat to see updated context application

## Advanced Features

### Context Analytics (Coming Soon)

Future versions will include:
- **Usage tracking**: See how often each context is applied
- **Effectiveness metrics**: Understand which contexts improve AI responses
- **Optimization suggestions**: AI-powered recommendations for improving contexts

### Context Sharing (Future Feature)

Planned capabilities:
- Share personal contexts with team members
- Create team context templates
- Import/export contexts between accounts

### Context Categories and Tags (Future Feature)

Upcoming organization features:
- Tag contexts by topic or project
- Group related contexts together
- Quick filtering and search capabilities

## Privacy and Security

### What Information is Stored

- **Context content**: The text you write in your contexts
- **Usage data**: When and how often contexts are applied
- **Preferences**: Which contexts you have enabled/disabled

### Data Protection

- **Personal contexts**: Only visible to you
- **Team contexts**: Only visible to team members
- **Encryption**: All context data is encrypted in storage
- **Access control**: Strict permissions prevent unauthorized access

### Data Retention

- **Active contexts**: Stored as long as your account is active
- **Deleted contexts**: Permanently removed within 30 days
- **Usage analytics**: Aggregated data retained for service improvement

## Getting Help

### Common Questions

**Q: How many contexts can I have?**
A: There's no hard limit, but we recommend focusing on 5-10 well-crafted contexts for best results.

**Q: Can I temporarily disable all contexts?**
A: Yes, you can toggle off individual contexts or contact support to temporarily disable context application.

**Q: What happens if I have conflicting contexts?**
A: Higher priority contexts override lower priority ones. Personal contexts always take precedence over team/organizational contexts.

**Q: Can I see what contexts were used in a specific conversation?**
A: This feature is planned for a future release. Currently, you can see which contexts are enabled in your preferences.

**Q: What template variables are available?**
A: Built-in variables include `{{user_name}}`, `{{user_email}}`, `{{current_date}}`, and `{{tenant_name}}`. You can also create custom variables in the Template Variables field using `key=value` format.

**Q: How do I create custom template variables?**
A: In the Edit Context modal, use the Template Variables field. Enter one variable per line in `key=value` format, then reference them in your content using `{{key}}` syntax.

### Getting Support

If you need help with prompt contexts:

1. **Check this guide first** - Most questions are answered here
2. **Contact your team admin** - For team or organizational context questions
3. **Submit a support ticket** - For technical issues or feature requests
4. **Join our community forum** - For tips and best practices from other users

### Feedback and Suggestions

We're constantly improving the prompt context system. Share your feedback:

- **Feature requests**: What would make contexts more useful for you?
- **Usability feedback**: How can we make the interface better?
- **Content suggestions**: What types of contexts would be helpful?

---

**Last Updated**: January 17, 2025
**Version**: 1.0
**Related**: [Prompt Context Implementation Plan](../engineering/implementation-plans/prompt-context-management-implementation-plan.md)