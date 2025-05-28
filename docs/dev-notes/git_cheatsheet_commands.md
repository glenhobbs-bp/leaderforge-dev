# 🧠 Git Cheatsheet

## 🔧 Initial Setup

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 🚀 Daily Workflow

```bash
git pull origin master             # Get latest changes
git checkout -b feature/xyz        # Create new feature branch
...                                # Do your work
git add .                          # Stage changes
git commit -m "Add feature xyz"    # Commit with message
git push origin feature/xyz        # Push to GitHub
```

## 📦 Merging & PR

1. Go to GitHub, open a pull request into `master`
2. Review, approve, and merge the PR
3. Pull the latest `master` locally:
   ```bash
   git checkout master
   git pull origin master
   ```

## 🧹 Clean Up

```bash
git branch -d feature/xyz          # Delete local branch
git push origin --delete feature/xyz  # Delete remote branch
```

## 📂 Cloning a Repo

```bash
git clone https://github.com/org/repo.git
```

## 🔍 Common Commands

```bash
git status                         # Check changes
git log                            # View commit history
git diff                           # See file changes
git stash                          # Save uncommitted changes temporarily
git stash pop                      # Reapply stashed changes
```

## 🛠 Fix Large Files

If push fails due to large files:

```bash
git rm --cached path/to/largefile
echo "path/to/largefile" >> .gitignore
git commit -m "Remove large file"
git push origin master
```

## 🔄 Reset Local Branch

```bash
git fetch origin
git reset --hard origin/master
```

## 🧪 Test Push After Fix

```bash
git push --force --set-upstream origin master
```

---

## 📚 Appendix

- `git branch` — List branches
- `git checkout` — Switch branches
- `git merge` — Merge branches
- `git remote -v` — Show remotes
- `git push -u origin branch` — Push and set upstream
- `git rebase` — Reapply commits on top of another base tip
