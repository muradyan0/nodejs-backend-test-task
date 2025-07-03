const knex = require("knex");
const config = require("../knexfile.js");

async function runMigrations() {
  try {
    const db = knex(
      config[
        process.env.NODE_ENV === "production" ? "production" : "development"
      ],
    );

    console.log("Running database migrations...");
    await db.migrate.latest();
    console.log("Migrations completed successfully");

    return db;
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

async function saveOrUpdateDeliveryPlanInDB(data) {
  const db = knex(
    config[
      process.env.NODE_ENV === "production" ? "production" : "development"
    ],
  );

  try {
    await db.transaction(async (trx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingPlan = await trx("delivery_plans")
        .where(db.raw("DATE(created_at) = ?", [today]))
        .first();

      let deliveryPlanId;

      if (existingPlan) {
        deliveryPlanId = existingPlan.id;
        console.log(
          `Updating existing plan (ID: ${deliveryPlanId}) created today`,
        );

        await trx("delivery_plans")
          .where("id", deliveryPlanId)
          .update({
            dt_next_box: data.dtNextBox !== "" ? data.dtNextBox : null,
            dt_till_max: data.dtTillMax !== "" ? data.dtTillMax : null,
            updated_at: db.fn.now(),
          });

        await trx("warehouse_details")
          .where("delivery_plan_id", deliveryPlanId)
          .delete();
      } else {
        console.log("Creating new delivery plan");
        const [newPlan] = await trx("delivery_plans")
          .insert({
            dt_next_box: data.dtNextBox !== "" ? data.dtNextBox : null,
            dt_till_max: data.dtTillMax !== "" ? data.dtTillMax : null,
            created_at: db.fn.now(),
            updated_at: db.fn.now(),
          })
          .returning("id");

        deliveryPlanId = newPlan.id;
      }

      // Prepare warehouse details
      const warehouseDetails = data.warehouseList.map((warehouse) => ({
        delivery_plan_id: deliveryPlanId,
        warehouse_name: warehouse.warehouseName,
        box_delivery_and_storage_expr: parseFloat(
          warehouse.boxDeliveryAndStorageExpr.replace(",", "."),
        ),
        box_delivery_base: parseFloat(
          warehouse.boxDeliveryBase.replace(",", "."),
        ),
        box_delivery_liter: parseFloat(
          warehouse.boxDeliveryLiter.replace(",", "."),
        ),
        box_storage_base: parseFloat(
          warehouse.boxStorageBase.replace(",", "."),
        ),
        box_storage_liter: parseFloat(
          warehouse.boxStorageLiter.replace(",", "."),
        ),
      }));

      // Insert warehouse details
      await trx("warehouse_details").insert(warehouseDetails);
    });

    console.log("Delivery plan processed successfully");
  } catch (error) {
    console.error("Error processing delivery plan:", error);
    throw error;
  } finally {
    await db.destroy();
  }
}

module.exports = {
  saveOrUpdateDeliveryPlanInDB: saveOrUpdateDeliveryPlanInDB,
  runMigrations: runMigrations,
};
