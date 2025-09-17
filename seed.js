const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    await client.connect();
    console.log("Connected to database");

    // 1️⃣ Create bcrypt hash for test user
    const password = 'Test1234'; // <-- your test password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2️⃣ Insert user
    const userResult = await client.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id`,
      ['testuser', hashedPassword]
    );
    const userId = userResult.rows[0].id;
    console.log('User created with id:', userId);

    // 3️⃣ Insert user preferences
    await client.query(
      `INSERT INTO user_preferences (
        user_id, eats_meat, eats_pork, eats_fish, eats_soups,
        lozzi_ok, maija_ok, piato_ok, rentukka_ok, taide_ok, tilia_ok, uno_ok, ylisto_ok,
        only_295, only_glutenfree, only_dairyfree, only_lactosefree,
        eats_vegetarian, eats_vegan
      ) VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE)`,
      [userId]
    );
    console.log('User preferences added');

    // 4️⃣ Add restaurants
    const restaurants = [
      { name: "Lozzi", cost_number: "1401" },
      { name: "Piato", cost_number: "1408" },
      { name: "Maija", cost_number: "1402" },
      { name: "Tilia", cost_number: "1413" },
      { name: "Uno", cost_number: "1414" },
      { name: "Ylistö", cost_number: "1403" },
      { name: "Rentukka", cost_number: "1416" },
      { name: "Taide", cost_number: "0301" }
    ];

    for (const r of restaurants) {
      await client.query(
        `INSERT INTO restaurants (name, cost_number) VALUES ($1, $2) ON CONFLICT (cost_number) DO NOTHING`,
        [r.name, r.cost_number]
      );
    }
    console.log('Restaurants added');

    // 5️⃣ Insert a sample menu and meals for Lozzi
    const menuResult = await client.query(
      `INSERT INTO menus (restaurant_id, date, lunch_time)
       VALUES ((SELECT id FROM restaurants WHERE cost_number='1401'), CURRENT_DATE, '11:00 - 14:00') RETURNING id`
    );
    const menuId = menuResult.rows[0].id;

    const meals = [
      { name: 'Broileri curry', price: '5,50', components: ['Broileri (L,G)', 'Riisi (G)', 'Currykastike (M,L)'] },
      { name: 'Kasvispasta', price: '4,50', components: ['Pasta (G)', 'Kasvikset (L)', 'Kasviskastike (M)'] }
    ];

    for (const meal of meals) {
      const mealResult = await client.query(
        `INSERT INTO meals (menu_id, name, price) VALUES ($1, $2, $3) RETURNING id`,
        [menuId, meal.name, meal.price]
      );
      const mealId = mealResult.rows[0].id;

      for (const component of meal.components) {
        await client.query(
          `INSERT INTO meal_components (meal_id, component) VALUES ($1, $2)`,
          [mealId, component]
        );
      }
    }

    console.log('Sample meals and components added');
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

seed();
