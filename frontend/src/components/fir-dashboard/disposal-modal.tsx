import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Calendar } from "lucide-react"

type DisposalFormData = {
  status: 'Chargesheeted' | 'Finalized'
  dateOfDisposal: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: DisposalFormData) => void
  firNumber: string
  loading?: boolean
}

export default function DisposalModal({ open, onClose, onSave, firNumber, loading = false }: Props) {
  const [data, setData] = useState<DisposalFormData>({
    status: 'Chargesheeted',
    dateOfDisposal: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      // Set current date as default
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      setData({
        status: 'Chargesheeted',
        dateOfDisposal: dateStr
      })
      setError('')
    }
  }, [open])

  const setCurrentDate = () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    setData(prev => ({ ...prev, dateOfDisposal: dateStr }))
  }

  const isValid = data.status && data.dateOfDisposal

  const handleSave = () => {
    if (!isValid) {
      setError('Please fill in all required fields')
      return
    }

    // Validate date is not in the future
    const disposalDate = new Date(data.dateOfDisposal)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    if (disposalDate > today) {
      setError('Disposal date cannot be in the future')
      return
    }

    onSave(data)
  }

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      
      {/* modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Update FIR Disposal</h2>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">FIR Number</p>
            <p className="font-medium">{firNumber}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Disposal Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Disposal Status *</Label>
            <Select
              value={data.status}
              onValueChange={(value: 'Chargesheeted' | 'Finalized') => 
                setData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disposal status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chargesheeted">Chargesheeted</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disposal Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dateOfDisposal">Date of Disposal *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setCurrentDate}
                className="h-7 px-2 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Today
              </Button>
            </div>
            <input
              id="dateOfDisposal"
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={data.dateOfDisposal}
              onChange={(e) => setData(prev => ({ ...prev, dateOfDisposal: e.target.value }))}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Disposal'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
