# Ajaia Docs

Ajaia Docs is an intentionally scoped Google Docs-inspired collaborative document editor. It's built for a full-stack engineering hiring assessment.

## Features
- **Document CRUD**: Create, rename, edit, and automatically save rich text documents.
- **Rich Text Editing**: Bold, italic, underline, headings, bulleted and numbered lists using Tiptap.
- **File Import**: Seamlessly import `.txt` and `.md` files to jumpstart your document.
- **Sharing & Access Control**: Real database-level security using Supabase Row Level Security (RLS). Share documents with other users and revoke access anytime.
- **Demo Mode**: A frictionless authentication switcher designed specifically for evaluators. Easily switch between the three demo users.

## Tech Stack
- React & TypeScript (Vite)
- Tailwind CSS & shadcn/ui
- Tiptap (Rich Text Editor)
- Supabase PostgreSQL (Database & Auth)
- Vitest (Testing)

## Local Setup

### 1. Supabase Setup (Database)
You will need a live Supabase project to test the application since it uses genuine Supabase Auth and PostgreSQL RLS.

1. Go to [Supabase](https://supabase.com) and create a new project.
2. In the SQL Editor, run the `supabase/schema.sql` script to create tables, functions, and RLS policies.
3. In the SQL Editor, run the `supabase/seed.sql` script to create the Demo Users and initial demo document.
4. Get your Project URL and Anon Key from Project Settings -> API.

### 2. Environment Variables
Create a `.env` file in the root of the project using the `.env.example` as a template:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Start the Application
```bash
npm install
npm run dev
```

### 4. Running Tests
```bash
npm run test
```

## Demo Users
The application is pre-configured with three demo users:
- Aditya Singh (aditya@example.com)
- Sarah Chen (sarah@example.com)
- Rahul Mehta (rahul@example.com)
*(Password for all: `demo1234`)*

The UI "Demo Mode" dropdown handles the login automatically.

## Explicit Manual Authorization Verification
To manually verify the RLS policies work, follow these steps:
1. Select **Aditya Singh** from the Demo Mode dropdown.
2. Create a new document (e.g., "Top Secret"). Notice the document URL (e.g., `/doc/uuid`).
3. Switch to **Sarah Chen**.
4. Paste the URL into the address bar. You will receive an access denied error and be redirected to the dashboard.
5. Switch back to **Aditya**, open the document, and click **Share**. Select Sarah.
6. Switch to **Sarah**. The document now appears under "Shared with me".
7. Open the document, edit it, and wait for "Saved just now". Refresh the page to see the edits persist.
8. Switch back to **Aditya**, click Share, and click **Revoke** next to Sarah's name.
9. Switch to **Sarah**. The document is gone, and direct URL access will fail again.
## SCREEN SHOTS

# Dashboard
<img width="1917" height="913" alt="dashboard" src="https://github.com/user-attachments/assets/3526fa3a-f333-457a-b941-012892a29a62" />

# Editor 
<img width="1917" height="923" alt="editor" src="https://github.com/user-attachments/assets/08c40f03-0a01-4f0a-8422-9e1287a7406f" />


# Shairing Section
<img width="1917" height="926" alt="share" src="https://github.com/user-attachments/assets/529dc4d2-1160-418b-84eb-26c4569893be" />

# Shared Document to Sarah Account
<img width="1917" height="923" alt="shared" src="https://github.com/user-attachments/assets/02579e9b-fa1d-4afe-a1c8-b68528811f0e" />

## Deployment
This project is configured to be deployed on Vercel or any standard static host. Remember to configure the Supabase environment variables on your deployment platform.

## Known Limitations
- Real-time cursor presence and live simultaneous editing are out of scope. (It relies on autosaving and database locking).
- Import supports `.txt` and `.md` only (not `.docx` or PDF).
- Users can be assigned shared access, but only the owner can manage permissions.
