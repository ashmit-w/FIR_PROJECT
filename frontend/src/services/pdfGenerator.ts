import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types for PDF generation
export interface PDFReportData {
  filters: {
    startDate: string;
    endDate: string;
    statusFilter: string;
    policeStationIds: string;
  };
  generatedAt: string;
  performanceData?: any[];
  summaryStats?: {
    totalFIRs: number;
    totalChargesheeted: number;
    totalFinalized: number;
    totalPending: number;
    urgencyCounts: {
      green: number;
      yellow: number;
      orange: number;
      red: number;
      redPlus: number;
    };
  };
}

export interface PoliceStationPerformance {
  stationName: string;
  totalRegisteredCases: number;
  totalChargesheeted: number;
  totalFinalized: number;
  performancePercentage: number;
  urgencyCounts: {
    green: number;
    yellow: number;
    orange: number;
    red: number;
    redPlus: number;
  };
}

class PDFGeneratorService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private primaryColor: [number, number, number] = [0, 51, 102]; // Dark blue
  private secondaryColor: [number, number, number] = [0, 102, 204]; // Blue
  private accentColor: [number, number, number] = [255, 140, 0]; // Orange
  private successColor: [number, number, number] = [0, 128, 0]; // Green
  private dangerColor: [number, number, number] = [220, 20, 60]; // Red

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  // Generate PDF from report data
  async generatePerformanceReport(data: PDFReportData): Promise<Blob> {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.currentY = this.margin;

    // Add header with logo area
    this.addEnhancedHeader();
    
    // Add executive summary
    this.addExecutiveSummary(data);
    
    // Add report metadata
    this.addReportMetadata(data);
    
    // Add summary statistics with charts
    if (data.summaryStats) {
      this.addSummaryStatistics(data.summaryStats);
    }
    
    // Add urgency analysis
    if (data.summaryStats) {
      this.addUrgencyAnalysis(data.summaryStats.urgencyCounts);
    }
    
    // Add performance data table
    if (data.performanceData && data.performanceData.length > 0) {
      this.addPerformanceTable(data.performanceData);
    }
    
    // Add recommendations
    // this.addRecommendations(data); // Removed recommendations section as requested
    
    // Add footer
    this.addEnhancedFooter();

    // Generate blob
    const pdfBlob = this.doc.output('blob');
    return pdfBlob;
  }

  // Generate PDF from HTML element (alternative method)
  async generatePDFFromHTML(elementId: string, filename: string): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Generate canvas from HTML
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  }

  private addEnhancedHeader(): void {
    // Background rectangle
    this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Title with white text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FIR PERFORMANCE REPORT', this.pageWidth / 2, 18, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Goa Police Department - Performance Analytics', this.pageWidth / 2, 25, { align: 'center' });
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    this.currentY = 45;
  }

  private addExecutiveSummary(data: PDFReportData): void {
    // Section header
    this.addSectionHeader('EXECUTIVE SUMMARY', this.currentY);
    this.currentY += 15;

    // Summary box
    this.doc.setFillColor(240, 248, 255);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
    this.doc.setDrawColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'S');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('This report provides a comprehensive analysis of FIR disposal performance across all police stations', this.margin + 5, this.currentY + 8);
    this.doc.text('in Goa for the specified period. Key metrics include disposal rates, urgency analysis, and', this.margin + 5, this.currentY + 12);
    this.doc.text('station-wise performance comparisons.', this.margin + 5, this.currentY + 16);

    this.currentY += 35;
  }

  private addReportMetadata(data: PDFReportData): void {
    this.addSectionHeader('REPORT PARAMETERS', this.currentY);
    this.currentY += 15;

    // Create a table-like layout for metadata
    const metadata = [
      ['Report Period', `${this.formatDate(data.filters.startDate)} to ${this.formatDate(data.filters.endDate)}`],
      ['Status Filter', data.filters.statusFilter],
      ['Police Stations', data.filters.policeStationIds || 'All Stations'],
      ['Generated On', this.formatDateTime(data.generatedAt)],
      ['Report Type', 'Performance Analytics']
    ];

    metadata.forEach(([label, value], index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - 2 * this.margin, 8, 'F');
      }

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label + ':', this.margin + 5, this.currentY + 2);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, this.margin + 50, this.currentY + 2);
      this.currentY += 8;
    });

    this.currentY += 10;
  }

  private addSummaryStatistics(stats: any): void {
    this.addSectionHeader('SUMMARY STATISTICS', this.currentY);
    this.currentY += 15;

    // Create summary cards
    const cardWidth = (this.pageWidth - 2 * this.margin - 20) / 4;
    const cardHeight = 20;
    const cards = [
      { label: 'Total FIRs', value: stats.totalFIRs, color: this.primaryColor },
      { label: 'Chargesheeted', value: stats.totalChargesheeted, color: this.successColor },
      { label: 'Finalized', value: stats.totalFinalized, color: this.accentColor },
      { label: 'Pending', value: stats.totalPending, color: this.dangerColor }
    ];

    cards.forEach((card, index) => {
      const x = this.margin + index * (cardWidth + 5);
      
      // Card background
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.rect(x, this.currentY, cardWidth, cardHeight, 'F');
      
      // Card border
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.2);
      this.doc.rect(x, this.currentY, cardWidth, cardHeight, 'S');
      
      // Card text
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value.toString(), x + cardWidth/2, this.currentY + 8, { align: 'center' });
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(card.label, x + cardWidth/2, this.currentY + 15, { align: 'center' });
    });

    this.currentY += cardHeight + 15;
  }

  private addUrgencyAnalysis(urgencyCounts: any): void {
    this.addSectionHeader('URGENCY ANALYSIS', this.currentY);
    this.currentY += 15;

    // Urgency chart
    const chartWidth = this.pageWidth - 2 * this.margin;
    const chartHeight = 30;
    const chartX = this.margin;
    const chartY = this.currentY;

    // Chart background
    this.doc.setFillColor(250, 250, 250);
    this.doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');

    // Chart title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Case Urgency Distribution', chartX + 5, chartY + 8);

    // Urgency bars
    const urgencyData = [
      { label: 'Green (>15 days)', count: urgencyCounts.green, color: [0, 128, 0] },
      { label: 'Yellow (≤15 days)', count: urgencyCounts.yellow, color: [255, 255, 0] },
      { label: 'Orange (≤10 days)', count: urgencyCounts.orange, color: [255, 140, 0] },
      { label: 'Red (≤5 days)', count: urgencyCounts.red, color: [255, 0, 0] },
      { label: 'Red+ (Overdue)', count: urgencyCounts.redPlus, color: [128, 0, 0] }
    ];

    const totalCases = urgencyData.reduce((sum, item) => sum + item.count, 0);
    const barWidth = (chartWidth - 40) / urgencyData.length;
    const maxBarHeight = chartHeight - 20;

    urgencyData.forEach((item, index) => {
      const barX = chartX + 20 + index * barWidth;
      const barHeight = totalCases > 0 ? (item.count / Math.max(...urgencyData.map(d => d.count))) * maxBarHeight : 0;
      const barY = chartY + chartHeight - barHeight - 5;

      // Bar
      this.doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      this.doc.rect(barX, barY, barWidth - 2, barHeight, 'F');

      // Label
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.count.toString(), barX + barWidth/2, barY - 2, { align: 'center' });
      this.doc.text(item.label, barX + barWidth/2, chartY + chartHeight - 2, { align: 'center' });
    });

    this.currentY += chartHeight + 20;
  }

  private addPerformanceTable(data: PoliceStationPerformance[]): void {
    this.addSectionHeader('POLICE STATION PERFORMANCE', this.currentY);
    this.currentY += 15;

    // Table headers
    const headers = ['Station Name', 'Total Cases', 'Chargesheeted', 'Finalized', 'Performance %', 'Status'];
    const colWidths = [45, 20, 25, 20, 25, 25];
    let xPosition = this.margin;

    // Header background
    this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 12, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      this.doc.text(header, xPosition + 2, this.currentY + 2);
      xPosition += colWidths[index];
    });

    this.currentY += 12;

    // Table data
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);

    data.forEach((station, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - 2 * this.margin, 10, 'F');
      }

      xPosition = this.margin;
      const performanceStatus = station.performancePercentage >= 70 ? 'Excellent' : 
                               station.performancePercentage >= 50 ? 'Good' : 
                               station.performancePercentage >= 30 ? 'Fair' : 'Poor';
      
      const rowData = [
        station.stationName,
        station.totalRegisteredCases.toString(),
        station.totalChargesheeted.toString(),
        station.totalFinalized.toString(),
        `${station.performancePercentage.toFixed(1)}%`,
        performanceStatus
      ];

      rowData.forEach((cell, index) => {
        this.doc.text(cell, xPosition + 2, this.currentY + 2);
        xPosition += colWidths[index];
      });

      this.currentY += 10;
    });

    this.currentY += 15;
  }

  private addRecommendations(data: PDFReportData): void {
    this.addSectionHeader('RECOMMENDATIONS', this.currentY);
    this.currentY += 15;

    const recommendations = [
      '• Focus on reducing overdue cases (Red+ category) through priority case management',
      '• Implement automated alerts for cases approaching disposal deadlines',
      '• Provide additional training for stations with performance below 50%',
      '• Establish weekly review meetings for cases in Red and Orange categories',
      '• Consider resource reallocation to high-volume stations'
    ];

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);

    recommendations.forEach((rec) => {
      this.doc.text(rec, this.margin + 5, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  private addEnhancedFooter(): void {
    const footerY = this.pageHeight - 20;
    
    // Footer line
    this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    
    this.doc.text('Generated by FIRMMS - Goa Police Department', this.margin, footerY);
    this.doc.text(`Page ${this.doc.getCurrentPageInfo().pageNumber}`, 
      this.pageWidth - this.margin, footerY, { align: 'right' });
  }

  private addSectionHeader(title: string, y: number): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text(title, this.margin, y);
    
    // Underline
    this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, y + 2, this.margin + 50, y + 2);
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  private formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB');
  }

  // Download PDF with filename
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default PDFGeneratorService;
