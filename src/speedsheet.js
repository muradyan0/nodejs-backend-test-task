const fs = require("fs");
const { google } = require("googleapis");

const SHEET_NAME = "stocks_coefs";

async function getSheetId(id, sheets) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: id,
  });
  return spreadsheet.data.sheets.find(
    (sheet) => sheet.properties.title === SHEET_NAME,
  ).properties.sheetId;
}

async function initializeSheet(id, sheets) {
  let response;
  try {
    response = await sheets.spreadsheets.get({
      spreadsheetId: id,
      ranges: [`${SHEET_NAME}!A1:Z`],
      includeGridData: false,
    });
  } catch (err) {}
  try {
    // Check if sheet exists and has proper structure

    const sheetExists = response?.data.sheets.some(
      (sheet) => sheet.properties.title === SHEET_NAME,
    );

    if (!sheetExists) {
      // Create new sheet with title and headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                },
              },
            },
          ],
        },
      });

      // Add title and headers
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: id,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: [
            {
              range: `${SHEET_NAME}!A1`,
              values: [
                [
                  "Created Date",
                  "Next Box Date",
                  "Till Max Date",
                  "Warehouse Name",
                  "Delivery Expr",
                  "Delivery Base",
                  "Delivery Liter",
                  "Storage Base",
                  "Storage Liter",
                ],
              ],
            },
          ],
        },
      });

      const response = await sheets.spreadsheets.get({
        spreadsheetId: id,
        ranges: [`${SHEET_NAME}!A1:Z`],
        includeGridData: false,
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: response.data.sheets[0].properties.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 9,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      bold: true,
                      fontSize: 16,
                    },
                    horizontalAlignment: "CENTER",
                  },
                },
                fields: "userEnteredFormat(textFormat,horizontalAlignment)",
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error initializing sheet:", error.message);
    throw error;
  }
}

async function getAuthClient(credFilepath) {
  const credentials = JSON.parse(fs.readFileSync(credFilepath));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return await auth.getClient();
}

async function updateSheet(sheetID, credFilepath, data) {
  try {
    const authClient = await getAuthClient(credFilepath);
    const sheets = google.sheets({ version: "v4", auth: authClient });

    await initializeSheet(sheetID, sheets);

    const sheetId = await getSheetId(sheetID, sheets);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetID,
      range: `${SHEET_NAME}!A2:Z`, // Keeps header row (row 1)
    });

    const today = new Date().toISOString().split("T")[0];

    const sortedWarehouseList = [...data.warehouseList].sort((a, b) => {
      const valA = parseFloat(a.boxDeliveryAndStorageExpr.replace(",", "."));
      const valB = parseFloat(b.boxDeliveryAndStorageExpr.replace(",", "."));
      return valA - valB;
    });

    const rowsData = sortedWarehouseList.map((warehouse, index) => [
      index === 0 ? today : "", // Only show date in first row
      index === 0 ? data.dtNextBox : "", // Only show dates in first row
      index === 0 ? data.dtTillMax : "", // Only show dates in first row
      warehouse.warehouseName,
      warehouse.boxDeliveryAndStorageExpr.replace(",", "."),
      warehouse.boxDeliveryBase.replace(",", "."),
      warehouse.boxDeliveryLiter.replace(",", "."),
      warehouse.boxStorageBase.replace(",", "."),
      warehouse.boxStorageLiter.replace(",", "."),
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetID,
      range: `${SHEET_NAME}!A2:I${rowsData.length + 1}`, // +1 because range is 1-based
      valueInputOption: "USER_ENTERED",
      resource: {
        values: rowsData,
      },
    });

    console.log(`Sheet ${sheetID} cleared and new data successfully written`);
  } catch (error) {
    console.error("Error updating Google Sheet:", error);
    throw error;
  }
}

module.exports = {
  updateSheet: updateSheet,
};
