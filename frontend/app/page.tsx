"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import FIRTable from "@/components/fir-dashboard/fir-table"
import FIRModal, { type FIRFormData } from "@/components/fir-dashboard/fir-modal"

type SeriousnessDays = 60 | 90 | 180

export type FIR = {
  id: string
  firNumber: string
  sections: { act: string; section: string }[]
  policeStation: string
  filingDate: string // ISO
  seriousnessDays: SeriousnessDays
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
  if (remaining < 0) return "overdue" as const
  const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(filingISO).getTime()) / MS_PER_DAY))
  const pctElapsed = elapsed / seriousnessDays
  if (pctElapsed >= 0.75) return "warning" as const
  return "safe" as const
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type SeriousnessFilter = "All" | "60 Days" | "90 Days" | "180 Days"
type SortOption = "Days Remaining (Asc)" | "Days Remaining (Desc)" | "Filing Date (Newest)" | "Filing Date (Oldest)"

const STATIONS = ["Panaji", "Mapusa", "Calangute"] as const

export default function Page() {
  const [firs, setFirs] = useState<FIR[]>(() => {
    const now = new Date()
    return [
      {
        id: uid(),
        firNumber: "FIR/2025/001",
        sections: [
          { act: "IPC", section: "302" },
          { act: "IPC", section: "34" },
        ],
        policeStation: "Panaji",
        filingDate: new Date(toISOForInput(addDays(now, -10))).toISOString(),
        seriousnessDays: 60,
      },
      {
        id: uid(),
        firNumber: "FIR/2025/002",
        sections: [{ act: "IPC", section: "137(2)" }],
        policeStation: "Mapusa",
        filingDate: new Date(toISOForInput(addDays(now, -50))).toISOString(),
        seriousnessDays: 60,
      },
      {
        id: uid(),
        firNumber: "FIR/2025/003",
        sections: [{ act: "IPC", section: "420" }],
        policeStation: "Calangute",
        filingDate: new Date(toISOForInput(addDays(now, -70))).toISOString(),
        seriousnessDays: 90,
      },
      {
        id: uid(),
        firNumber: "FIR/2025/004",
        sections: [
          { act: "IPC", section: "186" },
          { act: "IPC", section: "353" },
        ],
        policeStation: "Panaji",
        filingDate: new Date(toISOForInput(addDays(now, -100))).toISOString(),
        seriousnessDays: 90,
      },
      {
        id: uid(),
        firNumber: "FIR/2025/005",
        sections: [{ act: "IPC", section: "379" }],
        policeStation: "Mapusa",
        filingDate: new Date(toISOForInput(addDays(now, -190))).toISOString(),
        seriousnessDays: 180,
      },
    ]
  })

  const [seriousnessFilter, setSeriousnessFilter] = useState<SeriousnessFilter>("All")
  const [stationFilter, setStationFilter] = useState<string>("All Stations")
  const [sortBy, setSortBy] = useState<SortOption>("Days Remaining (Asc)")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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

  const editingItem = useMemo(() => firs.find((f) => f.id === editingId) || null, [editingId, firs])

  const filteredSorted = useMemo(() => {
    let rows = [...firs]
    if (seriousnessFilter !== "All") {
      const days = Number.parseInt(seriousnessFilter) as SeriousnessDays
      rows = rows.filter((r) => r.seriousnessDays === days)
    }
    if (stationFilter !== "All Stations") {
      rows = rows.filter((r) => r.policeStation === stationFilter)
    }
    rows.sort((a, b) => {
      if (sortBy === "Days Remaining (Asc)" || sortBy === "Days Remaining (Desc)") {
        const ra = getDaysRemaining(a.filingDate, a.seriousnessDays)
        const rb = getDaysRemaining(b.filingDate, b.seriousnessDays)
        return sortBy === "Days Remaining (Asc)" ? ra - rb : rb - ra
      }
      if (sortBy === "Filing Date (Newest)" || sortBy === "Filing Date (Oldest)") {
        const ta = new Date(a.filingDate).getTime()
        const tb = new Date(b.filingDate).getTime()
        return sortBy === "Filing Date (Newest)" ? tb - ta : ta - tb
      }
      return 0
    })
    return rows
  }, [firs, seriousnessFilter, stationFilter, sortBy])

  const handleDelete = (id: string) => {
    setFirs((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSave = (data: FIRFormData) => {
    if (editingItem) {
      setFirs((prev) =>
        prev.map((f) =>
          f.id === editingItem.id
            ? {
                ...f,
                firNumber: data.firNumber.trim(),
                sections: data.sections,
                policeStation: data.policeStation,
                filingDate: new Date(data.filingDate).toISOString(),
                seriousnessDays: data.seriousnessDays,
              }
            : f,
        ),
      )
    } else {
      const newItem: FIR = {
        id: uid(),
        firNumber: data.firNumber.trim(),
        sections: data.sections,
        policeStation: data.policeStation,
        filingDate: new Date(data.filingDate).toISOString(),
        seriousnessDays: data.seriousnessDays,
      }
      setFirs((prev) => [newItem, ...prev])
    }
    setModalOpen(false)
  }

  return (
    <main className="min-h-dvh w-full">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-balance text-2xl md:text-3xl font-semibold">
            {"FIR Lifecycle Monitoring Dashboard - North Goa District"}
          </h1>
          <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            {"+ Add New FIR"}
          </Button>
        </header>

        <Card className="border border-border">
          {/* Controls */}
          <section className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter by Seriousness */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">{"Filter by Seriousness"}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={seriousnessFilter}
                  onChange={(e) => setSeriousnessFilter(e.target.value as SeriousnessFilter)}
                  aria-label="Filter by Seriousness"
                >
                  <option>All</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                  <option>180 Days</option>
                </select>
              </div>

              {/* Filter by Police Station */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">{"Filter by Police Station"}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  aria-label="Filter by Police Station"
                >
                  <option>All Stations</option>
                  {Array.from(STATIONS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">{"Sort By"}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort By"
                >
                  <option>Days Remaining (Asc)</option>
                  <option>Days Remaining (Desc)</option>
                  <option>Filing Date (Newest)</option>
                  <option>Filing Date (Oldest)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-sm text-muted-foreground">{"Status Key"}</span>
              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm bg-chart-2" aria-hidden />
                  {"Safe (Under 50% of deadline)"}
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm bg-chart-5" aria-hidden />
                  {"Warning (Approaching Deadline - Over 75% of deadline)"}
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-sm bg-destructive" aria-hidden />
                  {"Overdue (Deadline passed)"}
                </span>
              </div>
            </div>
          </section>

          <Separator className="opacity-60" />

          {/* Table */}
          <section className="p-4">
            <FIRTable
              items={filteredSorted}
              onEdit={openEdit}
              onDelete={handleDelete}
              getDaysRemaining={getDaysRemaining}
              getStatus={getStatus}
            />
          </section>
        </Card>
      </div>

      {/* Modal */}
      <FIRModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialData={
          editingItem
            ? {
                firNumber: editingItem.firNumber,
                sections: editingItem.sections,
                policeStation: editingItem.policeStation,
                filingDate: toISOForInput(new Date(editingItem.filingDate)),
                seriousnessDays: editingItem.seriousnessDays,
              }
            : undefined
        }
        existingNumbers={existingNumbers}
        excludeNumberOnEdit={editingItem?.firNumber}
        stations={Array.from(STATIONS)}
      />
    </main>
  )
}
