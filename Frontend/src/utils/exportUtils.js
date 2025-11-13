import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export utilities with fallback support for jsPDF autoTable
 * If autoTable plugin fails to load, falls back to simple text tables
 * 
 * Note: Uses "Rs." instead of ₹ symbol to avoid PDF encoding issues
 */

/**
 * Export dashboard data to PDF with error handling
 */
export const exportToPDF = (data, title = 'Dashboard Report') => {
  try {


    // Validate data
    if (!data || typeof data !== 'object') {
      console.error('Invalid data provided for PDF export');
      throw new Error('Invalid data provided for PDF export');
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Helper function to wrap text within a given width
    const wrapText = (text, maxWidth, fontSize = 9) => {
      doc.setFontSize(fontSize);
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = doc.getTextWidth(testLine);

        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    // Helper function to safely use autoTable with fallback
    const safeAutoTable = (options) => {
      if (typeof doc.autoTable === 'function') {
        doc.autoTable(options);
        return doc.lastAutoTable ? doc.lastAutoTable.finalY : options.startY + 50;
      } else {
        // Fallback: Add simple text table with proper layout
        let currentY = options.startY;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const availableWidth = pageWidth - (margin * 2);

        // Calculate column widths based on number of columns and content type
        const numColumns = options.head && options.head[0] ? options.head[0].length : 2;
        let columnWidths = [];

        // Special handling for different table types
        if (options.head && options.head[0]) {
          const headers = options.head[0];
          if (headers.includes('Course Name') && headers.includes('Price')) {
            // Courses table - custom widths
            columnWidths = [
              availableWidth * 0.4,
              availableWidth * 0.15,
              availableWidth * 0.15,
              availableWidth * 0.15,
              availableWidth * 0.15
            ];
          } else {
            // Default equal distribution
            const columnWidth = availableWidth / numColumns;
            columnWidths = Array(numColumns).fill(columnWidth);
          }
        } else {
          const columnWidth = availableWidth / numColumns;
          columnWidths = Array(numColumns).fill(columnWidth);
        }

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');

        // Add headers
        if (options.head && options.head[0]) {
          const headers = options.head[0];
          let currentX = margin;
          headers.forEach((header, index) => {
            const colWidth = columnWidths[index] || (availableWidth / numColumns);
            // Truncate long headers to fit
            const maxChars = Math.floor(colWidth / 3);
            const truncatedHeader = header.length > maxChars ? header.substring(0, maxChars - 3) + '...' : header;
            doc.text(truncatedHeader, currentX, currentY);
            currentX += colWidth;
          });
          currentY += 8;

          // Add separator line
          doc.setLineWidth(0.1);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 5;
        }

        // Add body rows
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        if (options.body) {
          options.body.forEach(row => {
            // Check if we need a new page
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }

            let currentX = margin;
            let maxRowHeight = 0;


            row.forEach((cell, index) => {
              const colWidth = columnWidths[index] || (availableWidth / numColumns);
              const cellText = String(cell);
              const lines = wrapText(cellText, colWidth - 2, 9);
              maxRowHeight = Math.max(maxRowHeight, lines.length);
            });


            currentX = margin;
            row.forEach((cell, index) => {
              const colWidth = columnWidths[index] || (availableWidth / numColumns);
              const cellText = String(cell);
              const lines = wrapText(cellText, colWidth - 2, 9);


              lines.forEach((line, lineIndex) => {
                doc.text(line, currentX, currentY + (lineIndex * 4));
              });

              currentX += colWidth;
            });


            currentY += Math.max(6, maxRowHeight * 4);
            currentY += 6;
          });
        }

        return currentY + 10;
      }
    };


    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date();
    const dateString = `Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}`;
    doc.text(dateString, 20, 35);

    let yPosition = 50;

    // Add executive summary
    if (data.stats && typeof data.stats === 'object') {
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Executive Summary', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      const summaryText = [
        `Total Platform Users: ${(data.stats.totalUsers || 0).toLocaleString()}`,
        `Active Courses: ${(data.stats.activeCourses || 0).toLocaleString()}`,
        `Total Revenue: Rs.${(data.stats.totalRevenue || 0).toLocaleString()}`,
        `Total Orders: ${(data.stats.totalOrders || 0).toLocaleString()}`
      ];

      summaryText.forEach(text => {
        doc.text(text, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 15;
    }


    if (data.stats && typeof data.stats === 'object') {

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Detailed Statistics', 20, yPosition);
      yPosition += 10;

      const statsData = Object.entries(data.stats)
        .filter(([key, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          typeof value === 'number' ?
            (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount') ?
              `Rs.${value.toLocaleString()}` : value.toLocaleString())
            : String(value)
        ]);

      if (statsData.length > 0) {
        yPosition = safeAutoTable({
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: statsData,
          theme: 'striped',
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 12,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            textColor: [40, 40, 40]
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 20, right: 20 }
        }) + 20;
      }
    }

    // Add revenue data if available
    if (data.revenueData && Array.isArray(data.revenueData) && data.revenueData.length > 0) {


      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Revenue Overview', 20, yPosition);
      yPosition += 10;

      const revenueTableData = data.revenueData
        .filter(item => item && typeof item === 'object')
        .map(item => [
          item.name || item.month || item.period || 'N/A',
          `Rs.${(item.uv || item.revenue || 0).toLocaleString()}`,
          `Rs.${(item.pv || item.profit || Math.round((item.uv || item.revenue || 0) * 0.7)).toLocaleString()}`
        ]);

      if (revenueTableData.length > 0) {
        yPosition = safeAutoTable({
          startY: yPosition,
          head: [['Period', 'Revenue', 'Profit']],
          body: revenueTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontSize: 12,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            textColor: [40, 40, 40]
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 20, right: 20 }
        }) + 20;
      }
    }

    // Add courses data if available
    if (data.coursesData && Array.isArray(data.coursesData) && data.coursesData.length > 0) {


      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Courses Overview', 20, yPosition);
      yPosition += 10;

      const coursesTableData = data.coursesData
        .filter(course => course && typeof course === 'object')
        .slice(0, 20)
        .map(course => [
          (course.title || course.name || 'Untitled').substring(0, 30) +
          ((course.title || course.name || '').length > 30 ? '...' : ''),
          String(course.enrolled_count || course.students || 0),
          course.average_rating ? course.average_rating.toFixed(1) : 'N/A',
          course.price ? `Rs.${course.price.toLocaleString()}` : 'Free',
          (course.listed !== undefined ? (course.listed ? 'Active' : 'Inactive') :
            course.isActive !== undefined ? (course.isActive ? 'Active' : 'Inactive') : 'N/A')
        ]);

      if (coursesTableData.length > 0) {
        yPosition = safeAutoTable({
          startY: yPosition,
          head: [['Course Name', 'Students', 'Rating', 'Price', 'Status']],
          body: coursesTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [147, 51, 234],
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [40, 40, 40]
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 20, right: 20 },
          // Column widths optimized for A4 page (210mm - 40mm margins = 170mm available)
          columnStyles: {
            0: { cellWidth: 65 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 22, halign: 'right' },
            4: { cellWidth: 18, halign: 'center' }
          }
        }) + 20;
      }
    }

    // Add orders summary if available
    if (data.ordersData && Array.isArray(data.ordersData) && data.ordersData.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Recent Orders Summary', 20, yPosition);
      yPosition += 10;

      const ordersTableData = data.ordersData
        .filter(order => order && typeof order === 'object')
        .slice(0, 15) // Limit to recent orders
        .map(order => [
          (order.orderId || 'N/A').substring(0, 15),
          (order.user?.name || 'Unknown').substring(0, 20),
          order.items?.length || 0,
          `Rs.${(order.finalAmount || 0).toLocaleString()}`,
          order.status || 'N/A',
          order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'
        ]);

      if (ordersTableData.length > 0) {
        safeAutoTable({
          startY: yPosition,
          head: [['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date']],
          body: ordersTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [40, 40, 40]
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' }
          }
        });
      }
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text('Generated by Learning Platform', 20, doc.internal.pageSize.height - 10);
    }

    // Generate filename
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;



    // Save the PDF
    doc.save(filename);


    return true;

  } catch (error) {
    console.error('Error exporting PDF:', error);

    // Check if it's an autoTable related error
    if (error.message && error.message.includes('autoTable')) {
      console.warn('jsPDF autoTable plugin issue detected. Using fallback PDF generation.');
    }

    // Fallback: Create a simple PDF with basic info
    try {

      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text('Dashboard Report ', 20, 20);

      // Date
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

      // Basic stats if available
      if (data && data.stats) {
        doc.setFontSize(14);
        doc.text('Statistics:', 20, 55);

        let y = 70;
        Object.entries(data.stats).forEach(([key, value]) => {
          if (y < 280) { // Stay within page bounds
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = typeof value === 'number' ?
              (key.toLowerCase().includes('revenue') ? `Rs.${value.toLocaleString()}` : value.toString()) :
              String(value);
            doc.text(`${label}: ${displayValue}`, 20, y);
            y += 15;
          }
        });
      }

      // Error info
      doc.setFontSize(10);
      doc.text('Note: Full report generation failed. This is a simplified version.', 20, 250);
      doc.text(`Error: ${error.message}`, 20, 265);

      // Save fallback PDF
      doc.save('dashboard-report-simplified.pdf');


    } catch (fallbackError) {
      console.error('Fallback PDF creation also failed:', fallbackError);
      // Last resort: alert user
      alert(`PDF export failed: ${error.message}. Please try again or contact support.`);
    }

    throw error;
  }
};

/**
 * Export dashboard data to Excel with error handling
 */
export const exportToExcel = (data, filename = 'dashboard-report') => {
  try {


    // Validate data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided for Excel export');
    }

    const workbook = XLSX.utils.book_new();
    let hasData = false;

    // Statistics sheet
    if (data.stats && typeof data.stats === 'object') {

      const statsData = Object.entries(data.stats)
        .filter(([key, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({
          Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          Value: typeof value === 'number' ?
            (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount') ?
              value : value)
            : String(value)
        }));

      if (statsData.length > 0) {
        const statsSheet = XLSX.utils.json_to_sheet(statsData);

        // Set column widths
        statsSheet['!cols'] = [
          { width: 25 }, // Metric column
          { width: 15 }  // Value column
        ];

        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
        hasData = true;
      }
    }

    // Revenue sheet
    if (data.revenueData && Array.isArray(data.revenueData) && data.revenueData.length > 0) {

      const revenueData = data.revenueData
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          Period: item.name || item.month || item.period || 'N/A',
          Revenue: item.uv || item.revenue || 0,
          Profit: item.pv || item.profit || Math.round((item.uv || item.revenue || 0) * 0.7),
          'Revenue (Formatted)': `Rs.${(item.uv || item.revenue || 0).toLocaleString()}`,
          'Profit (Formatted)': `Rs.${(item.pv || item.profit || Math.round((item.uv || item.revenue || 0) * 0.7)).toLocaleString()}`
        }));

      if (revenueData.length > 0) {
        const revenueSheet = XLSX.utils.json_to_sheet(revenueData);

        // Set column widths
        revenueSheet['!cols'] = [
          { width: 12 }, // Period
          { width: 15 }, // Revenue
          { width: 15 }, // Profit
          { width: 20 }, // Revenue Formatted
          { width: 20 }  // Profit Formatted
        ];

        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue');
        hasData = true;
      }
    }

    // Courses sheet
    if (data.coursesData && Array.isArray(data.coursesData) && data.coursesData.length > 0) {

      const coursesData = data.coursesData
        .filter(course => course && typeof course === 'object')
        .map(course => ({
          'Course Name': course.title || course.name || 'Untitled',
          Students: course.enrolled_count || course.students || 0,
          Rating: course.average_rating || 0,
          Price: course.price || 0,
          'Price (Formatted)': course.price ? `Rs.${course.price.toLocaleString()}` : 'Free',
          Status: course.listed !== undefined ? (course.listed ? 'Active' : 'Inactive') :
            course.isActive !== undefined ? (course.isActive ? 'Active' : 'Inactive') : 'N/A',
          'Created Date': course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A',
          'Updated Date': course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'N/A'
        }));

      if (coursesData.length > 0) {
        const coursesSheet = XLSX.utils.json_to_sheet(coursesData);

        // Set column widths
        coursesSheet['!cols'] = [
          { width: 30 }, // Course Name
          { width: 10 }, // Students
          { width: 10 }, // Rating
          { width: 12 }, // Price
          { width: 15 }, // Price Formatted
          { width: 12 }, // Status
          { width: 15 }, // Created Date
          { width: 15 }  // Updated Date
        ];

        XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses');
        hasData = true;
      }
    }


    if (data.ordersData && Array.isArray(data.ordersData) && data.ordersData.length > 0) {

      const ordersData = data.ordersData
        .filter(order => order && typeof order === 'object')
        .map(order => ({
          'Order ID': order._id || order.id || 'N/A',
          'User': order.user?.name || order.user?.email || 'N/A',
          'Amount': order.finalAmount || order.totalAmount || 0,
          'Amount (Formatted)': `Rs.${(order.finalAmount || order.totalAmount || 0).toLocaleString()}`,
          'Status': order.status || 'N/A',
          'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'
        }));

      if (ordersData.length > 0) {
        const ordersSheet = XLSX.utils.json_to_sheet(ordersData);

        // Set column widths
        ordersSheet['!cols'] = [
          { width: 25 },
          { width: 20 },
          { width: 12 },
          { width: 12 },
          { width: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
        hasData = true;
      }
    }

    if (!hasData) {

      const noDataSheet = XLSX.utils.json_to_sheet([
        { Message: 'No data available for export' },
        { Message: 'Please ensure you have data to export' }
      ]);
      XLSX.utils.book_append_sheet(workbook, noDataSheet, 'No Data');
    }

    // Generate filename
    const excelFilename = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;



    // Save the Excel file
    XLSX.writeFile(workbook, excelFilename);


    return true;

  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw error;
  }
};

export const formatCurrency = (amount) => {
  if (amount >= 10000000) {
    return `Rs.${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `Rs.${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `Rs.${(amount / 1000).toFixed(1)}K`;
  }
  return `Rs.${amount}`;
};



export const generateRevenueChartData = (orders) => {
  const monthlyData = {};
  const currentYear = new Date().getFullYear();


  for (let i = 0; i < 12; i++) {
    const month = new Date(currentYear, i, 1).toLocaleDateString('en-US', { month: 'short' });
    monthlyData[month] = { revenue: 0, orders: 0 };
  }


  orders.forEach(order => {
    if (order.status === 'paid' && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getFullYear() === currentYear) {
        const month = orderDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[month]) {
          monthlyData[month].revenue += order.finalAmount || 0;
          monthlyData[month].orders += 1;
        }
      }
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    orders: data.orders,
    profit: Math.round(data.revenue * 0.7)
  }));
};