# CampusFlow — Student Management Dashboard

A responsive student management dashboard built with React, Vite, React Router, and CSS. This frontend-only project uses browser localStorage for persistence.

## Features

- Dashboard statistics and course distribution
- Create, read, update, and delete student records
- Search, course/status filters, and sorting
- Student detail pages
- Form validation
- Persistent browser storage
- Compact table preference
- Responsive layout
- React Router navigation

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Deploy

Push this repository to GitHub and import it into Vercel. Use the default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`

## Important note

This is a frontend learning project. Student records are stored only in the current browser's localStorage. They are not synced across devices and are not sent to a server.
