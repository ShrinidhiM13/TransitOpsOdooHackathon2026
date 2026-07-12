import pool from './api/config/db';

async function main() {
  console.log("Seeding rich mock data into the database...");
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Clean up existing generated rich data to allow re-seeding without duplicate key errors
    console.log("Cleaning up previously seeded rich mock data...");
    await conn.execute("DELETE FROM expenses WHERE id LIKE 'exp_rich_%'");
    await conn.execute("DELETE FROM fuel_logs WHERE id LIKE 'fuel_rich_%'");
    await conn.execute("DELETE FROM maintenance_logs WHERE id LIKE 'maint_rich_%'");
    await conn.execute("DELETE FROM trips WHERE id LIKE 'trp_rich_%'");

    // 2. Define rich historical trips
    const trips = [
      {
        id: 'trp_rich_1',
        source: 'Mumbai',
        destination: 'Pune',
        vehicleId: 'veh_0912380',
        driverId: 'drv_102938',
        cargoWeight: 4500.00,
        plannedDistance: 148.00,
        status: 'Completed',
        finalOdometer: 10148.00,
        fuelConsumedLiters: 18.00,
        fuelCost: 1800.00,
        date: '2026-06-05 10:00:00'
      },
      {
        id: 'trp_rich_2',
        source: 'Delhi',
        destination: 'Jaipur',
        vehicleId: 'veh_0912382',
        driverId: 'drv_102939',
        cargoWeight: 3500.00,
        plannedDistance: 270.00,
        status: 'Completed',
        finalOdometer: 15270.00,
        fuelConsumedLiters: 32.00,
        fuelCost: 3200.00,
        date: '2026-06-08 08:30:00'
      },
      {
        id: 'trp_rich_3',
        source: 'Bengaluru',
        destination: 'Chennai',
        vehicleId: 'veh_0912383',
        driverId: 'drv_102940',
        cargoWeight: 6000.00,
        plannedDistance: 350.00,
        status: 'Completed',
        finalOdometer: 20350.00,
        fuelConsumedLiters: 55.00,
        fuelCost: 5500.00,
        date: '2026-06-12 06:00:00'
      },
      {
        id: 'trp_rich_4',
        source: 'Mumbai',
        destination: 'Ahmedabad',
        vehicleId: 'veh_0912381',
        driverId: 'drv_102938',
        cargoWeight: 5000.00,
        plannedDistance: 520.00,
        status: 'Completed',
        finalOdometer: 11520.00,
        fuelConsumedLiters: 85.00,
        fuelCost: 8500.00,
        date: '2026-06-15 05:00:00'
      },
      {
        id: 'trp_rich_5',
        source: 'Delhi',
        destination: 'Agra',
        vehicleId: 'veh_0912382',
        driverId: 'drv_102939',
        cargoWeight: 3000.00,
        plannedDistance: 230.00,
        status: 'Completed',
        finalOdometer: 15500.00,
        fuelConsumedLiters: 28.00,
        fuelCost: 2800.00,
        date: '2026-06-18 09:00:00'
      },
      {
        id: 'trp_rich_6',
        source: 'Pune',
        destination: 'Hyderabad',
        vehicleId: 'veh_0912380',
        driverId: 'drv_102940',
        cargoWeight: 4800.00,
        plannedDistance: 560.00,
        status: 'Completed',
        finalOdometer: 10708.00,
        fuelConsumedLiters: 92.00,
        fuelCost: 9200.00,
        date: '2026-06-22 04:00:00'
      },
      {
        id: 'trp_rich_7',
        source: 'Chennai',
        destination: 'Hyderabad',
        vehicleId: 'veh_0912383',
        driverId: 'drv_102938',
        cargoWeight: 5200.00,
        plannedDistance: 630.00,
        status: 'Completed',
        finalOdometer: 20980.00,
        fuelConsumedLiters: 105.00,
        fuelCost: 10500.00,
        date: '2026-06-26 05:30:00'
      },
      {
        id: 'trp_rich_8',
        source: 'Kolkata',
        destination: 'Patna',
        vehicleId: 'veh_0912381',
        driverId: 'drv_102939',
        cargoWeight: 4000.00,
        plannedDistance: 580.00,
        status: 'Completed',
        finalOdometer: 12100.00,
        fuelConsumedLiters: 96.00,
        fuelCost: 9600.00,
        date: '2026-06-30 07:00:00'
      },
      {
        id: 'trp_rich_9',
        source: 'Mumbai',
        destination: 'Nashik',
        vehicleId: 'veh_0912380',
        driverId: 'drv_102940',
        cargoWeight: 4200.00,
        plannedDistance: 170.00,
        status: 'Completed',
        finalOdometer: 10878.00,
        fuelConsumedLiters: 22.00,
        fuelCost: 2200.00,
        date: '2026-07-03 11:00:00'
      },
      {
        id: 'trp_rich_10',
        source: 'Bengaluru',
        destination: 'Mysuru',
        vehicleId: 'veh_0912383',
        driverId: 'drv_102938',
        cargoWeight: 3800.00,
        plannedDistance: 140.00,
        status: 'Completed',
        finalOdometer: 21120.00,
        fuelConsumedLiters: 16.00,
        fuelCost: 1600.00,
        date: '2026-07-06 13:00:00'
      },
      {
        id: 'trp_rich_11',
        source: 'Delhi',
        destination: 'Chandigarh',
        vehicleId: 'veh_0912382',
        driverId: 'drv_102939',
        cargoWeight: 4600.00,
        plannedDistance: 250.00,
        status: 'Completed',
        finalOdometer: 15750.00,
        fuelConsumedLiters: 34.00,
        fuelCost: 3400.00,
        date: '2026-07-09 08:00:00'
      },
      {
        id: 'trp_rich_12',
        source: 'Mumbai',
        destination: 'Surat',
        vehicleId: 'veh_0912380',
        driverId: 'drv_102940',
        cargoWeight: 5000.00,
        plannedDistance: 280.00,
        status: 'Completed',
        finalOdometer: 11158.00,
        fuelConsumedLiters: 42.00,
        fuelCost: 4200.00,
        date: '2026-07-11 09:30:00'
      }
    ];

    console.log(`Inserting ${trips.length} historical trips...`);
    for (const t of trips) {
      await conn.execute(
        `INSERT INTO trips (id, source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status, finalOdometer, fuelConsumedLiters, fuelCost, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.source, t.destination, t.vehicleId, t.driverId, t.cargoWeight, t.plannedDistance, t.status, t.finalOdometer, t.fuelConsumedLiters, t.fuelCost, t.date]
      );

      // Insert Fuel Log
      await conn.execute(
        `INSERT INTO fuel_logs (id, vehicleId, driverId, tripId, liters, costPerLiter, totalCost, odometer, date, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`fuel_rich_${t.id}`, t.vehicleId, t.driverId, t.id, t.fuelConsumedLiters, 100.00, t.fuelCost, t.finalOdometer, t.date, t.date]
      );

      // Insert Fuel operational expense
      await conn.execute(
        `INSERT INTO expenses (id, vehicleId, tripId, driverId, amount, category, description, date, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`exp_rich_fuel_${t.id}`, t.vehicleId, t.id, t.driverId, t.fuelCost, 'Fuel', `Fuel logging on trip completion: ${t.fuelConsumedLiters}L`, t.date, t.date]
      );

      // Insert Toll plaza operational expense (randomized toll amounts)
      const tollAmount = 250 + Math.floor(Math.random() * 550);
      await conn.execute(
        `INSERT INTO expenses (id, vehicleId, tripId, driverId, amount, category, description, date, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`exp_rich_toll_${t.id}`, t.vehicleId, t.id, t.driverId, tollAmount, 'Toll', 'Toll plaza charges', t.date, t.date]
      );
    }

    // 3. Define and Insert Maintenance logs
    const maintenance = [
      {
        id: 'maint_rich_1',
        vehicleId: 'veh_0912384',
        description: 'Scheduled general servicing, engine tuning and oil change',
        type: 'Scheduled',
        cost: 12000.00,
        startDate: '2026-06-10 09:00:00',
        endDate: '2026-06-12 17:00:00',
        finalCost: 12500.00,
        status: 'Closed',
        notes: 'Oil filter replaced. General servicing checklist cleared.'
      },
      {
        id: 'maint_rich_2',
        vehicleId: 'veh_0912380',
        description: 'Brake pad replacement and brake fluid bleeding',
        type: 'Unscheduled',
        cost: 5000.00,
        startDate: '2026-06-24 10:00:00',
        endDate: '2026-06-25 15:00:00',
        finalCost: 5200.00,
        status: 'Closed',
        notes: 'Replaced front disc brake pads. Bleeded brake lines.'
      },
      {
        id: 'maint_rich_3',
        vehicleId: 'veh_0912383',
        description: 'Suspension check and wheel alignment alignment',
        type: 'Scheduled',
        cost: 8000.00,
        startDate: '2026-07-02 08:30:00',
        endDate: '2026-07-03 16:30:00',
        finalCost: 8500.00,
        status: 'Closed',
        notes: 'Front shock absorbers replaced under warranty. Alignment complete.'
      }
    ];

    console.log(`Inserting ${maintenance.length} maintenance records...`);
    for (const m of maintenance) {
      await conn.execute(
        `INSERT INTO maintenance_logs (id, vehicleId, description, type, cost, startDate, endDate, finalCost, status, notes, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.vehicleId, m.description, m.type, m.cost, m.startDate, m.endDate, m.finalCost, m.status, m.notes, m.startDate]
      );

      // Insert corresponding maintenance expense
      await conn.execute(
        `INSERT INTO expenses (id, vehicleId, amount, category, description, date, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`exp_rich_maint_${m.id}`, m.vehicleId, m.finalCost, 'Maintenance', `Resolved maintenance log: ${m.description}. Note: ${m.notes}`, m.endDate, m.endDate]
      );
    }

    // 4. Update the actual odometer on the vehicles table to match their last final odometer
    console.log("Updating vehicle odometers based on historical trips...");
    await conn.execute("UPDATE vehicles SET odometer = 11158.00 WHERE id = 'veh_0912380'");
    await conn.execute("UPDATE vehicles SET odometer = 12100.00 WHERE id = 'veh_0912381'");
    await conn.execute("UPDATE vehicles SET odometer = 15750.00 WHERE id = 'veh_0912382'");
    await conn.execute("UPDATE vehicles SET odometer = 21120.00 WHERE id = 'veh_0912383'");

    await conn.commit();
    console.log("Database seeded with rich historical data successfully!");

  } catch (error: any) {
    await conn.rollback();
    console.error("Failed to seed rich mock data:", error.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
