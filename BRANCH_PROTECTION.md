# Branch Protection Rules

This document outlines the branch protection rules that should be configured in GitHub to ensure code quality and prevent broken code from reaching production.

## Why Branch Protection?

✅ Prevents failed tests from being merged  
✅ Requires code review before merging  
✅ Ensures CI/CD pipeline passes  
✅ Protects main branch from accidental direct pushes

## Recommended Configuration

### 1. Protect the `main` branch

Go to **Settings → Branches → Branch protection rules**

Create a rule for `main` with these settings:

#### ✅ Required Checks

- [x] **Require status checks to pass before merging**
  - Status checks that must pass:
    - `test` - All tests must pass
    - `build` - Build must succeed
    - `pipeline-status` - Overall pipeline check

- [x] **Require branches to be up to date before merging**
  - Ensures your branch is up-to-date with main before merging

#### ✅ Require Code Review

- [x] **Require pull request reviews before merging**
  - Minimum: 1 required reviewer
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if using CODEOWNERS file)

#### ✅ Require Conversation Resolution

- [x] **Require all conversations on pull requests to be resolved before merging**
  - Ensures all comments are addressed

#### ✅ Require Signed Commits

- [x] **Require signed commits**
  - Ensures commit authenticity (optional but recommended)

#### ✅ Dismiss Stale Reviews

- [x] **Dismiss stale pull request approvals when new commits are pushed**
  - Reviewers must re-approve after code changes

#### ✅ Require Status Checks

- [x] **Require status checks to pass before merging**
- [x] **Require branches to be up to date before merging**

### 2. Disable Direct Pushes

- [x] **Restrict who can push to matching branches**
  - Only allow administrators to push directly (in emergencies only)
  - Prefer pull requests for all code changes

### 3. Allow Force Pushes

- [ ] **Allow force pushes** - DISABLE
  - Prevents accidental history rewrites

- [ ] **Allow deletions** - DISABLE
  - Prevents accidental branch deletions

## How It Works

```
Developer creates PR
        ↓
GitHub Actions runs CI/CD pipeline:
  - Tests run (test job)
  - Build runs (build job)
  - Pipeline status check (pipeline-status job)
        ↓
If ANY job fails → ❌ BLOCK MERGE
  - Red status on PR
  - Cannot click "Merge pull request"
  - Developer must fix and push again
        ↓
If ALL jobs pass → ✅ ALLOW REVIEW
  - Green checkmark on PR
  - Code review required from 1+ reviewer
  - After review approved → MERGE ALLOWED
        ↓
After merge to main:
  - Deploy job runs on successful test & build
  - Blue-green deployment to production
```

## What Prevents Merging?

❌ **Test failures** - Any failing test blocks merge  
❌ **Build failures** - Build errors block merge  
❌ **Lint errors** - Client linting failures block merge  
❌ **Status check failures** - Pipeline-status job fails  
❌ **Missing approvals** - Needs code review  
❌ **Stale branch** - Must be up-to-date with main  
❌ **Unresolved conversations** - All comments must be addressed

## GitHub Settings

### Where to configure:

1. Go to repo → **Settings**
2. Sidebar → **Branches**
3. Click **Add rule** (or edit existing `main` rule)
4. Branch name pattern: `main`
5. Configure as shown above
6. Click **Create** or **Save changes**

## Example: Workflow When Test Fails

```
Pull Request created
        ↓
GitHub Actions runs
        ↓
Test job: ❌ FAILED (e.g., one test assertion fails)
        ↓
Pipeline-status job: ❌ FAILED (detects test failure)
        ↓
PR shows: 🔴 "Some checks failed"
        ↓
Developer cannot click "Merge pull request" button
        ↓
Developer fixes test and pushes
        ↓
GitHub Actions runs again
        ↓
All checks: ✅ PASSED
        ↓
PR shows: 🟢 "All checks passed"
        ↓
Developer can request review and merge
```

## Example: Workflow When Build Fails

```
Pull Request created with code that won't build
        ↓
GitHub Actions runs
        ↓
Test job: ✅ PASSED
        ↓
Build job: ❌ FAILED (TypeScript compilation error)
        ↓
Pipeline-status job: ❌ FAILED (detects build failure)
        ↓
PR shows: 🔴 "Some checks failed"
        ↓
Cannot merge
        ↓
Developer must fix build error and push
```

## Setup Steps (Step-by-Step)

1. **Go to Repository Settings**
   - Navigate to: `github.com/username/repo/settings`

2. **Click "Branches" in left sidebar**

3. **Click "Add rule" or edit existing "main" rule**

4. **Enter "main" as branch name pattern**

5. **Check these boxes:**
   - ✓ Require a pull request before merging
   - ✓ Dismiss stale pull request approvals when new commits are pushed
   - ✓ Require status checks to pass before merging
   - ✓ Require branches to be up to date before merging
   - ✓ Require conversation resolution before merging
   - ✓ Require linear history

6. **Select required status checks:**
   - test
   - build
   - pipeline-status

7. **Click "Create"**

## Verification

After setup, verify by:

1. Creating a test PR with a failing test
2. Confirm the "Merge pull request" button is disabled
3. Confirm the PR shows a red ❌ status
4. Fix the test and push
5. Confirm the button becomes enabled when all checks pass

## Emergency: Bypassing Branch Protection

**Only administrators can override in emergencies:**

1. Go to PR
2. If you're an admin, you may see "Merge without waiting for checks"
3. Use sparingly - only for critical hotfixes
4. Document why you bypassed

## Recommended: Additional Rules

Add a `CODEOWNERS` file to require specific reviewer approval:

```
# CODEOWNERS file
# Main developers
* @username1 @username2

# Server changes require @backend-dev
/server/ @backend-dev

# Client changes require @frontend-dev
/client/ @frontend-dev

# Tests must be reviewed
*.test.ts @code-reviewer
```

## Troubleshooting

**Q: I can merge but checks haven't finished**
A: Enable "Require branches to be up to date before merging"

**Q: Old approvals still showing after I pushed changes**
A: Enable "Dismiss stale pull request approvals"

**Q: My check failed but I don't see why**
A: Click "Details" on the failed check to see logs

**Q: I need to bypass protection urgently**
A: Contact a repository admin (temporary override available)
