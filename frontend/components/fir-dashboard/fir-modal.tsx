"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"

export type FIRFormData = {
  firNumber: string
  sections: { act: string; section: string }[]
  policeStation: string
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
  stations: string[]
}

export default function FIRModal({
  open,
  onClose,
  onSave,
  initialData,
  existingNumbers,
  excludeNumberOnEdit,
  stations,
}: Props) {
  const [data, setData] = useState<FIRFormData>(() => ({
    firNumber: "",
    sections: [{ act: "IPC", section: "" }],
    policeStation: stations[0] ?? "Panaji",
    filingDate: "",
    seriousnessDays: 60,
  }))

  useEffect(() => {
    if (open) {
      if (initialData) setData(initialData)
      else
        setData({
          firNumber: "",
          sections: [{ act: "IPC", section: "" }],
          policeStation: stations[0] ?? "Panaji",
          filingDate: "",
          seriousnessDays: 60,
        })
    }
  }, [open, initialData, stations])

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
    !!data.policeStation &&
    !numberConflict

  const handleSave = () => {
    if (!isValid) return
    const cleaned = data.sections
      .map((r) => ({ act: r.act.trim(), section: r.section.trim() }))
      .filter((r) => r.act && r.section)
    onSave({ ...data, sections: cleaned })
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
              placeholder="e.g., FIR/2025/123"
              aria-invalid={numberConflict || data.firNumber.trim().length === 0}
              aria-describedby={numberConflict ? "firNumber-conflict" : undefined}
            />
            {numberConflict && (
              <p id="firNumber-conflict" className="text-sm text-destructive">
                {"This FIR Number already exists."}
              </p>
            )}
          </div>

          {/* Police Station */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="policeStation">
              {"Police Station"}
            </label>
            <select
              id="policeStation"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={data.policeStation}
              onChange={(e) => setData((prev) => ({ ...prev, policeStation: e.target.value }))}
            >
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filing Date & Time */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="filingDate">
              {"Time of Filing"}
            </label>
            <input
              id="filingDate"
              type="datetime-local"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={data.filingDate}
              onChange={(e) => setData((prev) => ({ ...prev, filingDate: e.target.value }))}
              required
            />
          </div>

          {/* Seriousness */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">{"Seriousness"}</span>
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
