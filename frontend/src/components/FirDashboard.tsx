import { useMemo, useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import FIRTable from "@/components/fir-dashboard/fir-table"
import FIRModal, { type FIRFormData } from "@/components/fir-dashboard/fir-modal"
import DisposalModal from "@/components/fir-dashboard/disposal-modal"
import { firAPI } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { POLICE_STATION_HIERARCHY } from '@/constants/policeStations'

type SeriousnessDays = 60 | 90 | 180

export type FIR = {
  _id: string
  firNumber: string
  sections: { act: string; section: string }[]
  policeStation: string
  policeStationId: {
    _id: string
    name: string
    code: string
    subdivision: string
  }
  filingDate: string // ISO
  seriousnessDays: SeriousnessDays
  disposalStatus: 'Registered' | 'Chargesheeted' | 'Finalized'
  disposalDate?: string
  disposalDueDate: string
  deadline: string
  daysRemaining: number
  urgencyStatus: 'safe' | 'warning' | 'critical' | 'urgent' | 'overdue'
  disposalUrgencyStatus: 'Safe' | 'Yellow' | 'Orange' | 'Red' | 'Exceeded'
  createdBy: {
    _id: string
    username: string
    role: string
  }
  assignedTo?: {
    _id: string
    username: string
    role: string
  }
  remarks: Array<{
    remark: string
    addedBy: {
      _id: string
      username: string
      role: string
    }
    addedAt: string
  }>
  createdAt: string
  updatedAt: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISOForInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

function getDeadline(filingISO: string, seriousnessDays: number) {
  return addDays(new Date(filingISO), seriousnessDays)
}

function getDaysRemaining(filingISO: string, seriousnessDays: number, now = new Date()) {
  const deadline = getDeadline(filingISO, seriousnessDays)
  return Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY)
}

function getStatus(filingISO: string, seriousnessDays: number, now = new Date()) {
  const deadline = getDeadline(filingISO, seriousnessDays)
  const remaining = getDaysRemaining(filingISO, seriousnessDays, now)
  
  // New urgency metrics as requested
  if (remaining > 15) return "safe" as const
  if (remaining >= 10) return "warning" as const
  if (remaining >= 5) return "critical" as const
  if (remaining > 0) return "urgent" as const
  return "overdue" as const
}

type SeriousnessFilter = "All" | "60 Days" | "90 Days" | "180 Days"
type UrgencyFilter = "All" | "Safe" | "Yellow" | "Orange" | "Red" | "Exceeded" | "Yellow+" | "Orange+" | "Red+"
type SortOption = "Days Remaining (Asc)" | "Days Remaining (Desc)" | "Registration Date (Newest)" | "Registration Date (Oldest)"

// Generate comprehensive police station list for filtering
const getAllPoliceStations = () => {
  const stations: string[] = []
  
  POLICE_STATION_HIERARCHY.forEach(district => {
    if (district.subdivisions) {
      // District with subdivisions - add all stations
      district.subdivisions.forEach(subdivision => {
        subdivision.stations.forEach(station => {
          stations.push(station)
        })
      })
    } else {
      // Direct stations (ANC, CRIME BRANCH, etc.)
      district.stations.forEach(station => {
        stations.push(station)
      })
    }
  })
  
  return stations.sort() // Sort alphabetically
}

const ALL_POLICE_STATIONS = getAllPoliceStations()

// Convert police station hierarchy to the format expected by the modal
const getPoliceStationData = () => {
  const mainDivisions: string[] = []
  const subdivisions: { [key: string]: string[] } = {}
  
  POLICE_STATION_HIERARCHY.forEach(district => {
    if (district.subdivisions) {
      // District with subdivisions
      mainDivisions.push(district.label)
      subdivisions[district.label] = district.subdivisions.map(sub => sub.label)
    } else {
      // Direct stations (ANC, CRIME BRANCH, etc.)
      mainDivisions.push(district.label)
      subdivisions[district.label] = district.stations
    }
  })
  
  return {
    mainDivisions,
    subdivisions
  }
}

const POLICE_STATIONS = getPoliceStationData()

function FirDashboard() {
  const { user } = useAuth()
  const [firs, setFirs] = useState<FIR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [seriousnessFilter, setSeriousnessFilter] = useState<SeriousnessFilter>("All")
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("All")
  const [selectedMainDiv, setSelectedMainDiv] = useState<string>('')
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>('')
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>("Days Remaining (Asc)")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [disposalModalOpen, setDisposalModalOpen] = useState(false)
  const [disposalFirId, setDisposalFirId] = useState<string | null>(null)
  const [disposalLoading, setDisposalLoading] = useState(false)

  // Fetch FIRs from API
  const fetchFIRs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: 1,
        limit: 100, // Get all FIRs for now
        sortBy: 'filingDate',
        sortOrder: 'desc'
      }
      
      // Add urgency filter if not "All"
      if (urgencyFilter !== "All") {
        params.urgency = urgencyFilter.toLowerCase()
      }
      
      // Add police station filter if selected
      if (selectedStation) {
        params.policeStation = selectedStation
      } else if (selectedSubdivision) {
        params.policeStation = selectedSubdivision
      } else if (selectedMainDiv) {
        params.policeStation = selectedMainDiv
      }
      
      const response = await firAPI.getAllFIRs(params)
      
      if (response.success) {
        setFirs(response.data)
      } else {
        setError('Failed to fetch FIRs')
      }
    } catch (err: any) {
      console.error('Error fetching FIRs:', err)
      setError(err.message || 'Failed to fetch FIRs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFIRs()
  }, [urgencyFilter, selectedMainDiv, selectedSubdivision, selectedStation])

  const openAdd = () => {
    setEditingId(null)
    setModalOpen(true)
  }
  
  const openEdit = (id: string) => {
    setEditingId(id)
    setModalOpen(true)
  }
  
  const closeModal = () => setModalOpen(false)

  const existingNumbers = useMemo(() => firs.map((f) => f.firNumber), [firs])

  const editingItem = useMemo(() => firs.find((f) => f._id === editingId) || null, [editingId, firs])

  // Helper functions for hierarchical police station selection
  const availableSubdivisions = useMemo(() => {
    if (!selectedMainDiv) return []
    const district = POLICE_STATION_HIERARCHY.find(dist => dist.value === selectedMainDiv)
    return district?.subdivisions || []
  }, [selectedMainDiv])

  const availableStations = useMemo(() => {
    if (!selectedSubdivision) return []
    const subdivision = POLICE_STATION_HIERARCHY
      .flatMap(district => district.subdivisions)
      .find(sub => sub.value === selectedSubdivision)
    return subdivision?.stations || []
  }, [selectedSubdivision])

  const handleMainDivChange = (value: string) => {
    setSelectedMainDiv(value)
    setSelectedSubdivision('')
    setSelectedStation('')
  }

  const handleSubdivisionChange = (value: string) => {
    setSelectedSubdivision(value)
    setSelectedStation('')
  }

  const handleStationChange = (value: string) => {
    setSelectedStation(value)
  }

  // Clear all filters function
  const clearAllFilters = () => {
    setSeriousnessFilter("All")
    setUrgencyFilter("All")
    setSelectedMainDiv('')
    setSelectedSubdivision('')
    setSelectedStation('')
    setSortBy("Days Remaining (Asc)")
  }

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      seriousnessFilter !== "All" ||
      urgencyFilter !== "All" ||
      selectedMainDiv !== '' ||
      selectedSubdivision !== '' ||
      selectedStation !== '' ||
      sortBy !== "Days Remaining (Asc)"
    )
  }, [seriousnessFilter, urgencyFilter, selectedMainDiv, selectedSubdivision, selectedStation, sortBy])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (seriousnessFilter !== "All") count++
    if (urgencyFilter !== "All") count++
    if (selectedMainDiv !== '') count++
    if (selectedSubdivision !== '') count++
    if (selectedStation !== '') count++
    if (sortBy !== "Days Remaining (Asc)") count++
    return count
  }, [seriousnessFilter, urgencyFilter, selectedMainDiv, selectedSubdivision, selectedStation, sortBy])

  const filteredSorted = useMemo(() => {
    let rows = [...firs]
    if (seriousnessFilter !== "All") {
      const days = Number.parseInt(seriousnessFilter) as SeriousnessDays
      rows = rows.filter((r) => r.seriousnessDays === days)
    }
    
    // Note: Police station filtering is now handled server-side via fetchFIRs()
    // No need for client-side filtering here
    
    rows.sort((a, b) => {
      if (sortBy === "Days Remaining (Asc)" || sortBy === "Days Remaining (Desc)") {
        const ra = getDaysRemaining(a.filingDate, a.seriousnessDays)
        const rb = getDaysRemaining(b.filingDate, b.seriousnessDays)
        return sortBy === "Days Remaining (Asc)" ? ra - rb : rb - ra
      }
      if (sortBy === "Registration Date (Newest)" || sortBy === "Registration Date (Oldest)") {
        const ta = new Date(a.filingDate).getTime()
        const tb = new Date(b.filingDate).getTime()
        return sortBy === "Registration Date (Newest)" ? tb - ta : ta - tb
      }
      return 0
    })
    return rows
  }, [firs, seriousnessFilter, sortBy])

  const handleDelete = async (id: string) => {
    try {
      const response = await firAPI.deleteFIR(id)
      if (response.success) {
        setFirs(prev => prev.filter(f => f._id !== id))
      } else {
        setError('Failed to delete FIR')
      }
    } catch (err: any) {
      console.error('Error deleting FIR:', err)
      setError(err.message || 'Failed to delete FIR')
    }
  }

  const handleUpdateDisposal = (id: string) => {
    setDisposalFirId(id)
    setDisposalModalOpen(true)
  }

  const handleDisposalSave = async (disposalData: { status: 'Registered' | 'Chargesheeted' | 'Finalized'; dateOfDisposal: string }) => {
    if (!disposalFirId) return

    try {
      setDisposalLoading(true)
      setError(null) // Clear any previous errors
      
      // Use the same edit logic - update FIR with disposal data
      const response = await firAPI.updateFIR(disposalFirId, {
        status: disposalData.status,
        disposalDate: disposalData.dateOfDisposal
      })
      
      if (response && response.success) {
        // Update the FIR in the list
        setFirs(prev => prev.map(f => f._id === disposalFirId ? response.data : f))
        setDisposalModalOpen(false)
        setDisposalFirId(null)
      } else {
        setError(response?.message || 'Failed to update disposal')
      }
    } catch (err: any) {
      console.error('Error updating disposal:', err)
      const errorMessage = err.message || 'Failed to update disposal'
      setError(errorMessage)
    } finally {
      setDisposalLoading(false)
    }
  }

  const handleSave = async (data: FIRFormData) => {
    try {
      const policeStationName = `${data.policeStationOfRegistration.station} (${data.policeStationOfRegistration.mainDivision})`
      
      if (editingItem) {
        // Update existing FIR
        const response = await firAPI.updateFIR(editingItem._id, {
          firNumber: data.firNumber.trim(),
          sections: data.sections,
          policeStation: policeStationName,
          filingDate: new Date(data.filingDate).toISOString(),
          seriousnessDays: data.seriousnessDays
        })
        
        if (response.success) {
          setFirs(prev => prev.map(f => f._id === editingItem._id ? response.data : f))
          setModalOpen(false)
        } else {
          setError('Failed to update FIR')
        }
      } else {
        // Create new FIR
        const response = await firAPI.createFIR({
          firNumber: data.firNumber.trim(),
          sections: data.sections,
          policeStation: policeStationName,
          filingDate: new Date(data.filingDate).toISOString(),
          seriousnessDays: data.seriousnessDays
        })
        
        if (response.success) {
          setFirs(prev => [response.data, ...prev])
          setModalOpen(false)
        } else {
          setError('Failed to create FIR')
        }
      }
    } catch (err: any) {
      console.error('Error saving FIR:', err)
      setError(err.message || 'Failed to save FIR')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading FIRs...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-dvh w-full">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-balance text-2xl md:text-3xl font-semibold">
            FIR Lifecycle Monitoring Dashboard
          </h1>
          <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Add New FIR
          </Button>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-border">
          {/* Filter and Sort Controls */}
          <section className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters & Sorting</h2>
              <Button
                onClick={clearAllFilters}
                variant={hasActiveFilters ? "destructive" : "outline"}
                size="sm"
                className={hasActiveFilters ? "text-white" : "text-muted-foreground hover:text-foreground"}
                disabled={!hasActiveFilters}
              >
                Clear All Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter by Prescribed Time Limit */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Filter by Prescribed Time Limit</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={seriousnessFilter}
                  onChange={(e) => setSeriousnessFilter(e.target.value as SeriousnessFilter)}
                  aria-label="Filter by Prescribed Time Limit"
                >
                  <option>All</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                  <option>180 Days</option>
                </select>
              </div>

              {/* Filter by Urgency Status */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Filter by Urgency Status</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
                  aria-label="Filter by Urgency Status"
                >
                  <option>All</option>
                  <option>Safe</option>
                  <option>Yellow</option>
                  <option>Orange</option>
                  <option>Red</option>
                  <option>Exceeded</option>
                  <option>Yellow+</option>
                  <option>Orange+</option>
                  <option>Red+</option>
                </select>
              </div>

              {/* Filter by Police Station - Hierarchical */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Filter by Police Station</label>
                <div className="space-y-2">
                  {/* Main Division */}
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedMainDiv}
                    onChange={(e) => handleMainDivChange(e.target.value)}
                    aria-label="Select Main Division"
                  >
                    <option value="">All Districts</option>
                    {POLICE_STATION_HIERARCHY.map((district) => (
                      <option key={district.value} value={district.value}>
                        {district.label}
                      </option>
                    ))}
                  </select>

                  {/* Subdivision */}
                  {selectedMainDiv && (
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedSubdivision}
                      onChange={(e) => handleSubdivisionChange(e.target.value)}
                      aria-label="Select Subdivision"
                    >
                      <option value="">All Subdivisions</option>
                      {availableSubdivisions.map((subdivision) => (
                        <option key={subdivision.value} value={subdivision.value}>
                          {subdivision.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Station */}
                  {selectedSubdivision && (
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedStation}
                      onChange={(e) => handleStationChange(e.target.value)}
                      aria-label="Select Station"
                    >
                      <option value="">All Stations</option>
                      {availableStations.map((station) => (
                        <option key={station} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Sort By */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Sort By</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort By"
                >
                  <option>Days Remaining (Asc)</option>
                  <option>Days Remaining (Desc)</option>
                  <option>Registration Date (Newest)</option>
                  <option>Registration Date (Oldest)</option>
                </select>
              </div>
            </div>

            {/* Status Key */}
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Status Key</span>
              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 rounded-sm bg-green-500" aria-hidden />
                  Safe (More than 15 days left)
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 rounded-sm bg-yellow-500" aria-hidden />
                  Yellow (15 to 10 days left)
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 rounded-sm bg-orange-500" aria-hidden />
                  Orange (9 to 5 days left)
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 rounded-sm bg-red-500" aria-hidden />
                  Red (Less than 5 days left)
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 rounded-sm bg-red-800" aria-hidden />
                  Exceeded (Cases that have exceeded the maximum limit)
                </span>
              </div>
            </div>
          </section>

          <Separator className="opacity-60" />

          {/* FIR Data Table */}
          <section className="p-4">
            <FIRTable
              items={filteredSorted}
              onEdit={openEdit}
              onDelete={handleDelete}
              onUpdateDisposal={handleUpdateDisposal}
              getDaysRemaining={getDaysRemaining}
              getStatus={getStatus}
            />
          </section>
        </Card>
      </div>

      {/* Add/Edit FIR Modal */}
      <FIRModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialData={
          editingItem
            ? {
                firNumber: editingItem.firNumber,
                sections: editingItem.sections,
                policeStationOfRegistration: {
                  mainDivision: "North District", // Default for now
                  subdivision: "Panaji", // Default for now
                  station: editingItem.policeStation
                },
                assignedPoliceStation: {
                  mainDivision: "North District", // Default for now
                  subdivision: "Panaji", // Default for now
                  station: editingItem.policeStation
                },
                filingDate: toISOForInput(new Date(editingItem.filingDate)),
                seriousnessDays: editingItem.seriousnessDays
              }
            : undefined
        }
        existingNumbers={existingNumbers}
        excludeNumberOnEdit={editingItem?.firNumber}
      />

      {/* Disposal Modal */}
      <DisposalModal
        open={disposalModalOpen}
        onClose={() => {
          setDisposalModalOpen(false)
          setDisposalFirId(null)
          setError(null) // Clear error when closing modal
        }}
        onSave={handleDisposalSave}
        firNumber={firs.find(f => f._id === disposalFirId)?.firNumber || ''}
        filingDate={firs.find(f => f._id === disposalFirId)?.filingDate}
        loading={disposalLoading}
        error={error}
      />
    </main>
  )
}

export default FirDashboard