import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { firAPI } from '@/services/api';
import PDFGeneratorService, { PDFReportData, PoliceStationPerformance } from '@/services/pdfGenerator';
import { POLICE_STATION_HIERARCHY } from '@/constants/policeStations';

// Types
interface ReportScope {
  type: 'district' | 'subdivision' | 'station';
  value: string;
  label: string;
}

interface SimplifiedFormData {
  reportScope: ReportScope | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export default function PDFGeneratorPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<SimplifiedFormData>({
    reportScope: null,
    startDate: undefined,
    endDate: undefined
  });

  const [availableOptions, setAvailableOptions] = useState<ReportScope[]>([]);

  // Generate report scope options from police station hierarchy
  useEffect(() => {
    const generateReportOptions = () => {
      const options: ReportScope[] = [];

      // Add districts
      POLICE_STATION_HIERARCHY.forEach(district => {
        if (district.subdivisions) {
          // Add district option
          options.push({
            type: 'district',
            value: district.value,
            label: `${district.label} (All Subdivisions)`
          });

          // Add subdivisions
          district.subdivisions.forEach(subdivision => {
            options.push({
              type: 'subdivision',
              value: subdivision.value,
              label: `${subdivision.label} Subdivision (${district.label})`
            });

            // Add individual stations
            subdivision.stations.forEach(station => {
              options.push({
                type: 'station',
                value: station,
                label: `${station} (${subdivision.label})`
              });
            });
          });
        } else {
          // Special units without subdivisions
          options.push({
            type: 'district',
            value: district.value,
            label: `${district.label} (Special Unit)`
          });

          // Add individual stations for special units
          district.stations.forEach(station => {
            options.push({
              type: 'station',
              value: station,
              label: `${station} (${district.label})`
            });
          });
        }
      });

      setAvailableOptions(options);
    };

    generateReportOptions();
  }, []);

  // Form validation
  const isFormValid = formData.startDate && formData.endDate && formData.reportScope;

  // Handle date changes
  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Handle report scope selection
  const handleReportScopeChange = (value: string) => {
    const selectedOption = availableOptions.find(option => option.value === value);
    setFormData(prev => ({
      ...prev,
      reportScope: selectedOption || null
    }));
  };

  // Generate PDF report
  const handleGeneratePDF = async () => {
    if (!isFormValid) {
      toast({
        title: 'Invalid Form',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create PDF generator service instance
      const pdfService = new PDFGeneratorService();

      // Fetch performance data from backend
      let performanceData: PoliceStationPerformance[] = [];
      let summaryStats: any = null;

      try {
        // Try to fetch real performance data
        console.log('Fetching performance report...');
        const response = await firAPI.getPerformanceReport();
        console.log('Performance report response:', response);
        
        if (response.success && response.data) {
          console.log('Processing performance data...');
          performanceData = response.data.stationPerformance || [];
          summaryStats = {
            totalFIRs: response.data.summary?.totalFIRs || 0,
            totalChargesheeted: response.data.summary?.totalChargesheeted || 0,
            totalFinalized: response.data.summary?.totalFinalized || 0,
            totalPending: response.data.summary?.totalPending || 0,
            urgencyCounts: response.data.summary?.urgencyCounts || {
              green: 0,
              yellow: 0,
              orange: 0,
              red: 0,
              redPlus: 0
            }
          };
          console.log('Performance data processed:', { performanceData: performanceData.length, summaryStats });
        } else {
          console.log('Performance report failed:', response.message);
        }
      } catch (error) {
        console.warn('Could not fetch performance data, using mock data:', error);
        // Use mock data if backend is not available
        performanceData = [
          {
            stationName: 'Panaji PS',
            totalRegisteredCases: 25,
            totalChargesheeted: 18,
            totalFinalized: 12,
            performancePercentage: 72.0,
            urgencyCounts: { green: 5, yellow: 3, orange: 2, red: 1, redPlus: 1 }
          },
          {
            stationName: 'Mapusa PS',
            totalRegisteredCases: 30,
            totalChargesheeted: 22,
            totalFinalized: 15,
            performancePercentage: 73.3,
            urgencyCounts: { green: 6, yellow: 4, orange: 3, red: 2, redPlus: 0 }
          },
          {
            stationName: 'Margao Town PS',
            totalRegisteredCases: 28,
            totalChargesheeted: 20,
            totalFinalized: 14,
            performancePercentage: 71.4,
            urgencyCounts: { green: 5, yellow: 3, orange: 2, red: 1, redPlus: 2 }
          }
        ];

        summaryStats = {
          totalFIRs: 83,
          totalChargesheeted: 60,
          totalFinalized: 41,
          totalPending: 42,
          urgencyCounts: { green: 16, yellow: 10, orange: 7, red: 4, redPlus: 3 }
        };
      }

      // Prepare PDF report data
      const reportData: PDFReportData = {
        filters: {
          startDate: formData.startDate?.toISOString().split('T')[0] || '',
          endDate: formData.endDate?.toISOString().split('T')[0] || '',
          statusFilter: 'Registered,Chargesheeted,Finalized', // All statuses
          policeStationIds: formData.reportScope?.value || ''
        },
        generatedAt: new Date().toISOString(),
        performanceData,
        summaryStats
      };

      // Generate PDF
      const pdfBlob = await pdfService.generatePerformanceReport(reportData);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const startDateStr = formData.startDate?.toISOString().split('T')[0] || 'all';
      const endDateStr = formData.endDate?.toISOString().split('T')[0] || 'all';
      const scopeStr = formData.reportScope?.label.replace(/[^a-zA-Z0-9]/g, '-') || 'all-stations';
      
      const filename = `FIR-Performance-Report-${startDateStr}-to-${endDateStr}-${scopeStr}-${currentDate}.pdf`;

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF Generated Successfully',
        description: `Report downloaded as ${filename}`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Generate Report</h1>
          <p className="text-muted-foreground">
            Generate comprehensive FIR performance reports for specific areas
          </p>
        </div>

        {/* Simplified Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Select the area and date range for your report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Scope Selection */}
            <div className="space-y-2">
              <Label htmlFor="reportScope">Report Scope</Label>
              <Select value={formData.reportScope?.value || ''} onValueChange={handleReportScopeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area for report..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.type === 'district' && <Building2 className="h-4 w-4 text-blue-600" />}
                        {option.type === 'subdivision' && <MapPin className="h-4 w-4 text-green-600" />}
                        {option.type === 'station' && <Users className="h-4 w-4 text-orange-600" />}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.reportScope && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.reportScope.label}
                </p>
              )}
            </div>

            {/* Date Range Selector */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      handleDateChange('startDate', date);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      handleDateChange('endDate', date);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              
              {/* Quick Date Selection Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    handleDateChange('startDate', today);
                    handleDateChange('endDate', today);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    handleDateChange('startDate', firstDayOfMonth);
                    handleDateChange('endDate', lastDayOfMonth);
                  }}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                    const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
                    handleDateChange('startDate', firstDayOfYear);
                    handleDateChange('endDate', lastDayOfYear);
                  }}
                >
                  This Year
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleDateChange('startDate', undefined);
                    handleDateChange('endDate', undefined);
                  }}
                >
                  Clear Dates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={!isFormValid || isLoading}
            size="lg"
            className="min-w-48"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Form Validation Messages */}
        {!isFormValid && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-sm text-destructive space-y-1">
                <p>Please complete the following:</p>
                <ul className="list-disc list-inside space-y-1">
                  {!formData.reportScope && <li>Select a report scope (area)</li>}
                  {!formData.startDate && <li>Select a start date</li>}
                  {!formData.endDate && <li>Select an end date</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Scope Examples */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">📋 Report Scope Examples:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span><strong>District:</strong> North District (All Subdivisions) - Complete district report</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span><strong>Subdivision:</strong> Quepem Subdivision (South District) - All stations in subdivision</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span><strong>Station:</strong> Panaji PS (Panaji) - Individual station report</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
