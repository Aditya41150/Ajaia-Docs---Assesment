import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Undo, Redo, Upload, Share2, Users, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ShareDialog } from '@/components/ShareDialog'
import { parseFileToHtml } from '@/lib/parser'

type DocumentState = {
  id: string
  title: string
  owner_id: string
  content_json: any
  updater?: { name: string } | null
}

export default function Editor() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [document, setDocument] = useState<DocumentState | null>(null)
  const [title, setTitle] = useState('Untitled Document')
  const [saveStatus, setSaveStatus] = useState<'Saving...' | 'Saved just now' | 'Unsaved changes' | ''>('')
  const [isOwner, setIsOwner] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setSaveStatus('Unsaved changes')
      debouncedSave(editor.getJSON())
    },
  })

  // Fetch document
  useEffect(() => {
    if (!id || !user) return
    let isMounted = true

    const fetchDoc = async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, updater:users!last_updated_by(name)')
        .eq('id', id)
        .single()
      
      if (error) {
        toast.error('Document not found or access denied')
        navigate('/')
        return
      }

      if (isMounted && data) {
        setDocument(data)
        setTitle(data.title)
        setIsOwner(data.owner_id === user.id)
        if (editor && !editor.isDestroyed) {
          // Only set content initially to prevent resetting cursor
          editor.commands.setContent(data.content_json || '')
        }
      }
    }
    
    fetchDoc()
    return () => { isMounted = false }
  }, [id, user, navigate, editor])

  // Simple debounce implementation for save
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>
      return (content: any) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (!id || !user) return
          setSaveStatus('Saving...')
          const { error } = await supabase
            .from('documents')
            .update({ content_json: content, updated_at: new Date().toISOString(), last_updated_by: user.id })
            .eq('id', id)
          
          if (error) {
            toast.error('Failed to save changes')
            setSaveStatus('Unsaved changes')
          } else {
            setSaveStatus('Saved just now')
          }
        }, 1000)
      }
    })(),
    [id, user]
  )

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setSaveStatus('Saving...')
    
    const { error } = await supabase
      .from('documents')
      .update({ title: newTitle, updated_at: new Date().toISOString(), last_updated_by: user?.id })
      .eq('id', id)
      
    if (error) {
      toast.error('Failed to save title')
      setSaveStatus('Unsaved changes')
    } else {
      setSaveStatus('Saved just now')
    }
  }

  const handleManualSave = () => {
    if (editor) {
      debouncedSave(editor.getJSON())
      toast.success('Document saved manually')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024 * 2) { // 2MB limit
      toast.error('File is too large. Please import a file smaller than 2MB.')
      return
    }

    try {
      const html = await parseFileToHtml(file)
      
      if (editor) {
        editor.commands.setContent(html)
        setSaveStatus('Unsaved changes')
        debouncedSave(editor.getJSON())
        toast.success('File imported successfully')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file')
    } finally {
      // reset input
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    if (!id || !user) return;
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document deleted successfully');
      navigate('/');
    }
  };

  if (!editor || !document) {
    return <div className="p-8">Loading editor...</div>
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <Input 
            value={title}
            onChange={handleTitleChange}
            className="text-xl font-bold border-transparent hover:border-border focus-visible:ring-1 focus-visible:ring-primary max-w-sm px-2 py-1 h-auto bg-transparent"
            placeholder="Untitled Document"
          />
          <div className="flex flex-col min-w-[150px] items-end">
            <span className="text-sm text-muted-foreground italic">{saveStatus}</span>
            {document.updater?.name && (
              <span className="text-xs text-muted-foreground/70">Last edit by {document.updater.name}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="file" 
              accept=".txt,.md" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import .txt or .md"
            />
            <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleManualSave}>
            Save
          </Button>

          {isOwner && (
            <>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button size="sm" variant="destructive" className="gap-2" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          {!isOwner && (
            <Button size="sm" variant="secondary" disabled className="gap-2">
              <Users className="h-4 w-4" />
              Shared with you
            </Button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-card border-b px-6 shrink-0 shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted' : ''} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted' : ''} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-muted' : ''} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />

        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />

        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-muted' : ''} title="Bulleted List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-muted' : ''} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center pb-32">
        <div className="w-full max-w-[850px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {id && (
        <ShareDialog 
          documentId={id} 
          open={shareDialogOpen} 
          onOpenChange={setShareDialogOpen} 
        />
      )}
    </div>
  )
}
