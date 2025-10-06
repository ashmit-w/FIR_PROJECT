import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Loader2, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, Building2, Calendar, Users } from 'lucide-react'
import { reportAPI } from '@/services/api'

interface PerformanceReport {
  reportGeneratedAt: string
  reportPeriod: {
    startDate: string
    endDate: string
  }
  overview: {
    totalFIRs: number
    registeredFIRs: number
    chargesheetedFIRs: number
    finalizedFIRs: number
    overdueFIRs: number
    completionRate: number
    overdueRate: number
  }
  policeStationPerformance: Array<{
    name: string
    code: string
    subdivision: string
    totalFIRs: number
    registeredFIRs: number
    chargesheetedFIRs: number
    finalizedFIRs: number
    completionRate: number
  }>
  monthlyTrends: Array<{
    _id: { year: number; month: number }
    totalFIRs: number
    registeredFIRs: number
    chargesheetedFIRs: number
    finalizedFIRs: number
  }>
  recentFIRs: Array<{
    firNumber: string
    filingDate: string
    disposalStatus: string
    policeStation: string
    createdBy: string
  }>
  availablePoliceStations: Array<{
    id: string
    name: string
    code: string
    subdivision: string
  }>
}

interface FIRReport {
  firs: Array<{
    _id: string
    firNumber: string
    sections: Array<{ act: string; section: string }>
    policeStation: string
    filingDate: string
    disposalStatus: string
    disposalDate?: string
    disposalDueDate: string
    seriousnessDays: number
    description: string
    createdBy: string
    assignedTo: string
    daysRemaining: number
    disposalUrgencyStatus: string
    createdAt: string
    updatedAt: string
  }>
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    startDate?: string
    endDate?: string
    policeStationId?: string
    disposalStatus?: string
  }
}

export default function ReportGeneratorPage() {
  const [activeTab, setActiveTab] = useState('performance')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Performance Report State
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null)
  const [performanceFilters, setPerformanceFilters] = useState({
    startDate: '',
    endDate: '',
    policeStationId: 'all'
  })
  
  // FIR Report State
  const [firReport, setFirReport] = useState<FIRReport | null>(null)
  const [firFilters, setFirFilters] = useState({
    startDate: '',
    endDate: '',
    policeStationId: 'all',
    disposalStatus: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  
  // Available options
  const [policeStations, setPoliceStations] = useState<Array<{id: string, name: string, code: string, subdivision: string}>>([])

  const disposalStatusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Registered', label: 'Registered' },
    { value: 'Chargesheeted', label: 'Chargesheeted' },
    { value: 'Finalized', label: 'Finalized' }
  ]

  useEffect(() => {
    // Load police stations when component mounts
    loadPoliceStations()
  }, [])

  const loadPoliceStations = async () => {
    try {
      const response = await reportAPI.getPerformanceReport()
      if (response.success && response.data.availablePoliceStations) {
        setPoliceStations(response.data.availablePoliceStations)
      }
    } catch (error) {
      console.error('Error loading police stations:', error)
    }
  }

  const generatePerformanceReport = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await reportAPI.getPerformanceReport(performanceFilters)
      if (response.success) {
        setPerformanceReport(response.data)
      } else {
        setError(response.message || 'Failed to generate performance report')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate performance report')
    } finally {
      setLoading(false)
    }
  }

  const generateFIRReport = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await reportAPI.getFIRReport({
        ...firFilters,
        page: currentPage,
        limit: 20
      })
      
      if (response.success) {
        setFirReport(response.data)
      } else {
        setError(response.message || 'Failed to generate FIR report')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate FIR report')
    } finally {
      setLoading(false)
    }
  }

  const downloadPerformanceReport = () => {
    if (!performanceReport) return
    
    const reportData = {
      title: 'FIRMMS - Performance Report',
      generatedAt: new Date(performanceReport.reportGeneratedAt).toLocaleString(),
      period: `${performanceReport.reportPeriod.startDate} to ${performanceReport.reportPeriod.endDate}`,
      overview: performanceReport.overview,
      stationPerformance: performanceReport.policeStationPerformance,
      monthlyTrends: performanceReport.monthlyTrends
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadFIRReport = () => {
    if (!firReport) return
    
    const reportData = {
      title: 'FIRMMS - FIR Report',
      generatedAt: new Date().toLocaleString(),
      filters: firReport.filters,
      pagination: firReport.pagination,
      firs: firReport.firs
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fir-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registered': return 'bg-blue-100 text-blue-800'
      case 'Chargesheeted': return 'bg-green-100 text-green-800'
      case 'Finalized': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Red': return 'bg-red-100 text-red-800'
      case 'Yellow': return 'bg-yellow-100 text-yellow-800'
      case 'Green': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Generator</h1>
          <p className="text-muted-foreground">Generate comprehensive reports for FIR management</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="performance">Performance Report</TabsTrigger>
          <TabsTrigger value="firs">FIR Report</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Report Filters
              </CardTitle>
              <CardDescription>Configure filters for the performance report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perf-start-date">Start Date</Label>
                  <Input
                    id="perf-start-date"
                    type="date"
                    value={performanceFilters.startDate}
                    onChange={(e) => setPerformanceFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perf-end-date">End Date</Label>
                  <Input
                    id="perf-end-date"
                    type="date"
                    value={performanceFilters.endDate}
                    onChange={(e) => setPerformanceFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perf-police-station">Police Station</Label>
                  <Select
                    value={performanceFilters.policeStationId}
                    onValueChange={(value) => setPerformanceFilters(prev => ({ ...prev, policeStationId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select police station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Police Stations</SelectItem>
                      {policeStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} ({station.subdivision})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={generatePerformanceReport} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Generate Performance Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {performanceReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Performance Report</h2>
                <Button onClick={downloadPerformanceReport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Total FIRs</p>
                        <p className="text-2xl font-bold">{performanceReport.overview.totalFIRs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">{performanceReport.overview.completionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Overdue FIRs</p>
                        <p className="text-2xl font-bold">{performanceReport.overview.overdueFIRs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Overdue Rate</p>
                        <p className="text-2xl font-bold">{performanceReport.overview.overdueRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Registered</p>
                      <p className="text-2xl font-bold text-blue-800">{performanceReport.overview.registeredFIRs}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Chargesheeted</p>
                      <p className="text-2xl font-bold text-green-800">{performanceReport.overview.chargesheetedFIRs}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Finalized</p>
                      <p className="text-2xl font-bold text-purple-800">{performanceReport.overview.finalizedFIRs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Police Station Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Police Station Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Station</th>
                          <th className="text-center p-2">Total</th>
                          <th className="text-center p-2">Registered</th>
                          <th className="text-center p-2">Chargesheeted</th>
                          <th className="text-center p-2">Finalized</th>
                          <th className="text-center p-2">Completion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceReport.policeStationPerformance.map((station, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{station.name}</p>
                                <p className="text-sm text-muted-foreground">{station.subdivision}</p>
                              </div>
                            </td>
                            <td className="text-center p-2">{station.totalFIRs}</td>
                            <td className="text-center p-2">{station.registeredFIRs}</td>
                            <td className="text-center p-2">{station.chargesheetedFIRs}</td>
                            <td className="text-center p-2">{station.finalizedFIRs}</td>
                            <td className="text-center p-2">
                              <Badge variant="outline" className={station.completionRate >= 80 ? 'bg-green-100 text-green-800' : station.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {station.completionRate}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Recent FIRs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent FIRs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performanceReport.recentFIRs.map((fir, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{fir.firNumber}</p>
                          <p className="text-sm text-muted-foreground">{fir.policeStation} • {fir.createdBy}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(fir.disposalStatus)}>
                            {fir.disposalStatus}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(fir.filingDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="firs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                FIR Report Filters
              </CardTitle>
              <CardDescription>Configure filters for the detailed FIR report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fir-start-date">Start Date</Label>
                  <Input
                    id="fir-start-date"
                    type="date"
                    value={firFilters.startDate}
                    onChange={(e) => setFirFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fir-end-date">End Date</Label>
                  <Input
                    id="fir-end-date"
                    type="date"
                    value={firFilters.endDate}
                    onChange={(e) => setFirFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fir-police-station">Police Station</Label>
                  <Select
                    value={firFilters.policeStationId}
                    onValueChange={(value) => setFirFilters(prev => ({ ...prev, policeStationId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select police station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Police Stations</SelectItem>
                      {policeStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} ({station.subdivision})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fir-status">Disposal Status</Label>
                  <Select
                    value={firFilters.disposalStatus}
                    onValueChange={(value) => setFirFilters(prev => ({ ...prev, disposalStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {disposalStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={generateFIRReport} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate FIR Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {firReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">FIR Report</h2>
                <Button onClick={downloadFIRReport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>FIR Details</CardTitle>
                  <CardDescription>
                    Showing {firReport.firs.length} of {firReport.pagination.totalCount} FIRs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {firReport.firs.map((fir) => (
                      <div key={fir._id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{fir.firNumber}</h3>
                            <p className="text-sm text-muted-foreground">{fir.policeStation}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(fir.disposalStatus)}>
                              {fir.disposalStatus}
                            </Badge>
                            <Badge className={`ml-2 ${getUrgencyColor(fir.disposalUrgencyStatus)}`}>
                              {fir.disposalUrgencyStatus}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Sections</p>
                            <p className="text-muted-foreground">
                              {fir.sections.map(s => `${s.act} ${s.section}`).join(', ')}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Filing Date</p>
                            <p className="text-muted-foreground">
                              {new Date(fir.filingDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Days Remaining</p>
                            <p className="text-muted-foreground">{fir.daysRemaining}</p>
                          </div>
                          <div>
                            <p className="font-medium">Created By</p>
                            <p className="text-muted-foreground">{fir.createdBy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {firReport.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Page {firReport.pagination.currentPage} of {firReport.pagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1))
                            generateFIRReport()
                          }}
                          disabled={!firReport.pagination.hasPrevPage}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPage(prev => prev + 1)
                            generateFIRReport()
                          }}
                          disabled={!firReport.pagination.hasNextPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
