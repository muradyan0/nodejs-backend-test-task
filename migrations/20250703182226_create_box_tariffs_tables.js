exports.up = function (knex) {
    return knex.schema
        .createTable('delivery_plans', (table) => {
            table.increments('id').primary();
            table.date('dt_next_box');
            table.date('dt_till_max');
            table.timestamps(true, true); // adds created_at and updated_at
        })
        .then(() => {
            return knex.schema.createTable('warehouse_details', (table) => {
                table.increments('id').primary();
                table.integer('delivery_plan_id').unsigned().notNullable();
                table.string('warehouse_name', 255).notNullable();
                table.decimal('box_delivery_and_storage_expr', 10, 2).notNullable();
                table.decimal('box_delivery_base', 10, 2).notNullable();
                table.decimal('box_delivery_liter', 10, 2).notNullable();
                table.decimal('box_storage_base', 10, 2).notNullable();
                table.decimal('box_storage_liter', 10, 2).notNullable();

                // Foreign key constraint
                table.foreign('delivery_plan_id')
                    .references('id')
                    .inTable('delivery_plans')
                    .onDelete('CASCADE');
            });
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('warehouse_details')
        .then(() => knex.schema.dropTableIfExists('delivery_plans'));
};