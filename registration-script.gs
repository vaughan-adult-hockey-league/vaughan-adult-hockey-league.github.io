// ============================================================
//  VAHL Registration — Google Apps Script
//  Deploy this as a Web App to auto-fill your Google Sheet
//  and send yourself a notification email on each registration.
//
//  SETUP INSTRUCTIONS (one-time, ~5 minutes):
//
//  1. Open your VAHL Google Sheet
//  2. Click Extensions → Apps Script
//  3. Delete any existing code and paste this entire file in
//  4. Click Save (floppy disk icon)
//  5. Click Deploy → New Deployment
//  6. Click the gear icon next to "Type" and choose Web App
//  7. Set:
//       Description:  VAHL Registration Handler
//       Execute as:   Me (your Google account)
//       Who has access: Anyone
//  8. Click Deploy
//  9. Click Authorize Access and follow the prompts
//  10. Copy the Web App URL — it looks like:
//      https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
//  11. Paste that URL into registration.html where it says:
//      const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
//
//  Every registration will then:
//    - Add a new row to the Registrations tab in your Sheet
//    - Send a notification email to communication.vahl@gmail.com
// ============================================================

// Tab name for registrations in your Google Sheet
const REGISTRATIONS_TAB = 'Registrations';

// Email to notify on each new registration
const NOTIFY_EMAIL = 'communication.vahl@gmail.com';

// Column headers (must match what the form sends)
const HEADERS = [
  'Timestamp',
  'Name',
  'Email',
  'Phone',
  'Address',
  'Age',
  'Position',
  'Notes',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(REGISTRATIONS_TAB);

    // Create the tab if it doesn't exist yet
    if (!sheet) {
      sheet = ss.insertSheet(REGISTRATIONS_TAB);
      sheet.appendRow(HEADERS);
      // Bold the header row
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Append the new registration row
    sheet.appendRow([
      new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
      data.name    || '',
      data.email   || '',
      data.phone   || '',
      data.address || '',
      data.age     || '',
      data.position || '',
      data.notes   || '',
    ]);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, HEADERS.length);

    // Send notification email
    const subject = `New VAHL Registration — ${data.name}`;
    const body = [
      'A new player has registered for the VAHL 2026–27 season.',
      '',
      `Name:     ${data.name}`,
      `Email:    ${data.email}`,
      `Phone:    ${data.phone || 'Not provided'}`,
      `Address:  ${data.address || 'Not provided'}`,
      `Age:      ${data.age}`,
      `Position: ${data.position}`,
      `Notes:    ${data.notes || 'None'}`,
      '',
      `Submitted: ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })}`,
      '',
      'Reminder: They should e-transfer $600 to payment.vahl@gmail.com with their full name as the message.',
    ].join('\n');

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Return error
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET handler — returns a simple confirmation that the script is live
function doGet(e) {
  return ContentService
    .createTextOutput('VAHL Registration Script is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
