const fs = require("fs");

const { saveOrUpdateDeliveryPlanInDB, runMigrations } = require("./db");
const { updateSheet } = require("./speedsheet");
const { fetchFromWBBoxTariffs } = require("./wb");

const rawData = fs.readFileSync("./settings.json", "utf8");
const userSettings = JSON.parse(rawData);

if (!userSettings.wbAPIKEY) {
  console.error(
    "must specify wildberries api key wbAPIKEY in settings.json file",
  );
}

if (!userSettings.speedsheets.length === 0) {
  console.error("must specify google speedsheets in settings.json file");
}

(async () => {
  await runMigrations();

  async function main() {
    const tariffs = await fetchFromWBBoxTariffs(userSettings.wbAPIKEY);
    if (tariffs) {
      await saveOrUpdateDeliveryPlanInDB(tariffs);
      for (const sheet of userSettings.speedsheets) {
        await updateSheet(sheet.id, sheet.cred_filepath, tariffs);
      }
    }
  }

  main();

  const HOUR = 1 * 60 * 60 * 1000;
  setInterval(main, HOUR);
})();
