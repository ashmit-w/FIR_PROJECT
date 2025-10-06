import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DisposalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: { status: 'Registered' | 'Chargesheeted' | 'Finalized'; dateOfDisposal: string }) => void
  firNumber: string
  filingDate?: string
  loading?: boolean
  error?: string
}

export default function DisposalModal({ 
  open, 
  onClose, 
  onSave, 
  firNumber, 
  filingDate, 
  loading = false, 
  error: parentError 
}: DisposalModalProps) {
  const [status, setStatus] = useState<'Registered' | 'Chargesheeted' | 'Finalized'>('Chargesheeted')
  const [dateOfDisposal, setDateOfDisposal] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!dateOfDisposal) {
      setError('Please select a disposal date')
      return
    }

    setError('') // Clear any previous errors
    onSave({ status, dateOfDisposal })
  }

  const handleClose = () => {
    setStatus('Chargesheeted')
    setDateOfDisposal('')
    setError('')
    onClose()
  }

  // Calculate minimum date (filing date or today, whichever is later)
  const getMinDate = () => {
    const today = new Date().toISOString().split('T')[0]
    if (filingDate) {
      const filingDateStr = new Date(filingDate).toISOString().split('T')[0]
      return filingDateStr > today ? filingDateStr : today
    }
    return today
  }

  const handleTodayClick = () => {
    setDateOfDisposal(getMinDate())
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Disposal Status - FIR {firNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {(error || parentError) && (
            <Alert variant="destructive">
              <AlertDescription>{error || parentError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Disposal Status</Label>
            <Select value={status} onValueChange={(value: 'Registered' | 'Chargesheeted' | 'Finalized') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Chargesheeted">Chargesheeted</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfDisposal">Date of Disposal</Label>
            {filingDate && (
              <p className="text-sm text-muted-foreground">
                Must be on or after filing date: {new Date(filingDate).toLocaleDateString()}
              </p>
            )}
            <div className="flex gap-2">
              <input
                id="dateOfDisposal"
                type="date"
                value={dateOfDisposal}
                onChange={(e) => setDateOfDisposal(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                min={getMinDate()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTodayClick}
                className="px-3"
              >
                Today
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Updating...' : 'Update Disposal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
