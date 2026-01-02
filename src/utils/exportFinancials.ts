import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer } from '@/contexts/DashboardContext';
import { format } from 'date-fns';

export interface FinancialExportData {
  customers: Customer[];
  totals: {
    totalProjectEstimated: number;
    totalProjectPaid: number;
    totalMaintenanceEstimated: number;
    totalMaintenancePaid: number;
    totalNewReqEstimated: number;
    totalNewReqPaid: number;
  };
}

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
const getRemaining = (estimated: number, paid: number) => Math.max(0, estimated - paid);

export function exportToCSV(data: FinancialExportData, filename: string = 'financial-report') {
  const { customers, totals } = data;
  
  // Header row
  const headers = [
    'Customer',
    'Service Type',
    'Status',
    'Project Estimated ($)',
    'Project Paid ($)',
    'Project Remaining ($)',
    'Maintenance Estimated ($)',
    'Maintenance Paid ($)',
    'Maintenance Remaining ($)',
    'Maintenance Due Date',
    'New Req. Estimated ($)',
    'New Req. Paid ($)',
    'New Req. Remaining ($)',
    'Total Estimated ($)',
    'Total Paid ($)',
    'Total Remaining ($)'
  ];

  // Data rows
  const rows = customers.map(c => {
    const projRem = getRemaining(c.projectPayment.estimatedCost, c.projectPayment.amountPaid);
    const maintRem = getRemaining(c.maintenancePayment.estimatedCost, c.maintenancePayment.amountPaid);
    const newReqRem = getRemaining(c.newRequirementPayment.estimatedCost, c.newRequirementPayment.amountPaid);
    const totalEst = c.projectPayment.estimatedCost + c.maintenancePayment.estimatedCost + c.newRequirementPayment.estimatedCost;
    const totalPaid = c.projectPayment.amountPaid + c.maintenancePayment.amountPaid + c.newRequirementPayment.amountPaid;
    
    return [
      c.companyName,
      c.serviceType,
      c.status,
      c.projectPayment.estimatedCost,
      c.projectPayment.amountPaid,
      projRem,
      c.maintenancePayment.estimatedCost,
      c.maintenancePayment.amountPaid,
      maintRem,
      c.maintenanceDueDate ? format(new Date(c.maintenanceDueDate), 'yyyy-MM-dd') : '',
      c.newRequirementPayment.estimatedCost,
      c.newRequirementPayment.amountPaid,
      newReqRem,
      totalEst,
      totalPaid,
      getRemaining(totalEst, totalPaid)
    ];
  });

  // Add totals row
  const totalRow = [
    'TOTAL',
    '',
    '',
    totals.totalProjectEstimated,
    totals.totalProjectPaid,
    getRemaining(totals.totalProjectEstimated, totals.totalProjectPaid),
    totals.totalMaintenanceEstimated,
    totals.totalMaintenancePaid,
    getRemaining(totals.totalMaintenanceEstimated, totals.totalMaintenancePaid),
    '',
    totals.totalNewReqEstimated,
    totals.totalNewReqPaid,
    getRemaining(totals.totalNewReqEstimated, totals.totalNewReqPaid),
    totals.totalProjectEstimated + totals.totalMaintenanceEstimated + totals.totalNewReqEstimated,
    totals.totalProjectPaid + totals.totalMaintenancePaid + totals.totalNewReqPaid,
    getRemaining(
      totals.totalProjectEstimated + totals.totalMaintenanceEstimated + totals.totalNewReqEstimated,
      totals.totalProjectPaid + totals.totalMaintenancePaid + totals.totalNewReqPaid
    )
  ];

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    totalRow.map(cell => `"${cell}"`).join(',')
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToPDF(data: FinancialExportData, filename: string = 'financial-report') {
  const { customers, totals } = data;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Title
  doc.setFontSize(18);
  doc.text('Wobrexx Financial Report', 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);

  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Summary', 14, 42);
  
  const totalEst = totals.totalProjectEstimated + totals.totalMaintenanceEstimated + totals.totalNewReqEstimated;
  const totalPaid = totals.totalProjectPaid + totals.totalMaintenancePaid + totals.totalNewReqPaid;
  
  doc.setFontSize(10);
  doc.text(`Total Estimated: ${formatCurrency(totalEst)}`, 14, 50);
  doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 80, 50);
  doc.text(`Remaining Balance: ${formatCurrency(getRemaining(totalEst, totalPaid))}`, 150, 50);

  // Table data
  const tableData = customers.map(c => {
    const projRem = getRemaining(c.projectPayment.estimatedCost, c.projectPayment.amountPaid);
    const maintRem = getRemaining(c.maintenancePayment.estimatedCost, c.maintenancePayment.amountPaid);
    const newReqRem = getRemaining(c.newRequirementPayment.estimatedCost, c.newRequirementPayment.amountPaid);
    
    return [
      c.companyName,
      c.serviceType,
      formatCurrency(c.projectPayment.estimatedCost),
      formatCurrency(c.projectPayment.amountPaid),
      formatCurrency(projRem),
      formatCurrency(c.maintenancePayment.estimatedCost),
      formatCurrency(c.maintenancePayment.amountPaid),
      formatCurrency(maintRem),
      formatCurrency(c.newRequirementPayment.estimatedCost),
      formatCurrency(c.newRequirementPayment.amountPaid),
      formatCurrency(newReqRem)
    ];
  });

  // Add table
  autoTable(doc, {
    startY: 58,
    head: [[
      'Customer',
      'Service',
      'Proj. Est.',
      'Proj. Paid',
      'Proj. Rem.',
      'Maint. Est.',
      'Maint. Paid',
      'Maint. Rem.',
      'New Req. Est.',
      'New Req. Paid',
      'New Req. Rem.'
    ]],
    body: tableData,
    foot: [[
      'TOTAL',
      '',
      formatCurrency(totals.totalProjectEstimated),
      formatCurrency(totals.totalProjectPaid),
      formatCurrency(getRemaining(totals.totalProjectEstimated, totals.totalProjectPaid)),
      formatCurrency(totals.totalMaintenanceEstimated),
      formatCurrency(totals.totalMaintenancePaid),
      formatCurrency(getRemaining(totals.totalMaintenanceEstimated, totals.totalMaintenancePaid)),
      formatCurrency(totals.totalNewReqEstimated),
      formatCurrency(totals.totalNewReqPaid),
      formatCurrency(getRemaining(totals.totalNewReqEstimated, totals.totalNewReqPaid))
    ]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [234, 119, 54] }, // Wobrexx orange
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  // Save
  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
