import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Clock } from "lucide-react"
import { POLICE_STATION_HIERARCHY } from '@/constants/policeStations'

export type FIRFormData = {
  firNumber: string
  sections: { act: string; section: string }[]
  policeStationOfRegistration: {
    mainDivision: string
    subdivision: string
    station: string
  }
  assignedPoliceStation: {
    mainDivision: string
    subdivision: string
    station: string
  }
  filingDate: string // datetime-local value
  seriousnessDays: 60 | 90 | 180
}

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: FIRFormData) => void
  initialData?: FIRFormData
  existingNumbers: string[]
  excludeNumberOnEdit?: string
}

export default function FIRModal({
  open,
  onClose,
  onSave,
  initialData,
  existingNumbers,
  excludeNumberOnEdit,
}: Props) {
  // State management for Police Station of Registration
  const [selectedMainDivRegistration, setSelectedMainDivRegistration] = useState<string>('')
  const [selectedSubdivisionRegistration, setSelectedSubdivisionRegistration] = useState<string>('')
  const [selectedStationRegistration, setSelectedStationRegistration] = useState<string>('')

  // State management for Assigned Police Station
  const [selectedMainDivAssigned, setSelectedMainDivAssigned] = useState<string>('')
  const [selectedSubdivisionAssigned, setSelectedSubdivisionAssigned] = useState<string>('')
  const [selectedStationAssigned, setSelectedStationAssigned] = useState<string>('')

  // Helper functions to work with police station hierarchy
  const getMainDivisions = () => {
    return POLICE_STATION_HIERARCHY.map(district => district.label)
  }

  const getMainDivisionsForRegistration = () => {
    return POLICE_STATION_HIERARCHY
      .filter(district => !district.isAssignedOnly)
      .map(district => district.label)
  }

  const getSubdivisions = (mainDivision: string) => {
    const district = POLICE_STATION_HIERARCHY.find(d => d.label === mainDivision)
    if (district?.subdivisions) {
      return district.subdivisions.map(sub => sub.label)
    }
    return []
  }

  const getStations = (mainDivision: string, subdivision: string) => {
    const district = POLICE_STATION_HIERARCHY.find(d => d.label === mainDivision)
    if (district?.subdivisions) {
      const sub = district.subdivisions.find(s => s.label === subdivision)
      return sub?.stations || []
    } else {
      // Direct stations (ANC, CRIME BRANCH, etc.)
      return district?.stations || []
    }
  }

  // Helper function to determine if a main division has subdivisions
  const hasSubdivisions = (mainDivision: string) => {
    const district = POLICE_STATION_HIERARCHY.find(d => d.label === mainDivision)
    return district?.subdivisions && district.subdivisions.length > 0
  }

  // Helper function to get all direct stations for units without subdivisions
  const getDirectStations = (mainDivision: string) => {
    const district = POLICE_STATION_HIERARCHY.find(d => d.label === mainDivision)
    return district?.stations || []
  }

  // Helper function to check if a unit has only one station (for disabled input)
  const hasSingleStation = (mainDivision: string) => {
    const stations = getDirectStations(mainDivision)
    return stations.length === 1
  }

  const [data, setData] = useState<FIRFormData>(() => ({
    firNumber: "",
    sections: [{ act: "IPC", section: "" }],
    policeStationOfRegistration: {
      mainDivision: "",
      subdivision: "",
      station: ""
    },
    assignedPoliceStation: {
      mainDivision: "",
      subdivision: "",
      station: ""
    },
    filingDate: "",
    seriousnessDays: 60,
  }))

  useEffect(() => {
    if (open) {
      if (initialData) {
        setData(initialData)
        setSelectedMainDivRegistration(initialData.policeStationOfRegistration.mainDivision)
        setSelectedSubdivisionRegistration(initialData.policeStationOfRegistration.subdivision)
        setSelectedStationRegistration(initialData.policeStationOfRegistration.station)
        setSelectedMainDivAssigned(initialData.assignedPoliceStation.mainDivision)
        setSelectedSubdivisionAssigned(initialData.assignedPoliceStation.subdivision)
        setSelectedStationAssigned(initialData.assignedPoliceStation.station)
      } else {
        const defaultMainDivRegistration = getMainDivisionsForRegistration()[0] ?? ""
        const defaultMainDivAssigned = getMainDivisions()[0] ?? ""
        
        setData({
          firNumber: "",
          sections: [{ act: "IPC", section: "" }],
          policeStationOfRegistration: {
            mainDivision: defaultMainDivRegistration,
            subdivision: "",
            station: ""
          },
          assignedPoliceStation: {
            mainDivision: defaultMainDivAssigned,
            subdivision: "",
            station: ""
          },
          filingDate: "",
          seriousnessDays: 60,
        })
        
        setSelectedMainDivRegistration(defaultMainDivRegistration)
        setSelectedSubdivisionRegistration("")
        setSelectedStationRegistration("")
        setSelectedMainDivAssigned(defaultMainDivAssigned)
        setSelectedSubdivisionAssigned("")
        setSelectedStationAssigned("")
      }
    }
  }, [open, initialData])

  // Handlers for Police Station of Registration dropdowns
  const handleMainDivRegistrationChange = (value: string) => {
    setSelectedMainDivRegistration(value)
    setSelectedSubdivisionRegistration("")
    setSelectedStationRegistration("")
    
    if (value && !hasSubdivisions(value)) {
      // Unit with direct stations (no subdivisions)
      if (hasSingleStation(value)) {
        // Single station unit (like ANC) - auto-fill the station
        const stationName = getDirectStations(value)[0]
        setSelectedStationRegistration(stationName)
        setData(prev => ({
          ...prev,
          policeStationOfRegistration: {
            mainDivision: value,
            subdivision: "",
            station: stationName
          }
        }))
      } else {
        // Multiple stations unit (like Coastal Security) - leave station empty for user selection
        setData(prev => ({
          ...prev,
          policeStationOfRegistration: {
            mainDivision: value,
            subdivision: "",
            station: ""
          }
        }))
      }
    } else {
      // District with subdivisions
      setData(prev => ({
        ...prev,
        policeStationOfRegistration: {
          mainDivision: value,
          subdivision: "",
          station: ""
        }
      }))
    }
  }

  const handleSubdivisionRegistrationChange = (value: string) => {
    setSelectedSubdivisionRegistration(value)
    setSelectedStationRegistration("")
    setData(prev => ({
      ...prev,
      policeStationOfRegistration: {
        ...prev.policeStationOfRegistration,
        subdivision: value,
        station: ""
      }
    }))
  }

  const handleStationRegistrationChange = (value: string) => {
    setSelectedStationRegistration(value)
    setData(prev => ({
      ...prev,
      policeStationOfRegistration: {
        ...prev.policeStationOfRegistration,
        station: value
      }
    }))
  }

  // Handlers for Assigned Police Station dropdowns
  const handleMainDivAssignedChange = (value: string) => {
    setSelectedMainDivAssigned(value)
    setSelectedSubdivisionAssigned("")
    setSelectedStationAssigned("")
    
    if (value && !hasSubdivisions(value)) {
      // Unit with direct stations (no subdivisions)
      if (hasSingleStation(value)) {
        // Single station unit (like ANC) - auto-fill the station
        const stationName = getDirectStations(value)[0]
        setSelectedStationAssigned(stationName)
        setData(prev => ({
          ...prev,
          assignedPoliceStation: {
            mainDivision: value,
            subdivision: "",
            station: stationName
          }
        }))
      } else {
        // Multiple stations unit (like Coastal Security) - leave station empty for user selection
        setData(prev => ({
          ...prev,
          assignedPoliceStation: {
            mainDivision: value,
            subdivision: "",
            station: ""
          }
        }))
      }
    } else {
      // District with subdivisions
      setData(prev => ({
        ...prev,
        assignedPoliceStation: {
          mainDivision: value,
          subdivision: "",
          station: ""
        }
      }))
    }
  }

  const handleSubdivisionAssignedChange = (value: string) => {
    setSelectedSubdivisionAssigned(value)
    setSelectedStationAssigned("")
    setData(prev => ({
      ...prev,
      assignedPoliceStation: {
        ...prev.assignedPoliceStation,
        subdivision: value,
        station: ""
      }
    }))
  }

  const handleStationAssignedChange = (value: string) => {
    setSelectedStationAssigned(value)
    setData(prev => ({
      ...prev,
      assignedPoliceStation: {
        ...prev.assignedPoliceStation,
        station: value
      }
    }))
  }

  const title = initialData ? "Edit FIR" : "Add New FIR"

  const numberConflict = useMemo(() => {
    const n = data.firNumber.trim()
    if (!n) return false
    if (excludeNumberOnEdit && n === excludeNumberOnEdit) return false
    return existingNumbers.includes(n)
  }, [data.firNumber, existingNumbers, excludeNumberOnEdit])

  const hasAtLeastOnePair = useMemo(() => data.sections.some((r) => r.act.trim() && r.section.trim()), [data.sections])

  const isValid =
    data.firNumber.trim().length > 0 &&
    hasAtLeastOnePair &&
    !!data.filingDate &&
    !!selectedMainDivRegistration &&
    !!selectedStationRegistration &&
    !!selectedMainDivAssigned &&
    !!selectedStationAssigned &&
    !numberConflict

  const handleSave = () => {
    if (!isValid) return
    const cleaned = data.sections
      .map((r) => ({ act: r.act.trim(), section: r.section.trim() }))
      .filter((r) => r.act && r.section)
    onSave({ ...data, sections: cleaned })
  }

  const setCurrentDateTime = () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM format
    setData((prev) => ({ ...prev, filingDate: `${dateStr}T${timeStr}` }))
  }

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      {/* modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FIR Number */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="firNumber">
              {"FIR Number"} <span className="sr-only">{"(required)"}</span>
            </label>
            <input
              id="firNumber"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={data.firNumber}
              onChange={(e) => setData((prev) => ({ ...prev, firNumber: e.target.value }))}
              placeholder="e.g., 129/2025"
              aria-invalid={numberConflict || data.firNumber.trim().length === 0}
              aria-describedby={numberConflict ? "firNumber-conflict" : undefined}
            />
            {numberConflict && (
              <p id="firNumber-conflict" className="text-sm text-destructive">
                {"This FIR Number already exists."}
              </p>
            )}
          </div>

          {/* Police Station of Registration */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              {"Police Station of Registration"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedMainDivRegistration}
                onChange={(e) => handleMainDivRegistrationChange(e.target.value)}
              >
                <option value="">Select Main Division</option>
                {getMainDivisionsForRegistration().map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
              
              {/* Conditional rendering for subdivision dropdown */}
              {selectedMainDivRegistration && hasSubdivisions(selectedMainDivRegistration) && (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedSubdivisionRegistration}
                  onChange={(e) => handleSubdivisionRegistrationChange(e.target.value)}
                >
                  <option value="">Select Subdivision</option>
                  {getSubdivisions(selectedMainDivRegistration).map((subdivision) => (
                    <option key={subdivision} value={subdivision}>
                      {subdivision}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Conditional rendering for station dropdown or disabled input */}
              {selectedMainDivRegistration && (
                <>
                  {hasSubdivisions(selectedMainDivRegistration) ? (
                    // Show station dropdown for districts with subdivisions
                    selectedSubdivisionRegistration && (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedStationRegistration}
                        onChange={(e) => handleStationRegistrationChange(e.target.value)}
                      >
                        <option value="">Select Station</option>
                        {getStations(selectedMainDivRegistration, selectedSubdivisionRegistration).map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    // Show station dropdown for units with multiple stations, disabled input for single station
                    hasSingleStation(selectedMainDivRegistration) ? (
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                        value={selectedStationRegistration}
                        disabled
                        readOnly
                      />
                    ) : (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedStationRegistration}
                        onChange={(e) => handleStationRegistrationChange(e.target.value)}
                      >
                        <option value="">Select Station</option>
                        {getDirectStations(selectedMainDivRegistration).map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                    )
                  )}
                </>
              )}
            </div>
          </div>

          {/* Assigned Police Station */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              {"Assigned Police Station"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedMainDivAssigned}
                onChange={(e) => handleMainDivAssignedChange(e.target.value)}
              >
                <option value="">Select Main Division</option>
                {getMainDivisions().map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
              
              {/* Conditional rendering for subdivision dropdown */}
              {selectedMainDivAssigned && hasSubdivisions(selectedMainDivAssigned) && (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedSubdivisionAssigned}
                  onChange={(e) => handleSubdivisionAssignedChange(e.target.value)}
                >
                  <option value="">Select Subdivision</option>
                  {getSubdivisions(selectedMainDivAssigned).map((subdivision) => (
                    <option key={subdivision} value={subdivision}>
                      {subdivision}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Conditional rendering for station dropdown or disabled input */}
              {selectedMainDivAssigned && (
                <>
                  {hasSubdivisions(selectedMainDivAssigned) ? (
                    // Show station dropdown for districts with subdivisions
                    selectedSubdivisionAssigned && (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedStationAssigned}
                        onChange={(e) => handleStationAssignedChange(e.target.value)}
                      >
                        <option value="">Select Station</option>
                        {getStations(selectedMainDivAssigned, selectedSubdivisionAssigned).map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    // Show station dropdown for units with multiple stations, disabled input for single station
                    hasSingleStation(selectedMainDivAssigned) ? (
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                        value={selectedStationAssigned}
                        disabled
                        readOnly
                      />
                    ) : (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedStationAssigned}
                        onChange={(e) => handleStationAssignedChange(e.target.value)}
                      >
                        <option value="">Select Station</option>
                        {getDirectStations(selectedMainDivAssigned).map((station) => (
                          <option key={station} value={station}>
                            {station}
                          </option>
                        ))}
                      </select>
                    )
                  )}
                </>
              )}
            </div>
          </div>

          {/* Date of Registration */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground" htmlFor="filingDate">
                {"Date of Registration"}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setCurrentDateTime}
                className="h-7 px-2 text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Now
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="filingDate"
                type="date"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.filingDate.split('T')[0] || ''}
                onChange={(e) => {
                  const dateValue = e.target.value
                  const timeValue = data.filingDate.split('T')[1] || '00:00'
                  setData((prev) => ({ ...prev, filingDate: `${dateValue}T${timeValue}` }))
                }}
                required
              />
              <input
                type="time"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.filingDate.split('T')[1] || '00:00'}
                onChange={(e) => {
                  const dateValue = data.filingDate.split('T')[0] || ''
                  const timeValue = e.target.value
                  setData((prev) => ({ ...prev, filingDate: `${dateValue}T${timeValue}` }))
                }}
                required
              />
            </div>
          </div>

          {/* Prescribed Time Limit for Disposal */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">{"Prescribed Time Limit for Disposal"}</span>
            <div className="flex items-center gap-4">
              {[60, 90, 180].map((d) => (
                <label key={d} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="seriousness"
                    value={d}
                    checked={data.seriousnessDays === (d as 60 | 90 | 180)}
                    onChange={() => setData((prev) => ({ ...prev, seriousnessDays: d as 60 | 90 | 180 }))}
                  />
                  {d} {"Days"}
                </label>
              ))}
            </div>
          </div>

          {/* Act(s) & Section(s) */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">{"Act(s) & Section(s)"}</label>
            <div className="space-y-2">
              {data.sections.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder='Act e.g., "IPC", "NDPS Act", "Arms Act"'
                    value={row.act}
                    onChange={(e) => {
                      const next = [...data.sections]
                      next[idx] = { ...next[idx], act: e.target.value }
                      setData((prev) => ({ ...prev, sections: next }))
                    }}
                    aria-label={`Act ${idx + 1}`}
                  />
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder='Section e.g., "302", "8(c)", "25"'
                    value={row.section}
                    onChange={(e) => {
                      const next = [...data.sections]
                      next[idx] = { ...next[idx], section: e.target.value }
                      setData((prev) => ({ ...prev, sections: next }))
                    }}
                    aria-label={`Section ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-3 py-2 text-sm hover:opacity-90"
                    onClick={() => {
                      const next = data.sections.filter((_, i) => i !== idx)
                      // ensure at least one row remains
                      setData((prev) => ({ ...prev, sections: next.length > 0 ? next : [{ act: "IPC", section: "" }] }))
                    }}
                    aria-label={`Remove row ${idx + 1}`}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <Button
                type="button"
                variant="ghost"
                className="bg-secondary text-secondary-foreground hover:opacity-90"
                onClick={() =>
                  setData((prev) => ({ ...prev, sections: [...prev.sections, { act: "IPC", section: "" }] }))
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {"+ Add Section"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {"Add at least one Act/Section pair. Both fields are required for a pair to be saved."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" className="bg-secondary text-secondary-foreground hover:opacity-90" onClick={onClose}>
            {"Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {"Save FIR"}
          </Button>
        </div>
      </div>
    </div>
  )
}
