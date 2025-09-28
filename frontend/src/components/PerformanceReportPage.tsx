import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { firAPI } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

type UrgencyCategories = {
  'Green': number
  'Yellow': number
  'Orange': number
  'Red': number
  'Red+ (Overdue)': number
}

type StationPerformance = {
  stationId: string
  stationName: string
  stationCode: string
  subdivision: string
  totalUndisposedFIRs: number
  totalChargesheetedFIRs: number
  performancePercentage: number
  urgencyCounts: UrgencyCategories
}

type PerformanceReport = {
  urgencyCategories: UrgencyCategories
  stationPerformance: StationPerformance[]
  summary: {
    totalUndisposedFIRs: number
    totalPoliceStations: number
    averagePerformance: number
  }
}

function PerformanceReportPage() {
  const { user } = useAuth()
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPerformanceReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await firAPI.getPerformanceReport()
      
      if (response.success) {
        setReport(response.data)
      } else {
        setError('Failed to fetch performance report')
      }
    } catch (err: any) {
      console.error('Error fetching performance report:', err)
      setError(err.response?.data?.message || 'Failed to fetch performance report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceReport()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>No performance data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getUrgencyColor = (category: keyof UrgencyCategories) => {
    switch (category) {
      case 'Green': return 'bg-green-100 text-green-800'
      case 'Yellow': return 'bg-yellow-100 text-yellow-800'
      case 'Orange': return 'bg-orange-100 text-orange-800'
      case 'Red': return 'bg-red-100 text-red-800'
      case 'Red+ (Overdue)': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-balance text-2xl md:text-3xl font-semibold">
              FIR Performance Report
            </h1>
            <p className="text-muted-foreground mt-2">
              North Goa District - Police Station Performance Analysis
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {user?.role?.toUpperCase()}
          </Badge>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Undisposed FIRs</p>
                <p className="text-2xl font-bold">{report.summary.totalUndisposedFIRs}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📋</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Police Stations</p>
                <p className="text-2xl font-bold">{report.summary.totalPoliceStations}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">🏢</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Performance</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(report.summary.averagePerformance)}`}>
                  {report.summary.averagePerformance}%
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-medium">📊</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Cases</p>
                <p className="text-2xl font-bold text-red-600">
                  {report.urgencyCategories['Red'] + report.urgencyCategories['Red+ (Overdue)']}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm font-medium">⚠️</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Urgency Categories */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">FIR Urgency Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(report.urgencyCategories).map(([category, count]) => (
              <div key={category} className="text-center">
                <Badge className={`${getUrgencyColor(category as keyof UrgencyCategories)} text-sm font-medium`}>
                  {category}
                </Badge>
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-sm text-muted-foreground">FIRs</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Police Station Performance Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Police Station Performance</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Subdivision</TableHead>
                  <TableHead>Undisposed FIRs</TableHead>
                  <TableHead>Chargesheeted</TableHead>
                  <TableHead>Performance %</TableHead>
                  <TableHead>Urgency Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.stationPerformance.map((station) => (
                  <TableRow key={station.stationId}>
                    <TableCell className="font-medium">{station.stationName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{station.stationCode}</Badge>
                    </TableCell>
                    <TableCell>{station.subdivision}</TableCell>
                    <TableCell className="font-medium">{station.totalUndisposedFIRs}</TableCell>
                    <TableCell className="font-medium">{station.totalChargesheetedFIRs}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${getPerformanceColor(station.performancePercentage)}`}>
                        {station.performancePercentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Object.entries(station.urgencyCounts).map(([category, count]) => (
                          count > 0 && (
                            <Badge
                              key={category}
                              variant="outline"
                              className={`text-xs ${getUrgencyColor(category as keyof UrgencyCategories)}`}
                            >
                              {category}: {count}
                            </Badge>
                          )
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Performance Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>80%+ (Excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>60-79% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span>40-59% (Needs Improvement)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span>&lt;40% (Critical)</span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default PerformanceReportPage
