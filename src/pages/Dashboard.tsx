import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { FileText, Clock, Users, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

type Document = {
  id: string
  title: string
  owner_id: string
  updated_at: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [ownedDocs, setOwnedDocs] = useState<Document[]>([])
  const [sharedDocs, setSharedDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchDocs = async () => {
      setLoading(true)
      // Fetch owned documents
      const { data: ownedData, error: ownedError } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      if (!ownedError && ownedData) {
        setOwnedDocs(ownedData)
      }

      // Fetch shared documents (RLS prevents fetching documents not shared with us or owned by us)
      // Since owned documents are returned as well if we don't filter, we filter out owned ones
      const { data: sharedData, error: sharedError } = await supabase
        .from('documents')
        .select('*')
        .neq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      if (!sharedError && sharedData) {
        setSharedDocs(sharedData)
      }
      setLoading(false)
    }

    fetchDocs()
  }, [user])

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('owner_id', user!.id);
      
    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document deleted successfully');
      setOwnedDocs(docs => docs.filter(d => d.id !== docId));
    }
  };

  const renderDocCard = (doc: Document, shared = false) => (
    <Link 
      key={doc.id} 
      to={`/doc/${doc.id}`}
      className="block p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow group relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${shared ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
            <FileText className={`h-5 w-5 ${shared ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors pr-8">
              {doc.title || 'Untitled Document'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
              {shared && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <Users className="h-3 w-3" />
                  <span>Shared</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {!shared && (
        <button
          onClick={(e) => handleDelete(e, doc.id)}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
          title="Delete document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </Link>
  )

  if (loading) {
    return <div className="p-8">Loading documents...</div>
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>
        
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4 border-b pb-2">Owned Documents</h2>
          {ownedDocs.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
              You haven't created any documents yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedDocs.map(doc => renderDocCard(doc, false))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-4 border-b pb-2">Shared with me</h2>
          {sharedDocs.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
              No documents have been shared with you.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedDocs.map(doc => renderDocCard(doc, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
