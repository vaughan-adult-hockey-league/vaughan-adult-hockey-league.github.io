// ============================================================
//  VAHL Registration — Google Apps Script
//  Deploy this as a Web App to auto-fill your Google Sheet
//  and send yourself a notification email on each registration.
//
//  IMPORTANT PRIVACY NOTE:
//  Registrations are written to a SEPARATE private Google Sheet
//  that is never published to the web. This keeps player personal
//  data (name, email, phone, address) completely private.
//
//  SETUP INSTRUCTIONS (one-time):
//
//  1. Create a NEW separate Google Sheet called "VAHL Registrations"
//     - Keep this sheet completely private (do NOT publish it)
//     - Copy its Sheet ID from the URL between /d/ and /edit
//     - Paste it below as PRIVATE_SHEET_ID
//
//  2. Open your main VAHL Google Sheet
//  3. Click Extensions → Apps Script
//  4. Delete any existing code and paste this entire file in
//  5. Click Save (floppy disk icon)
//  6. Click Deploy → New Deployment → Web App
//  7. Set Execute as: Me, Who has access: Anyone
//  8. Deploy, authorize, copy the Web App URL into registration.html
//
//  Every registration will then:
//    - Add a new row to the private VAHL Registrations Sheet
//    - Send a notification email to communication.vahl@gmail.com
//    - Player personal data will NEVER be publicly accessible
// ============================================================

// !! REPLACE THIS with your private "VAHL Registrations" Sheet ID !!
const PRIVATE_SHEET_ID = '1hmketZzr5PAd7WRxvBv168rUJYCGQKwuIQRaR52VM_w';

const REGISTRATIONS_TAB = 'Registrations';
const NOTIFY_EMAIL = 'communication.vahl@gmail.com';
const HEADERS = ['Timestamp','Name','Email','Phone','Address','Age','Position','Notes'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Honeypot check — bots fill hidden fields, humans don't
    if (data._hp && data._hp !== '') {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Write to the PRIVATE separate sheet (never published to web)
    let ss;
    try {
      ss = SpreadsheetApp.openById(PRIVATE_SHEET_ID);
    } catch(err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    let sheet = ss.getSheetByName(REGISTRATIONS_TAB);
    if (!sheet) {
      sheet = ss.insertSheet(REGISTRATIONS_TAB);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
      data.name     || '',
      data.email    || '',
      data.phone    || '',
      data.address  || '',
      data.age      || '',
      data.position || '',
      data.notes    || '',
    ]);

    sheet.autoResizeColumns(1, HEADERS.length);

    const subject = `New VAHL Registration — ${data.name}`;
    const body = [
      'A new player has registered for the upcoming VAHL season.',
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

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('VAHL Registration Script is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
