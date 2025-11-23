---
applyTo: "backend/**/*.cs"
---
# Backend Instructions

When making changes to the backend codebase, please adhere to the following guidelines to ensure code quality and maintainability:
* Follow C# coding conventions and best practices. This includes proper naming conventions, code organization, and use of language features.
* Write unit tests for any new functionality or significant changes to existing code. Ensure that tests cover various scenarios and edge cases.
* Use dependency injection to manage dependencies and promote testability.
* Ensure proper error handling and logging throughout the codebase. Use structured logging where appropriate.

# C-Sharp Specific Code Guidelines

* When calling a function that takes two or more parameters, place each parameter always on its own line even if the function call doesn't exceed 80 characters in length. This improves readability and makes it easier to identify individual parameters.

```csharp
// Good
SomeFunction(
    parameterOne,
    parameterTwo,
    parameterThree
);
```

```csharp
// Bad
SomeFunction(parameterOne, parameterTwo, parameterThree);
```
