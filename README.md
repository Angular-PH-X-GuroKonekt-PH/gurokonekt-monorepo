# Gurokonekt

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/js?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Generate a library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```
# Libraries
This library contains shared TypeScript type definitions and models and ui used across the application.

## Overview

The `models` library provides type-safe data structures that can be imported and used throughout the monorepo. All models are exported from the main entry point.

## Models

### User

The `User` type represents a user entity in the application.

**Location:** `lib/models/src/lib/models.ts`

**Type Definition:**
```typescript
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};
```

**Properties:**
- `id` (string): Unique identifier for the user
- `name` (string): Full name of the user
- `email` (string): Email address of the user
- `password` (string): User's password (should be hashed in production)

**Usage Example:**
```typescript
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};
```


## Creating Shared UI Components

This workspace includes a shared UI library (`@gurokonekt/ui`) for reusable Angular components. To create a new component in the UI library:

```sh
npx nx generate @nx/angular:component --path=lib/ui/src/lib/component-name/component-name --export=true --standalone=true --name=component-name --prefix=gk --style=scss --no-interactive
```

**Example: Creating a Button component**

```sh
npx nx generate @nx/angular:component --path=lib/ui/src/lib/button/button --export=true --standalone=true --name=button --prefix=gk --style=scss --no-interactive
```

This will create:
- Component files in `lib/ui/src/lib/button/` folder
- Automatically export the component from the library's `index.ts`
- Use the `gk` prefix for component selectors (e.g., `gk-button`)
- Use SCSS for styling

**Using components in your app:**

```typescript
import { Button } from '@gurokonekt/ui';

@Component({
  imports: [Button],
  // ...
})
export class MyComponent {}
```

**Note:** After generating a component, create an `index.ts` file in the component folder to export it:

```typescript
// lib/ui/src/lib/button/index.ts
export * from './button';
```

## Generating Angular Components

To generate a standalone Angular component in the web application:

```sh
npx nx g @nx/angular:component apps/web/src/app/pages/home/home --standalone
```

**Example: Creating a Home component**

```sh
npx nx g @nx/angular:component apps/web/src/app/pages/home/home --standalone
```

This will create:
- Component TypeScript file (`home.ts`)
- Component HTML template (`home.html`)
- Component stylesheet (`home.scss`)
- Component spec file (`home.spec.ts`)

The component will be created as a standalone component, which means it can be used without being declared in an NgModule.

## Generating Angular Services

To generate an Angular service in the web application:

```sh
npx nx g @nx/angular:service services/user/user-service --project=web
```

**Example: Creating a User Service**

```sh
npx nx g @nx/angular:service services/user/user-service --project=web
```

This will create:
- Service TypeScript file (`user-service.ts`) in `apps/web/src/app/services/user/`
- Service spec file (`user-service.spec.ts`) for testing

The service will be automatically provided in the root injector (using `providedIn: 'root'`), making it available throughout the application.

**Usage Example:**

```typescript
import { UserService } from './services/user/user-service';

@Injectable({
  providedIn: 'root',
})
export class MyComponent {
  constructor(private userService: UserService) {}
}
```

## Generating NestJS API Resources

To generate a NestJS resource (controller, service, and module) in the API application:

```sh
npx nx g @nx/nest:resource apps/api/src/app/users/users
```

**Example: Creating a Users resource**

```sh
npx nx g @nx/nest:resource apps/api/src/app/users/users
```

This will create:
- Controller file (`users.controller.ts`) - handles HTTP requests
- Service file (`users.service.ts`) - contains business logic
- Module file (`users.module.ts`) - organizes the resource
- DTO files for creating and updating entities
- Spec files for testing

The resource will be created in `apps/api/src/app/users/` and will include CRUD operations by default.

**Note:** After generating a resource, make sure to import the module in your main `app.module.ts`:

```typescript
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  // ...
})
export class AppModule {}
```

## Run tasks

To build the library use:

```sh
npx nx build pkg1
```

To run any task with Nx use:

```sh
npx nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. All commit messages must follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies (example scopes: webpack, npm)
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Subject Case Formatting

The commit subject (description) can use any of these case formats:

**✅ Accepted Formats:**

| Format | Example | Description |
|--------|---------|-------------|
| **Lower-case** | `feat: add user authentication` | All words in lowercase |
| **Sentence-case** | `feat: Add user authentication` | First word capitalized, rest lowercase |
| **Start-case** | `feat: Add User Authentication` | Each word capitalized with spaces |

**❌ Rejected Formats:**

| Format | Example | Why Rejected |
|--------|---------|--------------|
| **Pascal-case** | `feat: AddUserAuthentication` | Words joined without spaces |
| **Upper-case** | `feat: ADD USER AUTHENTICATION` | All uppercase letters |

### Examples

```bash
# Simple commit (lower-case)
git commit -m "feat: add user authentication"

# Commit with scope (sentence-case)
git commit -m "fix(api): Resolve memory leak in request handler"

# Commit with scope (start-case)
git commit -m "feat(project): Added Shared UI Library"

# Commit with scope and body
git commit -m "docs: update README with commit guidelines" -m "Added detailed documentation on how to write conventional commits"

# Refactor commit
git commit -m "refactor(web): simplify component structure"
```

## Versioning and releasing

To version and release the library use

```
npx nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
