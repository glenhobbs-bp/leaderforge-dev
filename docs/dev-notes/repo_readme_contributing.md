# LeaderForge Web App

This is the monorepo for the LeaderForge web application, styled using Tailwind CSS, powered by Next.js, and modularly structured for scalable context-aware features.

## 🚀 Getting Started

1. **Clone the repository**  
   ```bash
   git clone https://github.com/glenhobbs-bp/leaderforge-dev.git
   cd leaderforge-dev
   ```

2. **Install dependencies**  
   ```bash
   pnpm install
   ```

3. **Start the development server**  
   ```bash
   pnpm dev
   ```

4. **Update context configuration**  
   Add or edit `contextConfig.json` files in `/public/config/` to manage the look, feel, and navigation of different contexts.

---

## 💻 Code Structure

- `apps/web` - The main Next.js application.
- `components/ui` - Reusable UI components such as `NavPanel`, `ChatPanel`, `ContentPanel`.
- `public/icons` - SVG icons used in the navigation.
- `public/logos` - Brand-specific logos and icons.
- `contextConfig.json` - Contextual theme and navigation configuration.

---

## 📦 Adding Features

- All components should be written in TypeScript and placed in logical subdirectories.
- Icons should be added in `/public/icons` and referenced in `contextConfig.json`.

---

## 🌿 Contributing

### Best Practices

- Work in a feature branch:
  ```bash
  git checkout -b feature/your-feature-name
  ```

- Commit regularly:
  ```bash
  git add .
  git commit -m "Clear, concise summary of changes"
  ```

- Push your changes:
  ```bash
  git push origin feature/your-feature-name
  ```

- Create a pull request in GitHub.

---

## 🤝 Collaboration Tips

- Use `main` or `master` only for production-ready code.
- Branches should be merged into `main` via PRs.
- Pull the latest code frequently:
  ```bash
  git pull origin master
  ```
