import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { FileText, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

export const Layout = () => {
  const { user, switchDemoUser, loading } = useAuth()
  const navigate = useNavigate()

  const demoUsers = [
    { name: 'Aditya Singh', email: 'aditya@example.com' },
    { name: 'Sarah Chen', email: 'sarah@example.com' },
    { name: 'Rahul Mehta', email: 'rahul@example.com' }
  ]

  const handleCreateNew = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('documents')
      .insert({ owner_id: user.id, title: 'Untitled Document' })
      .select()
      .single()

    if (error) {
      console.error('Error creating doc:', error)
      return
    }
    if (data) {
      navigate(`/doc/${data.id}`)
    }
  }

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">Loading...</div>
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" /> Ajaia Docs
        </h1>
        <div className="bg-card p-8 rounded-lg shadow-sm border w-96 max-w-full">
          <h2 className="text-xl font-semibold mb-4 text-center">Select Demo User</h2>
          <div className="flex flex-col gap-3">
            {demoUsers.map((u) => (
              <Button key={u.email} onClick={() => switchDemoUser(u.email)} variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" /> {u.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-6 w-6 text-primary" />
            Ajaia Docs
          </Link>
          <ThemeToggle />
        </div>
        
        <div className="p-4">
          <Button onClick={handleCreateNew} className="w-full flex items-center gap-2" variant="default">
            <Plus className="h-4 w-4" /> New Document
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Owned</h3>
             <Link to="/" className="block py-2 text-sm text-foreground/70 hover:text-primary">
               View All Documents
             </Link>
          </div>
        </nav>

        <div className="p-4 border-t bg-muted/20">
          <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Demo Mode</div>
          <Select 
            value={user?.email || ''} 
            onValueChange={(val: string) => switchDemoUser(val)}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {demoUsers.map(u => (
                <SelectItem key={u.email} value={u.email}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
