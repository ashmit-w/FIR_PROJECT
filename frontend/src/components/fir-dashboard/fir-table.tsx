import { Pencil, Trash2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FIR } from "@/components/FirDashboard"

type Props = {
  items: FIR[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDisposal: (id: string) => void
  getDaysRemaining: (filingISO: string, seriousnessDays: number) => number
  getStatus: (filingISO: string, seriousnessDays: number) => "safe" | "warning" | "overdue"
}

export default function FIRTable({ items, onEdit, onDelete, onUpdateDisposal, getDaysRemaining, getStatus }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[1200px] w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {[
              "Status",
              "FIR Number",
              "Act(s) & Section(s)",
              "Police Station",
              "Date of Registration",
              "Disposal Status",
              "Days Remaining",
              "Actions",
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
            <tbody>
              {items.map((row) => {
                const remaining = getDaysRemaining(row.filingDate, row.seriousnessDays)
                const deadline = new Date(new Date(row.filingDate).getTime() + row.seriousnessDays * 24 * 60 * 60 * 1000)
                const status = getStatus(row.filingDate, row.seriousnessDays)
                const statusDot = cn(
                  "h-2.5 w-2.5 rounded-full",
                  status === "safe" && "bg-chart-2",
                  status === "warning" && "bg-chart-5",
                  status === "overdue" && "bg-destructive",
                )
                return (
                  <tr key={row._id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className={statusDot} aria-hidden />
                    <span className="sr-only">{status}</span>
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{row.firNumber}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.sections.map((s, i) => (
                      <span
                        key={`${s.act}-${s.section}-${i}`}
                        className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                      >
                        {`${s.act} ${s.section}`}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{row.policeStation}</td>
                <td className="px-4 py-3">{new Date(row.filingDate).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                    row.disposalStatus === 'Registered' && "bg-yellow-100 text-yellow-800",
                    row.disposalStatus === 'Chargesheeted' && "bg-blue-100 text-blue-800",
                    row.disposalStatus === 'Finalized' && "bg-green-100 text-green-800"
                  )}>
                    {row.disposalStatus}
                  </span>
                </td>
                <td className={cn("px-4 py-3 font-semibold", remaining < 0 && "text-destructive")}>{remaining}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(row._id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 transition-transform hover:scale-105 hover:bg-secondary/90"
                      aria-label={`Edit ${row.firNumber}`}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {row.disposalStatus === 'Registered' && (
                      <button
                        onClick={() => onUpdateDisposal(row._id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 transition-transform hover:scale-105 hover:bg-secondary/90"
                        aria-label={`Update disposal for ${row.firNumber}`}
                        title="Update Disposal"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(row._id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 transition-transform hover:scale-105 hover:bg-secondary/90"
                      aria-label={`Delete ${row.firNumber}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                {"No FIRs match the current filters."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
