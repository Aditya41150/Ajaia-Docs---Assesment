# Ajaia Docs Assessment Submission

## Live Product
[URL]

## Source Code
[GitHub/Drive URL]

## Walkthrough Video
[URL]

## Demo Users
Aditya Singh (aditya@example.com)
Sarah Chen (sarah@example.com)
Rahul Mehta (rahul@example.com)

*Password for all users is `demo1234`. The Demo Mode UI handles login automatically.*

## Working Features
- Complete Document CRUD operations.
- Tiptap Rich Text Editing (bold, italic, underline, headers, lists).
- Autosaving to Supabase PostgreSQL.
- File Import (.txt and .md) directly into the editor.
- Document Sharing with Access Control (RLS backed).
- Demo User Switcher (uses real Supabase authentication).

## Known Limitations
- Does not support real-time cursors or simultaneous collaborative editing (locks/autosaves only).
- Import supports `.md` and `.txt` exclusively.
- PDF and DOCX export are omitted per scope limits.

## What I Would Build With Another 2-4 Hours
- **Real-Time Collaboration**: Integrate Yjs or Hocuspocus with Tiptap for live cursors and conflict resolution.
- **Folders & Organization**: Add a folder structure or tagging system for better document management on the Dashboard.
- **Debounced Title Save**: Improve the title editing experience with better debouncing.
- **User Settings**: Allow users to configure dark mode, default font size, etc.

## Verification
- Run `npm run test` to verify parsing logic.
- Run `npm run build` to verify type safety and build pipeline.
- See README.md for instructions on manually verifying the Supabase Row Level Security policies.
