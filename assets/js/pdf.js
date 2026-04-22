(() => {
const PAGE_MARGIN = {
  left: 40,
  right: 40,
  top: 148,
  bottom: 50
};

const BRAND = {
  name: 'SeaForestuna Restaurant Tourism',
  shortName: 'SeaForestuna',
  tagline: 'Restaurant, stays, and sea journeys',
  address: 'Devla Road, Unawatuna, Sri Lanka',
  phone: '+94 76 166 2995',
  email: 'mail@seaforestuna.com'
};

const COLORS = {
  ink: [20, 28, 37],
  muted: [103, 115, 127],
  gold: [200, 164, 106],
  goldSoft: [233, 220, 194],
  sand: [246, 239, 228],
  line: [226, 220, 211],
  surface: [250, 247, 242]
};

const PDF_SCRIPT_SRC =
  document.currentScript?.src ||
  document.querySelector('script[src*="assets/js/pdf.js"]')?.src ||
  window.location.href;

const BRAND_LOGO_URL = new URL('../images/logo.png', PDF_SCRIPT_SRC).href;

let logoDataUrlPromise = null;
let watermarkLogoDataUrlPromise = null;

const getPdfLib = () => window.jspdf?.jsPDF || null;

const ensurePdfDoc = (options = {}) => {
  const jsPDF = getPdfLib();
  if (!jsPDF) {
    throw new Error('PDF library unavailable');
  }

  const doc = new jsPDF({ unit: 'pt', format: 'a4', ...options });
  if (
    typeof doc.autoTable !== 'function' &&
    typeof window.autoTable !== 'function' &&
    typeof window.jspdf?.autoTable !== 'function'
  ) {
    throw new Error('PDF table plugin unavailable');
  }

  return doc;
};

const runAutoTable = (doc, options) => {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
    return;
  }

  if (typeof window.autoTable === 'function') {
    window.autoTable(doc, options);
    return;
  }

  if (typeof window.jspdf?.autoTable === 'function') {
    window.jspdf.autoTable(doc, options);
    return;
  }

  throw new Error('PDF table plugin unavailable');
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load SeaForestuna logo'));
    image.src = src;
  });

const renderLogoDataUrl = (image, { maxSide = 220, opacity = 1 } = {}) => {
  const scale = Math.min(1, maxSide / Math.max(image.width || 1, image.height || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((image.width || maxSide) * scale));
  canvas.height = Math.max(1, Math.round((image.height || maxSide) * scale));

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = Math.min(1, Math.max(0, opacity));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

const getLogoDataUrl = async () => {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = loadImage(BRAND_LOGO_URL)
      .then((image) => renderLogoDataUrl(image, { maxSide: 220, opacity: 1 }))
      .catch(() => null);
  }

  return logoDataUrlPromise;
};

const getWatermarkLogoDataUrl = async () => {
  if (!watermarkLogoDataUrlPromise) {
    watermarkLogoDataUrlPromise = loadImage(BRAND_LOGO_URL)
      .then((image) => renderLogoDataUrl(image, { maxSide: 720, opacity: 0.08 }))
      .catch(() => null);
  }

  return watermarkLogoDataUrlPromise;
};

const formatCurrency = (value) => {
  if (window.SF_UTILS && typeof window.SF_UTILS.formatPrice === 'function') {
    return window.SF_UTILS.formatPrice(Number(value) || 0);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-LK');
};

const formatDateOnly = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-LK');
};

const getDateOnlyValue = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatOrderType = (value) => {
  const label = String(value || 'pickup').replace(/-/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const sumBy = (items, accessor) => items.reduce((sum, item) => sum + (Number(accessor(item)) || 0), 0);

const sanitizeFileSegment = (value) =>
  String(value || 'document')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'document';

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const getRoomBookingNights = (booking) => {
  const storedNights = Number(booking?.totalNights);
  if (storedNights > 0) return storedNights;

  const checkIn = getDateOnlyValue(booking?.checkIn);
  const checkOut = getDateOnlyValue(booking?.checkOut);
  if (!checkIn || !checkOut) return 0;

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
};

const getRoomBookingRate = (booking, rooms = []) => {
  const room = rooms.find((entry) => entry && entry._id === booking?.roomId);
  const roomRate = Number(room?.pricePerNight);
  if (roomRate > 0) return roundMoney(roomRate);

  const nights = getRoomBookingNights(booking);
  const totalPrice = Number(booking?.totalPrice);
  if (nights > 0 && totalPrice > 0) {
    return roundMoney(totalPrice / nights);
  }

  return 0;
};

const buildRoomBookingBillRows = (bookings, rooms = []) =>
  bookings.map((booking) => {
    const nights = getRoomBookingNights(booking);
    const ratePerNight = getRoomBookingRate(booking, rooms);
    const calculatedTotal = roundMoney(nights * ratePerNight);
    const totalBill = calculatedTotal > 0 ? calculatedTotal : roundMoney(booking?.totalPrice);

    return {
      booking,
      nights,
      ratePerNight,
      totalBill
    };
  });

const getBoatBookingRate = (booking, boats = []) => {
  const boat = boats.find((entry) => entry && entry._id === booking?.boatId);
  const boatRate = Number(boat?.price);
  if (boatRate > 0) return roundMoney(boatRate);

  const guests = Number(booking?.guests);
  const totalPrice = Number(booking?.totalPrice);
  if (guests > 0 && totalPrice > 0) {
    return roundMoney(totalPrice / guests);
  }

  return 0;
};

const buildBoatBookingBillRows = (bookings, boats = []) =>
  bookings.map((booking) => {
    const guests = Number(booking?.guests) || 0;
    const ratePerGuest = getBoatBookingRate(booking, boats);
    const calculatedTotal = roundMoney(guests * ratePerGuest);
    const totalBill = calculatedTotal > 0 ? calculatedTotal : roundMoney(booking?.totalPrice);

    return {
      booking,
      guests,
      ratePerGuest,
      totalBill
    };
  });

const getPageSize = (doc) => ({
  width: doc.internal.pageSize.getWidth(),
  height: doc.internal.pageSize.getHeight()
});

const getCurrentPageNumber = (doc) => {
  const pageInfo =
    typeof doc.getCurrentPageInfo === 'function' ? doc.getCurrentPageInfo() : doc.internal.getCurrentPageInfo();
  return pageInfo?.pageNumber || 1;
};

const buildChrome = async (title, subtitle = '') => ({
  title,
  subtitle,
  logoDataUrl: await getLogoDataUrl(),
  watermarkLogoDataUrl: await getWatermarkLogoDataUrl(),
  paintedPages: new Set()
});

const drawWatermark = (doc, chrome) => {
  const { width, height } = getPageSize(doc);
  const watermarkSize = Math.min(width, height) * (width > height ? 0.48 : 0.42);

  if (!chrome.watermarkLogoDataUrl) return;

  try {
    doc.addImage(
      chrome.watermarkLogoDataUrl,
      'PNG',
      (width - watermarkSize) / 2,
      (height - watermarkSize) / 2,
      watermarkSize,
      watermarkSize
    );
  } catch (error) {
    // Keep PDF generation working even if the watermark image cannot be painted.
  }
};

const drawPageChrome = (doc, chrome) => {
  const pageNumber = getCurrentPageNumber(doc);
  if (chrome.paintedPages?.has(pageNumber)) return;
  chrome.paintedPages?.add(pageNumber);

  const { width, height } = getPageSize(doc);
  const infoX = PAGE_MARGIN.left + 72;

  drawWatermark(doc, chrome);

  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, width, 12, 'F');

  doc.setFillColor(...COLORS.surface);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(PAGE_MARGIN.left, 26, width - PAGE_MARGIN.left - PAGE_MARGIN.right, 88, 18, 18, 'FD');

  if (chrome.logoDataUrl) {
    try {
      doc.addImage(chrome.logoDataUrl, 'PNG', PAGE_MARGIN.left + 12, 40, 44, 44);
    } catch (error) {
      // Keep PDF generation working even if the logo image cannot be painted.
    }
  }

  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(BRAND.shortName.toUpperCase(), infoX, 49);

  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(18);
  doc.text(chrome.title || BRAND.name, infoX, 72);

  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(chrome.subtitle || BRAND.tagline, infoX, 90);

  doc.setFontSize(9);
  doc.text(BRAND.address, width - PAGE_MARGIN.right, 50, { align: 'right' });
  doc.text(`${BRAND.phone} | ${BRAND.email}`, width - PAGE_MARGIN.right, 66, { align: 'right' });

  doc.setDrawColor(...COLORS.line);
  doc.line(PAGE_MARGIN.left, 124, width - PAGE_MARGIN.right, 124);
  doc.line(PAGE_MARGIN.left, height - 34, width - PAGE_MARGIN.right, height - 34);

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(9);
  doc.text(BRAND.tagline, PAGE_MARGIN.left, height - 16);
  doc.text(`A4 Document | Page ${getCurrentPageNumber(doc)}`, width - PAGE_MARGIN.right, height - 16, {
    align: 'right'
  });
};

const getContentStartY = () => 146;

const drawKeyValueGrid = (doc, items, startY, columns = 2) => {
  const usableItems = items.filter((item) => item && item.label);
  if (!usableItems.length) return startY;

  const { width } = getPageSize(doc);
  const safeColumns = Math.max(1, columns);
  const gap = 14;
  const usableWidth = width - PAGE_MARGIN.left - PAGE_MARGIN.right;
  const columnWidth = (usableWidth - gap * (safeColumns - 1)) / safeColumns;
  let y = startY;

  for (let index = 0; index < usableItems.length; index += safeColumns) {
    const rowItems = usableItems.slice(index, index + safeColumns).map((item) => {
      const valueLines = doc.splitTextToSize(String(item.value || '--'), columnWidth - 24);
      const cardHeight = Math.max(56, 28 + valueLines.length * 12 + 16);
      return { item, valueLines, cardHeight };
    });

    const rowHeight = Math.max(...rowItems.map((entry) => entry.cardHeight));

    rowItems.forEach((entry, columnIndex) => {
      const x = PAGE_MARGIN.left + columnIndex * (columnWidth + gap);

      doc.setFillColor(...COLORS.surface);
      doc.setDrawColor(...COLORS.line);
      doc.roundedRect(x, y, columnWidth, rowHeight, 14, 14, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(String(entry.item.label), x + 12, y + 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.ink);
      doc.text(entry.valueLines, x + 12, y + 36);
    });

    y += rowHeight + 12;
  }

  return y;
};

const drawStack = (doc, items, startY, rightAlign = true) => {
  if (!items.length) return startY;

  if (!rightAlign) {
    let y = startY;
    items.forEach((item) => {
      doc.setFont('helvetica', item.emphasis ? 'bold' : 'normal');
      doc.setFontSize(item.emphasis ? 11.5 : 10.5);
      doc.setTextColor(...COLORS.ink);
      doc.text(`${item.label}: ${item.value}`, PAGE_MARGIN.left, y);
      y += item.emphasis ? 18 : 16;
    });
    return y;
  }

  const { width } = getPageSize(doc);
  const boxWidth = 230;
  const x = width - PAGE_MARGIN.right - boxWidth;
  const contentHeight = items.reduce((sum, item) => sum + (item.emphasis ? 22 : 18), 16);
  const boxHeight = contentHeight + 18;
  let y = startY + 8;

  doc.setFillColor(...COLORS.surface);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(x, startY - 8, boxWidth, boxHeight, 16, 16, 'FD');

  items.forEach((item) => {
    doc.setFont('helvetica', item.emphasis ? 'bold' : 'normal');
    doc.setFontSize(item.emphasis ? 11.5 : 10.5);
    doc.setTextColor(...COLORS.ink);
    doc.text(String(item.label || ''), x + 14, y);
    doc.text(String(item.value || ''), x + boxWidth - 14, y, { align: 'right' });
    y += item.emphasis ? 22 : 18;
  });

  return startY + boxHeight + 10;
};

const drawParagraphSection = (doc, title, body, startY) => {
  if (!body) return startY;

  const { width } = getPageSize(doc);
  const boxWidth = width - PAGE_MARGIN.left - PAGE_MARGIN.right;
  const lines = doc.splitTextToSize(String(body), boxWidth - 24);
  const boxHeight = 44 + lines.length * 13;

  doc.setFillColor(...COLORS.surface);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(PAGE_MARGIN.left, startY, boxWidth, boxHeight, 16, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(title, PAGE_MARGIN.left + 12, startY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.ink);
  doc.text(lines, PAGE_MARGIN.left + 12, startY + 38);

  return startY + boxHeight + 12;
};

const buildTableOptions = (doc, chrome, options = {}) => {
  const {
    margin = {},
    headStyles = {},
    bodyStyles = {},
    styles = {},
    alternateRowStyles = {},
    didDrawPage: userDidDrawPage,
    ...rest
  } = options;

  return {
    theme: 'grid',
    margin: {
      top: PAGE_MARGIN.top,
      left: PAGE_MARGIN.left,
      right: PAGE_MARGIN.right,
      bottom: PAGE_MARGIN.bottom,
      ...margin
    },
    styles: {
      font: 'helvetica',
      fontSize: 9.2,
      cellPadding: 7.5,
      lineColor: COLORS.line,
      lineWidth: 0.45,
      textColor: COLORS.ink,
      valign: 'middle',
      ...styles
    },
    headStyles: {
      fillColor: COLORS.ink,
      textColor: COLORS.sand,
      fontStyle: 'bold',
      fontSize: 9.4,
      ...headStyles
    },
    bodyStyles: {
      ...bodyStyles
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247],
      ...alternateRowStyles
    },
    didDrawPage: (data) => {
      drawPageChrome(doc, chrome);
      if (typeof userDidDrawPage === 'function') {
        userDidDrawPage(data);
      }
    },
    ...rest
  };
};

const buildReceiptInfo = (order) => [
  { label: 'Order Number', value: order.orderNumber || order._id || '--' },
  { label: 'Placed At', value: formatDateTime(order.createdAt) },
  { label: 'Scheduled', value: formatDateTime(order.scheduledAt) },
  { label: 'Order Type', value: formatOrderType(order.orderType) },
  { label: 'Status', value: order.status || '--' },
  { label: 'Guest', value: order.userName || order.userEmail || 'Guest' }
];

const buildReceiptExtras = (order) => {
  const extras = [];

  if (order.orderType === 'delivery') {
    extras.push({ label: 'Delivery Address', value: order.address || '--' });
    extras.push({ label: 'Phone', value: order.phone || '--' });
  }

  if (order.orderType === 'dine-in') {
    extras.push({ label: 'Guest Count', value: String(order.guestCount || '--') });
    extras.push({ label: 'Table Preference', value: order.tablePreference || '--' });
  }

  return extras;
};

const downloadOrderReceipt = async (order) => {
  if (!order || !Array.isArray(order.items) || !order.items.length) {
    throw new Error('Order data is incomplete');
  }

  const doc = ensurePdfDoc();
  const chrome = await buildChrome('Professional Order Receipt', `Reference ${order.orderNumber || order._id || '--'}`);
  drawPageChrome(doc, chrome);

  let y = getContentStartY();
  y = drawKeyValueGrid(doc, buildReceiptInfo(order), y, 2);

  const extras = buildReceiptExtras(order);
  if (extras.length) {
    y = drawKeyValueGrid(doc, extras, y, 2);
  }

  runAutoTable(
    doc,
    buildTableOptions(doc, chrome, {
      startY: y + 4,
      head: [['Item', 'Quantity', 'Unit Price', 'Line Total']],
      body: order.items.map((item) => [
        item.name || 'Menu Item',
        String(Number(item.quantity) || 0),
        formatCurrency(item.price),
        formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))
      ])
    })
  );

  y = (doc.lastAutoTable?.finalY || y) + 18;
  y = drawStack(
    doc,
    [
      { label: 'Subtotal', value: formatCurrency(order.subtotal) },
      { label: 'Tax', value: formatCurrency(order.tax) },
      { label: 'Total', value: formatCurrency(order.total), emphasis: true }
    ],
    y
  );

  y = drawParagraphSection(doc, 'Order Notes', order.notes || 'No additional notes provided.', y + 4);
  y = drawParagraphSection(doc, 'Document Note', 'This PDF was generated from the SeaForestuna order system.', y);

  doc.save(`seaforestuna-receipt-${sanitizeFileSegment(order.orderNumber || order._id)}.pdf`);
};

const downloadCollectionReport = async ({
  title,
  filename,
  rows,
  headers,
  totalRevenue,
  summaryItems = [],
  orientation = 'portrait'
}) => {
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error('No records available for this report');
  }

  const doc = ensurePdfDoc({ orientation });
  const chrome = await buildChrome(title, `Generated ${formatDateTime(new Date().toISOString())}`);
  drawPageChrome(doc, chrome);

  let y = getContentStartY();
  y = drawKeyValueGrid(
    doc,
    [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
      ...summaryItems
    ],
    y,
    orientation === 'landscape' ? 3 : 2
  );

  runAutoTable(
    doc,
    buildTableOptions(doc, chrome, {
      startY: y + 6,
      head: [headers],
      body: rows
    })
  );

  doc.save(filename);
};

const downloadOrderReport = async (orders) => {
  const rows = orders.map((order) => [
    order.orderNumber || '--',
    order.userName || order.userEmail || order.userId || 'Guest',
    formatOrderType(order.orderType),
    formatDateTime(order.scheduledAt),
    order.status || '--',
    formatCurrency(order.total)
  ]);

  await downloadCollectionReport({
    title: 'Food Orders Report',
    filename: 'seaforestuna-orders-report.pdf',
    headers: ['Order', 'Guest', 'Type', 'Scheduled', 'Status', 'Total'],
    rows,
    totalRevenue: sumBy(orders, (order) => order.total),
    summaryItems: [
      {
        label: 'Active Orders',
        value: String(orders.filter((order) => !['Completed', 'Cancelled'].includes(order.status)).length)
      }
    ]
  });
};

const downloadRoomBookingReport = async (bookings) => {
  const rows = bookings.map((booking) => [
    booking.bookingRef || '--',
    booking.userName || booking.userEmail || booking.userId || 'Guest',
    booking.roomName || 'Room Booking',
    formatDateOnly(booking.checkIn),
    formatDateOnly(booking.checkOut),
    String(Number(booking.guests) || 0),
    booking.status || '--',
    formatCurrency(booking.totalPrice)
  ]);

  await downloadCollectionReport({
    title: 'Room Bookings Report',
    filename: 'seaforestuna-room-bookings-report.pdf',
    headers: ['Ref', 'Guest', 'Room', 'Check-in', 'Check-out', 'Guests', 'Status', 'Total'],
    rows,
    totalRevenue: sumBy(bookings, (booking) => booking.totalPrice),
    summaryItems: [
      {
        label: 'Upcoming Stays',
        value: String(bookings.filter((booking) => !['Checked-out', 'Cancelled'].includes(booking.status)).length)
      }
    ]
  });
};

const downloadBookedRoomsPdf = async (bookings, rooms = []) => {
  const computedRows = buildRoomBookingBillRows(bookings, rooms);
  if (!computedRows.length) {
    throw new Error('No room bookings available for this report');
  }

  const rows = computedRows.map(({ booking, nights, ratePerNight, totalBill }) => [
    booking.bookingRef || booking._id || '--',
    booking.roomName || 'Room Booking',
    formatDateOnly(booking.checkIn),
    formatDateOnly(booking.checkOut),
    String(Number(booking.guests) || 0),
    booking.status || '--',
    String(nights),
    formatCurrency(ratePerNight),
    formatCurrency(totalBill)
  ]);

  await downloadCollectionReport({
    title: 'Booked Rooms Bill Report',
    filename: 'seaforestuna-booked-rooms-bill-report.pdf',
    headers: ['Booking Ref', 'Room', 'Check-in', 'Check-out', 'Guests', 'Status', 'Total Days', 'Price / Day', 'Total Bill'],
    rows,
    totalRevenue: sumBy(computedRows, (entry) => entry.totalBill),
    summaryItems: [
      { label: 'Total Nights', value: String(sumBy(computedRows, (entry) => entry.nights)) },
      { label: 'Grand Total Bill', value: formatCurrency(sumBy(computedRows, (entry) => entry.totalBill)) }
    ],
    orientation: 'landscape'
  });
};

const downloadBookedRidesPdf = async (bookings, boats = []) => {
  const computedRows = buildBoatBookingBillRows(bookings, boats);
  if (!computedRows.length) {
    throw new Error('No boat bookings available for this report');
  }

  const rows = computedRows.map(({ booking, guests, ratePerGuest, totalBill }) => [
    booking.bookingRef || booking._id || '--',
    booking.boatName || 'Boat Ride',
    formatDateOnly(booking.date),
    booking.timeSlot || '--',
    String(guests),
    booking.status || '--',
    formatCurrency(ratePerGuest),
    formatCurrency(totalBill),
    booking.specialNotes || 'No special note'
  ]);

  await downloadCollectionReport({
    title: 'Booked Boat Rides Bill Report',
    filename: 'seaforestuna-booked-rides-bill-report.pdf',
    headers: ['Booking Ref', 'Ride Plan', 'Date', 'Time Slot', 'Guests', 'Status', 'Price / Guest', 'Total Bill', 'Special Note'],
    rows,
    totalRevenue: sumBy(computedRows, (entry) => entry.totalBill),
    summaryItems: [
      { label: 'Total Guests', value: String(sumBy(computedRows, (entry) => entry.guests)) },
      { label: 'Grand Total Bill', value: formatCurrency(sumBy(computedRows, (entry) => entry.totalBill)) }
    ],
    orientation: 'landscape'
  });
};

const downloadBoatBookingReport = async (bookings) => {
  const rows = bookings.map((booking) => [
    booking.bookingRef || '--',
    booking.userName || booking.userEmail || booking.userId || 'Guest',
    booking.boatName || 'Boat Ride',
    formatDateOnly(booking.date),
    booking.timeSlot || '--',
    String(Number(booking.guests) || 0),
    booking.status || '--',
    formatCurrency(booking.totalPrice)
  ]);

  await downloadCollectionReport({
    title: 'Boat Bookings Report',
    filename: 'seaforestuna-boat-bookings-report.pdf',
    headers: ['Ref', 'Guest', 'Boat', 'Date', 'Time Slot', 'Guests', 'Status', 'Total'],
    rows,
    totalRevenue: sumBy(bookings, (booking) => booking.totalPrice),
    summaryItems: [
      {
        label: 'Upcoming Rides',
        value: String(bookings.filter((booking) => ['Pending', 'Confirmed'].includes(booking.status)).length)
      }
    ]
  });
};

window.SF_PDF = {
  downloadOrderReceipt,
  downloadOrderReport,
  downloadRoomBookingReport,
  downloadBoatBookingReport,
  downloadBookedRoomsPdf,
  downloadBookedRidesPdf
};
})();
