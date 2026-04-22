const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const BRAND_LOGO_PATH = path.resolve(__dirname, '../../frontend/assets/images/logo.png');
const BRAND_LOGO_CID = 'seaforestuna-logo';
const DEFAULT_TIME_ZONE = process.env.SITE_TIMEZONE || 'Asia/Colombo';

let transporterCache = null;
let mailConfigWarningShown = false;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);

const formatLabel = (value) => {
  const label = String(value || '').replace(/-/g, ' ').trim();
  if (!label) return '--';
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: DEFAULT_TIME_ZONE
  });
};

const formatDateOnly = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-LK', {
    dateStyle: 'medium',
    timeZone: DEFAULT_TIME_ZONE
  });
};

const renderSummaryRows = (rows = []) =>
  rows
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '')
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;color:#7f8b98;font-size:13px;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;color:#f2eadc;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join('');

const renderLineTable = (columns = [], rows = []) => {
  if (!columns.length || !rows.length) return '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:24px;">
      <thead>
        <tr>
          ${columns
            .map(
              (column) => `
                <th style="padding:12px 10px;background:#101922;border:1px solid rgba(255,255,255,0.08);color:#c8a46a;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;text-align:${column.align || 'left'};">
                  ${escapeHtml(column.label)}
                </th>
              `
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                ${columns
                  .map((column) => {
                    const value = row[column.key] ?? '--';
                    return `
                      <td style="padding:12px 10px;border:1px solid rgba(255,255,255,0.08);color:#e5edf5;font-size:13px;text-align:${column.align || 'left'};">
                        ${escapeHtml(value)}
                      </td>
                    `;
                  })
                  .join('')}
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const renderTotals = (totals = []) =>
  totals
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '')
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;color:${row.emphasis ? '#f2eadc' : '#7f8b98'};font-size:${row.emphasis ? '15px' : '13px'};font-weight:${row.emphasis ? '700' : '500'};">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:8px 0;color:${row.emphasis ? '#e3c58a' : '#f2eadc'};font-size:${row.emphasis ? '16px' : '14px'};font-weight:${row.emphasis ? '800' : '600'};text-align:right;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join('');

const getMailConfig = () => {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 0);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const fromAddress = String(process.env.SMTP_FROM || '').trim();
  const fromName = String(process.env.SMTP_FROM_NAME || 'SeaForestuna').trim();

  return {
    host,
    port,
    secure: toBoolean(process.env.SMTP_SECURE, port === 465),
    auth: user && pass ? { user, pass } : null,
    fromAddress,
    fromName
  };
};

const isMailConfigured = (config) => Boolean(config.host && config.port && config.auth?.user && config.auth?.pass && config.fromAddress);

const getTransporter = () => {
  const config = getMailConfig();
  if (!isMailConfigured(config)) {
    if (!mailConfigWarningShown) {
      mailConfigWarningShown = true;
      console.warn('Email receipts skipped: SMTP configuration is missing.');
    }
    return { transporter: null, config };
  }

  if (!transporterCache) {
    transporterCache = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
  }

  return { transporter: transporterCache, config };
};

const getInlineLogoAttachment = () => {
  if (!fs.existsSync(BRAND_LOGO_PATH)) return [];
  return [
    {
      filename: 'seaforestuna-logo.png',
      path: BRAND_LOGO_PATH,
      cid: BRAND_LOGO_CID
    }
  ];
};

const buildReceiptEmail = ({
  receiptLabel,
  heading,
  intro,
  referenceLabel,
  referenceValue,
  guestName,
  summaryRows,
  tableColumns = [],
  tableRows = [],
  totals = [],
  footerNote
}) => {
  const logoMarkup = fs.existsSync(BRAND_LOGO_PATH)
    ? `<img src="cid:${BRAND_LOGO_CID}" alt="SeaForestuna" width="68" height="68" style="display:block;border-radius:18px;" />`
    : `<div style="width:68px;height:68px;border-radius:18px;background:#101922;color:#e3c58a;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">SF</div>`;
  const summaryMarkup = renderSummaryRows(summaryRows);
  const totalsMarkup = renderTotals(totals);
  const tableMarkup = renderLineTable(tableColumns, tableRows);
  const safeGuestName = guestName ? `Hello ${escapeHtml(guestName)},` : 'Hello,';

  const html = `
    <div style="margin:0;padding:24px;background:#05090d;font-family:Arial,Helvetica,sans-serif;color:#f2eadc;">
      <div style="max-width:760px;margin:0 auto;background:#0a1116;border:1px solid rgba(255,255,255,0.08);border-radius:28px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,0.36);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#111a21 0%,#091117 58%,#04070a 100%);border-bottom:1px solid rgba(255,255,255,0.08);">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;">${logoMarkup}</td>
              <td style="padding-left:18px;vertical-align:top;">
                <p style="margin:0;color:#c8a46a;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;">${escapeHtml(
                  receiptLabel
                )}</p>
                <h1 style="margin:10px 0 8px;font-family:'Georgia',serif;font-size:32px;line-height:1.1;color:#f7efe2;">${escapeHtml(
                  heading
                )}</h1>
                <p style="margin:0;color:#b6c2ce;font-size:14px;line-height:1.7;">${escapeHtml(intro)}</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:28px 32px;">
          <p style="margin:0 0 18px;color:#f2eadc;font-size:15px;line-height:1.6;">${safeGuestName}</p>
          <div style="padding:18px 20px;border-radius:22px;background:rgba(200,164,106,0.08);border:1px solid rgba(200,164,106,0.18);">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="color:#7f8b98;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(referenceLabel)}</td>
                <td style="color:#e3c58a;font-size:18px;font-weight:800;text-align:right;">${escapeHtml(referenceValue)}</td>
              </tr>
            </table>
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:20px;">
            ${summaryMarkup}
          </table>

          ${tableMarkup}

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:24px;">
            ${totalsMarkup}
          </table>

          <div style="margin-top:24px;padding:18px 20px;border-radius:20px;background:#081017;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;color:#b6c2ce;font-size:13px;line-height:1.7;">${escapeHtml(
              footerNote || 'Thank you for choosing SeaForestuna. We look forward to hosting you.'
            )}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    heading,
    '',
    guestName ? `Hello ${guestName},` : 'Hello,',
    intro,
    '',
    `${referenceLabel}: ${referenceValue}`,
    '',
    ...summaryRows
      .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '')
      .map((row) => `${row.label}: ${row.value}`),
    '',
    ...tableRows.map((row) =>
      tableColumns
        .map((column) => `${column.label}: ${row[column.key] ?? '--'}`)
        .join(' | ')
    ),
    '',
    ...totals
      .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '')
      .map((row) => `${row.label}: ${row.value}`),
    '',
    footerNote || 'Thank you for choosing SeaForestuna.'
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
};

const sendReceiptEmail = async ({
  to,
  subject,
  receiptLabel,
  heading,
  intro,
  referenceLabel,
  referenceValue,
  guestName,
  summaryRows,
  tableColumns,
  tableRows,
  totals,
  footerNote
}) => {
  const recipient = String(to || '').trim();
  if (!recipient) {
    return { sent: false, reason: 'missing-recipient' };
  }

  const { transporter, config } = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'smtp-not-configured' };
  }

  const { html, text } = buildReceiptEmail({
    receiptLabel,
    heading,
    intro,
    referenceLabel,
    referenceValue,
    guestName,
    summaryRows,
    tableColumns,
    tableRows,
    totals,
    footerNote
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromAddress}>`,
    to: recipient,
    subject,
    text,
    html,
    attachments: getInlineLogoAttachment()
  });

  return { sent: true };
};

const sendTestReceiptEmail = async ({ to }) =>
  sendReceiptEmail({
    to,
    subject: 'SeaForestuna mail test',
    receiptLabel: 'Mail Test',
    heading: 'SeaForestuna email delivery check',
    intro: 'This is a test email to confirm that SMTP is configured correctly.',
    referenceLabel: 'Test Reference',
    referenceValue: 'MAIL-CHECK',
    guestName: '',
    summaryRows: [
      { label: 'Sent At', value: formatDateTime(Date.now()) },
      { label: 'Environment', value: process.env.NODE_ENV || 'development' }
    ],
    tableColumns: [
      { key: 'check', label: 'Check' },
      { key: 'status', label: 'Status' }
    ],
    tableRows: [
      { check: 'SMTP Configuration', status: 'Loaded' },
      { check: 'Brand Template', status: 'Ready' }
    ],
    totals: [{ label: 'Delivery Test', value: 'Pending inbox arrival', emphasis: true }],
    footerNote: 'If you received this email, SeaForestuna receipt delivery is working.'
  });

const sendOrderReceiptEmail = async (order) =>
  sendReceiptEmail({
    to: order.userEmail,
    subject: `SeaForestuna receipt for ${order.orderNumber || 'your order'}`,
    receiptLabel: 'Food Order Receipt',
    heading: 'Your food order is confirmed',
    intro: 'We received your order and prepared a receipt summary for your records.',
    referenceLabel: 'Order Number',
    referenceValue: order.orderNumber || '--',
    guestName: order.userName || '',
    summaryRows: [
      { label: 'Placed On', value: formatDateTime(order.createdAt) },
      { label: 'Scheduled For', value: formatDateTime(order.scheduledAt) },
      { label: 'Order Type', value: formatLabel(order.orderType || 'pickup') },
      { label: 'Status', value: order.status || 'Pending' },
      { label: 'Delivery Address', value: order.address || '' },
      { label: 'Phone', value: order.phone || '' },
      { label: 'Guests', value: order.guestCount ? String(order.guestCount) : '' },
      { label: 'Table Preference', value: order.tablePreference || '' },
      { label: 'Notes', value: order.notes || '' }
    ],
    tableColumns: [
      { key: 'item', label: 'Item' },
      { key: 'qty', label: 'Qty', align: 'center' },
      { key: 'unitPrice', label: 'Unit Price', align: 'right' },
      { key: 'lineTotal', label: 'Line Total', align: 'right' }
    ],
    tableRows: Array.isArray(order.items)
      ? order.items.map((item) => ({
          item: item.name || 'Menu item',
          qty: String(Number(item.quantity) || 0),
          unitPrice: formatCurrency(item.price),
          lineTotal: formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))
        }))
      : [],
    totals: [
      { label: 'Subtotal', value: formatCurrency(order.subtotal) },
      { label: 'Tax', value: formatCurrency(order.tax) },
      { label: 'Total', value: formatCurrency(order.total), emphasis: true }
    ],
    footerNote: 'Please keep this email as your food order receipt. You can also download the PDF receipt from your SeaForestuna account.'
  });

const sendRoomBookingReceiptEmail = async ({ booking, room }) => {
  const nightlyRate = Number(room?.pricePerNight || 0) || ((Number(booking.totalNights) || 0) > 0 ? Number(booking.totalPrice || 0) / Number(booking.totalNights) : 0);

  return sendReceiptEmail({
    to: booking.userEmail,
    subject: `SeaForestuna stay receipt for ${booking.bookingRef || 'your booking'}`,
    receiptLabel: 'Room Booking Receipt',
    heading: 'Your stay booking is confirmed',
    intro: 'Thank you for booking your stay with SeaForestuna. Here is your booking receipt summary.',
    referenceLabel: 'Booking Reference',
    referenceValue: booking.bookingRef || '--',
    guestName: booking.userName || '',
    summaryRows: [
      { label: 'Room', value: booking.roomName || 'SeaForestuna Room' },
      { label: 'Check-in', value: formatDateOnly(booking.checkIn) },
      { label: 'Check-out', value: formatDateOnly(booking.checkOut) },
      { label: 'Total Nights', value: String(booking.totalNights || '--') },
      { label: 'Guests', value: String(booking.guests || '--') },
      { label: 'Status', value: booking.status || 'Pending' },
      { label: 'Special Requests', value: booking.specialRequests || '' }
    ],
    tableColumns: [
      { key: 'room', label: 'Room' },
      { key: 'dates', label: 'Stay Dates' },
      { key: 'guests', label: 'Guests', align: 'center' },
      { key: 'rate', label: 'Rate / Night', align: 'right' },
      { key: 'total', label: 'Total Bill', align: 'right' }
    ],
    tableRows: [
      {
        room: booking.roomName || 'SeaForestuna Room',
        dates: `${formatDateOnly(booking.checkIn)} to ${formatDateOnly(booking.checkOut)}`,
        guests: String(booking.guests || '--'),
        rate: nightlyRate ? formatCurrency(nightlyRate) : '--',
        total: formatCurrency(booking.totalPrice)
      }
    ],
    totals: [
      { label: 'Stay Total', value: formatCurrency(booking.totalPrice), emphasis: true }
    ],
    footerNote: 'Please keep this email as your room booking receipt. Our team will contact you if anything needs clarification before check-in.'
  });
};

const sendBoatBookingReceiptEmail = async ({ booking, boat }) => {
  const guestRate = Number(boat?.price || 0) || ((Number(booking.guests) || 0) > 0 ? Number(booking.totalPrice || 0) / Number(booking.guests) : 0);

  return sendReceiptEmail({
    to: booking.userEmail,
    subject: `SeaForestuna boat ride receipt for ${booking.bookingRef || 'your booking'}`,
    receiptLabel: 'Boat Booking Receipt',
    heading: 'Your boat ride booking is confirmed',
    intro: 'Your sea journey has been reserved. Here is the receipt summary for your booking.',
    referenceLabel: 'Booking Reference',
    referenceValue: booking.bookingRef || '--',
    guestName: booking.userName || '',
    summaryRows: [
      { label: 'Boat Ride', value: booking.boatName || 'SeaForestuna Ride' },
      { label: 'Ride Date', value: formatDateOnly(booking.date) },
      { label: 'Time Slot', value: booking.timeSlot || '--' },
      { label: 'Guests', value: String(booking.guests || '--') },
      { label: 'Status', value: booking.status || 'Pending' },
      { label: 'Special Notes', value: booking.specialNotes || '' }
    ],
    tableColumns: [
      { key: 'ride', label: 'Ride Plan' },
      { key: 'slot', label: 'Schedule' },
      { key: 'guests', label: 'Guests', align: 'center' },
      { key: 'rate', label: 'Price / Guest', align: 'right' },
      { key: 'total', label: 'Total Bill', align: 'right' }
    ],
    tableRows: [
      {
        ride: booking.boatName || 'SeaForestuna Ride',
        slot: `${formatDateOnly(booking.date)} at ${booking.timeSlot || '--'}`,
        guests: String(booking.guests || '--'),
        rate: guestRate ? formatCurrency(guestRate) : '--',
        total: formatCurrency(booking.totalPrice)
      }
    ],
    totals: [
      { label: 'Ride Total', value: formatCurrency(booking.totalPrice), emphasis: true }
    ],
    footerNote: 'Please keep this email as your boat ride receipt and arrive a little early for check-in at the marina desk.'
  });
};

module.exports = {
  sendReceiptEmail,
  sendOrderReceiptEmail,
  sendRoomBookingReceiptEmail,
  sendBoatBookingReceiptEmail,
  sendTestReceiptEmail
};
