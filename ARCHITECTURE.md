# Architecture

## Frontend Architecture
- **Framework**: React via Vite. Single Page Application (SPA).
- **State Management**: React Context (`AuthContext`) manages the authenticated user session. Document state is managed via React `useState` and Tiptap's internal state.
- **Routing**: `react-router-dom` handles navigation between the Dashboard (`/`) and Editor (`/doc/:id`).
- **Styling**: Tailwind CSS for utility classes, augmented by `shadcn/ui` components for accessible, consistent UI elements (Dialogs, Selects, Buttons, Toasts).

## Editor (Tiptap)
Tiptap was selected because it is a headless, deeply customizable editor built on ProseMirror. It integrates flawlessly with React, offers robust typing, and its JSON output format is highly structured and predictable, making it safer to store and synchronize compared to raw HTML.
- **Implementation**: We use `@tiptap/starter-kit` and `@tiptap/extension-underline`.
- **Autosave**: A custom hook-like `debouncedSave` debounces JSON content updates by 1000ms, pushing to Supabase. 

## Database & Persistence
- **Supabase PostgreSQL**: Used for storing users, documents, and sharing relationships.
- **Schema**:
  - `public.users`: Mirrors Supabase Auth users.
  - `public.documents`: Stores document title, ownership, and `content_json`.
  - `public.document_shares`: Stores many-to-many relationships between documents and users.
- **Row Level Security (RLS)**: The core authorization mechanism. The backend explicitly rejects unauthorized access. 
  - A `SECURITY DEFINER` function `has_document_access(uid)` is used to avoid recursion problems when querying the `document_shares` table inside RLS policies.

## Major Tradeoffs & Scope Cuts
1. **Real-time Collaboration**: Implementing Yjs/CRDTs with WebSockets was cut to prioritize robust CRUD, RLS security, and architectural cleanliness within the 240-minute timebox.
2. **Demo Mode Auth**: To meet the requirement of a frictionless reviewer experience while maintaining real database security, the "Demo Mode" switcher actually performs real `signInWithPassword` calls using predefined credentials. This is a tradeoff specifically for this assessment environment.
3. **File Parsing**: We support only `.txt` and `.md`. `.docx` parsing requires complex, heavy libraries (like `mammoth`) and was intentionally deferred.
