# AI Workflow

## AI Tools Used
- Antigravity / Gemini 3.1 Pro (High)
- Vite template scaffolding
- Tailwind + shadcn/ui components

## Prompts Used
*(Evaluator: Fill this in with the primary prompt sets provided for the assessment.)*
- ...

## What AI Accelerated
- **Boilerplate**: Instantly generating the Vite config, `tsconfig` paths, and setting up `tailwind.config.js`.
- **UI Components**: Fast composition of shadcn/ui elements (Dialogs, Select dropdowns, Buttons) to build the Dashboard and Share Dialogs without wrestling with CSS.
- **SQL Generation**: Generating the Supabase schemas, specific RLS policies (e.g., using `SECURITY DEFINER` to avoid infinite recursion), and the seed SQL containing the encrypted mock passwords.

## What AI-Generated Code Was Changed
- **RLS Recursion**: Initial AI suggestions often try to query `document_shares` directly inside the `documents` RLS policy, which leads to infinite recursion. This was caught and corrected by extracting it into a `SECURITY DEFINER` function with a strict `search_path`.
- **Vitest Configuration**: Re-configured Vite to properly support Vitest without conflicts in path aliases.
- **Tiptap State Management**: Fixed cursor jumping issues by ensuring `editor.commands.setContent()` is only called once initially, rather than on every state sync.

## What AI-Generated Suggestions Were Rejected
- **Storing Passwords**: Rejected suggestions to insert plain text into `auth.users` directly from the frontend or unhashed. Used `crypt()` and `gen_salt()` in the SQL seed script.
- **Fake Auth**: Rejected a purely client-side "current user ID" state mechanism. Implemented a Demo Mode switcher that actually uses Supabase's `signInWithPassword()` behind the scenes.
- **Excessive Features**: Rejected suggestions to integrate real-time WebSockets (Yjs), adhering strictly to the assessment scope limits (CRUD + autosaving).

## How Implementation Was Verified
- Type checking with `tsc --noEmit`.
- Automated testing with `vitest` for the Markdown/Text file parsing logic.
- Explicit manual authorization verification against the actual Supabase database (creating, sharing, revoking, testing isolation).

## How Tests Were Used
- Unit tests were used to ensure the `marked` library correctly parsed Markdown into valid HTML strings suitable for Tiptap.
- Ensured Edge cases (.csv file uploads) are explicitly rejected.

## How UX Was Manually Reviewed
- Verified the debounced save provides immediate visual feedback ("Saving..." -> "Saved just now").
- Verified the Demo Switcher seamlessly logs out and logs in without refreshing the page.
- Verified the Editor is visually distinct, centered, and handles long content gracefully.
