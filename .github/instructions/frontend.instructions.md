---
name: Frontend Code Style Guidelines
description: Guidelines for maintaining consistent code style in the frontend codebase.
applyTo: "**/*.ts,**/*.tsx,**/*.css"
---
# Frontend Instructions

When making changes to the frontend codebase, please follow these guidelines to ensure consistency and maintainability:

* Use Tailwind CSS classes for styling whenever possible. This helps maintain a consistent design system across the application. Avoid using inline styles or custom CSS unless absolutely necessary. Refactor existing styles to use Tailwind classes when you encounter them.
* When working with MUI components, prefer Tailwind classes applied via `className` over the `sx` prop. Reserve `sx` for rare cases where Tailwind cannot express the required dynamic styling (e.g., theme token interpolation) and document the reason inline.
* Ensure responsive design by utilizing Tailwind's responsive utility classes.
* Follow the existing component structure and naming conventions. If you create new components, ensure they are placed in the appropriate directories and follow the established patterns.
* Write clear and concise code with proper comments where necessary. Ensure that your code is easy to read and understand for future maintainers.
* Use React best practices, including functional components and hooks.