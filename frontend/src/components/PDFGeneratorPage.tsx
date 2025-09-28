import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../../hooks/use-toast';
import { firAPI } from '@/services/api';

// Types
interface PoliceStation {
  _id: string;
  name: string;
  code: string;
  subdivision: string;
}

interface FilterFormData {
  startDate: Date | undefined;
  endDate: Date | undefined;
  policeStationIds: string[];
  statusFilter: string[];
}

const DISPOSAL_STATUSES = [
  { value: 'Registered', label: 'Registered' },
  { value: 'Chargesheeted', label: 'Chargesheeted' },
  { value: 'Finalized', label: 'Finalized' }
];

export default function PDFGeneratorPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  
  const [formData, setFormData] = useState<FilterFormData>({
    startDate: undefined,
    endDate: undefined,
    policeStationIds: [],
    statusFilter: ['Registered', 'Chargesheeted', 'Finalized'] // Default to all
  });

  // Fetch police stations on component mount
  useEffect(() => {
    const fetchPoliceStations = async () => {
      try {
        setIsLoadingStations(true);
        // For now, we'll use a mock list since we don't have a dedicated API
        // In a real implementation, you would call: const response = await firAPI.getPoliceStations();
        const mockStations: PoliceStation[] = [
          { _id: '1', name: 'Panaji PS', code: 'PAN', subdivision: 'Panaji' },
          { _id: '2', name: 'Mapusa PS', code: 'MAP', subdivision: 'Mapusa' },
          { _id: '3', name: 'Margao Town PS', code: 'MAR', subdivision: 'Margao' },
          { _id: '4', name: 'Vasco PS', code: 'VAS', subdivision: 'Vasco' },
          { _id: '5', name: 'Ponda PS', code: 'PON', subdivision: 'Ponda' },
          { _id: '6', name: 'ANCPS', code: 'ANC', subdivision: 'ANC' },
          { _id: '7', name: 'CBPS', code: 'CB', subdivision: 'Crime Branch' },
          { _id: '8', name: 'CCPS', code: 'CC', subdivision: 'Cyber Crime' },
          { _id: '9', name: 'WSPS', code: 'WS', subdivision: 'Women Safety' },
          { _id: '10', name: 'BETUL COASTAL PS', code: 'BCP', subdivision: 'Coastal Security' }
        ];
        setPoliceStations(mockStations);
      } catch (error) {
        console.error('Error fetching police stations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load police stations. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingStations(false);
      }
    };

    fetchPoliceStations();
  }, [toast]);

  // Form validation
  const isFormValid = formData.startDate && formData.endDate && formData.statusFilter.length > 0;

  // Handle date changes
  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Handle police station selection
  const handlePoliceStationChange = (stationId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      policeStationIds: checked
        ? [...prev.policeStationIds, stationId]
        : prev.policeStationIds.filter(id => id !== stationId)
    }));
  };

  // Handle status filter changes
  const handleStatusChange = (status: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      statusFilter: checked
        ? [...prev.statusFilter, status]
        : prev.statusFilter.filter(s => s !== status)
    }));
  };

  // Select all police stations
  const handleSelectAllStations = () => {
    setFormData(prev => ({
      ...prev,
      policeStationIds: policeStations.map(station => station._id)
    }));
  };

  // Clear all police station selections
  const handleClearAllStations = () => {
    setFormData(prev => ({
      ...prev,
      policeStationIds: []
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

      // For now, we'll generate a JSON report and show it
      // In a real implementation, you would call the PDF generation API
      const reportData = {
        filters: {
          startDate: formData.startDate?.toISOString().split('T')[0],
          endDate: formData.endDate?.toISOString().split('T')[0],
          statusFilter: formData.statusFilter.join(','),
          policeStationIds: formData.policeStationIds.join(',')
        },
        generatedAt: new Date().toISOString()
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demonstration, we'll download a JSON file instead of PDF
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const startDateStr = formData.startDate?.toISOString().split('T')[0] || 'all';
      const endDateStr = formData.endDate?.toISOString().split('T')[0] || 'all';
      
      link.download = `FIR-Performance-Report-${startDateStr}-to-${endDateStr}-${currentDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report data generated and downloaded successfully! (JSON format for demo)',
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">FIR Performance Report Generator</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports with performance metrics and analytics
          </p>
        </div>

        {/* Filter Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Configure the parameters for your performance report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Police Station Multi-Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Police Stations / Units</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllStations}
                    disabled={isLoadingStations}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllStations}
                    disabled={isLoadingStations}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              {isLoadingStations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading police stations...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-md p-4">
                  {policeStations.map((station) => (
                    <div key={station._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={station._id}
                        checked={formData.policeStationIds.includes(station._id)}
                        onCheckedChange={(checked) => 
                          handlePoliceStationChange(station._id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={station._id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {station.name} ({station.code})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.policeStationIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.policeStationIds.length} station(s) selected
                </p>
              )}
            </div>

            {/* Disposal Status Filter */}
            <div className="space-y-2">
              <Label>Disposal Status Filter</Label>
              <div className="flex flex-wrap gap-4">
                {DISPOSAL_STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={formData.statusFilter.includes(status.value)}
                      onCheckedChange={(checked) => 
                        handleStatusChange(status.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={status.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
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
                  {!formData.startDate && <li>Select a start date</li>}
                  {!formData.endDate && <li>Select an end date</li>}
                  {formData.statusFilter.length === 0 && <li>Select at least one disposal status</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Demo Mode:</p>
              <p>This is a demonstration of the PDF generator interface. In a production environment, this would:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Connect to a real PDF generation API</li>
                <li>Generate actual PDF reports with charts and tables</li>
                <li>Include comprehensive performance metrics</li>
                <li>Support email delivery and scheduling</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
