import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

interface ShareDialogProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type User = {
  id: string
  name: string
  email: string
}

type Share = {
  id: string
  user_id: string
  user: User
}

export function ShareDialog({ documentId, open, onOpenChange }: ShareDialogProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [shares, setShares] = useState<Share[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const fetchUsersAndShares = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    // Fetch all users except current owner to populate the dropdown
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .neq('id', user.id)
      
    if (allUsers) setUsers(allUsers)

    // Fetch existing shares for this document
    // We join with users table to display their names
    const { data: shareData } = await supabase
      .from('document_shares')
      .select(`
        id,
        user_id,
        users (id, name, email)
      `)
      .eq('document_id', documentId)

    if (shareData) {
      // Map the joined data correctly
      const formattedShares: Share[] = shareData.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        user: s.users
      }))
      setShares(formattedShares)
    }
    
    setLoading(false)
  }, [user, documentId])

  useEffect(() => {
    if (open) {
      fetchUsersAndShares()
    }
  }, [open, fetchUsersAndShares])

  const handleShare = async () => {
    if (!selectedUser || !user) return
    
    // Prevent sharing with self (though UI already prevents it by filtering users)
    if (selectedUser === user.id) {
      toast.error('Cannot share with yourself')
      return
    }

    // Check if already shared
    if (shares.some(s => s.user_id === selectedUser)) {
      toast.error('Document is already shared with this user')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        user_id: selectedUser,
        shared_by: user.id
      })
      .select()
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        toast.error('Document is already shared with this user')
      } else {
        toast.error('Failed to share document')
      }
    } else {
      toast.success('Document shared successfully')
      setSelectedUser('')
      fetchUsersAndShares()
    }
    setLoading(false)
  }

  const handleRevoke = async (shareId: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId)

    if (error) {
      toast.error('Failed to revoke access')
    } else {
      toast.success('Access revoked')
      fetchUsersAndShares()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-3 mt-4">
          <Select value={selectedUser} onValueChange={setSelectedUser} disabled={loading}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select user to share with" />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleShare} disabled={!selectedUser || loading}>
            Share
          </Button>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Current Collaborators</h4>
          {shares.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Not shared with anyone</p>
          ) : (
            <div className="space-y-3">
              {shares.map(share => (
                <div key={share.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{share.user.name}</p>
                    <p className="text-xs text-gray-500">{share.user.email}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRevoke(share.id)}
                    disabled={loading}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
