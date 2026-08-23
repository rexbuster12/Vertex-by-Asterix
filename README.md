# VERTEX // Connect and Interact

**VERTEX** is the modern, editorial-style campus networking and student communities platform built for **BML Munjal University (BMU)**. It connects students across cohorts, departments, clubs, and sports with real-time bulletins and member moderation.

---

## ✨ Features

- 🏛️ **Student Communities**: Discover and launch student-run clubs, build cohorts, and community initiatives with WhatsApp group integration.
- 📣 **Community Announcements**: Community founders and co-leaders can broadcast announcements with live 👍 / 👎 reactions.
- 🔍 **Student Directory**: Multi-attribute filtering across programs, batches, major clubs, minor clubs, sports, and community clubs (`NSS BMU`, `SAVERA`, `YRC`).
- 🛡️ **Campus Security & Moderation**: Co-Leader assignment, disruptive member moderation, and user blocking.
- 🎓 **Official BMU Authentication**: Gated student access requiring official university email credentials (`@bmu.edu.in`) with OTP password recovery.

---

## 🛠️ Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System (Neo-Brutalist & Editorial)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Storage Buckets)
- **Routing**: React Router v8
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/vertex-auth-form.git
cd vertex-auth-form
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
