'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
        const response = await fetch('/api/admin/police-stations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch police stations');
        }
        
        const data = await response.json();
        setPoliceStations(data.data || []);
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

      // Build query parameters
      const params = new URLSearchParams();
      
      if (formData.startDate) {
        params.append('startDate', formData.startDate.toISOString().split('T')[0]);
      }
      
      if (formData.endDate) {
        params.append('endDate', formData.endDate.toISOString().split('T')[0]);
      }
      
      if (formData.statusFilter.length > 0) {
        params.append('statusFilter', formData.statusFilter.join(','));
      }
      
      if (formData.policeStationIds.length > 0) {
        params.append('policeStationIds', formData.policeStationIds.join(','));
      }

      // Call the PDF generation API
      const response = await fetch(`/api/reports/generate-pdf?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF report');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const startDateStr = formData.startDate?.toISOString().split('T')[0] || 'all';
      const endDateStr = formData.endDate?.toISOString().split('T')[0] || 'all';
      
      link.download = `FIR-Performance-Report-${startDateStr}-to-${endDateStr}-${currentDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF report generated and downloaded successfully!',
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF report. Please try again.',
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
            Generate comprehensive PDF reports with performance metrics and analytics
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => handleDateChange('startDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => handleDateChange('endDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                Generate PDF Report
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
      </div>
    </div>
  );
}
