const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('./db');
const app = express();
const SECRET_KEY = "your_secret_key"; 
const moment = require('moment');
app.use(cors());
app.use(express.json());

const RESTAURANTS = [
    { name: "Lozzi", costNumber: "1401" },
    { name: "Piato", costNumber: "1408" },
    { name: "Maija", costNumber: "1402" },
    { name: "Tilia", costNumber: "1413" },
    { name: "Uno", costNumber: "1414" },
    { name: "Ylistö", costNumber: "1403" },
    { name: "Rentukka", costNumber: "1416"}

];

// Hakee kaikkien ravintoloiden listat
async function fetchMenusForAllRestaurants() {
    let allMenus = [];

    for (const restaurant of RESTAURANTS) {
        try {
            const response = await axios.get(`https://www.semma.fi/menuapi/feed/json?costNumber=${restaurant.costNumber}&language=fi`);
            allMenus.push({ restaurantId: restaurant.costNumber, menus: response.data.MenusForDays });
        } catch (error) {
            console.error(`Error fetching menus for ${restaurant.name}:`, error);
        }
    }

    return allMenus;
}

// Lisää kaikkien ravintoloiden tiedot tauluun
async function insertRestaurantsToDb() {
    for (const restaurant of RESTAURANTS) {
        try {
            await client.query(
                `INSERT INTO restaurants (name, cost_number) 
                 VALUES ($1, $2) 
                 ON CONFLICT (cost_number) DO NOTHING`,
                [restaurant.name, restaurant.costNumber]
            );
        } catch (err) {
            console.error("Error inserting restaurant:", err);
        }
    }
}

// Lisää kaikkien ravintoloiden ruokalistat tauluun
async function insertMenusToDb(allMenus) {
    for (const { restaurantId, menus } of allMenus) {
        try {
            // Haetaan ravintolan id tietokannasta
            const restaurantResult = await client.query(
                `SELECT id FROM restaurants WHERE cost_number = $1`, 
                [restaurantId]
            );
            if (restaurantResult.rows.length === 0) {
                console.error(`Restaurant with costNumber ${restaurantId} not found in database.`);
                continue;
            }
            const restaurantDbId = restaurantResult.rows[0].id;

            for (const menu of menus) {
                const menuQuery = `
                    INSERT INTO menus (date, lunch_time, restaurant_id)
                    VALUES ($1, $2, $3) RETURNING id
                `;
                const menuResult = await client.query(menuQuery, [
                    menu.Date.split("T")[0], 
                    menu.LunchTime, 
                    restaurantDbId
                ]);
                const menuId = menuResult.rows[0].id;

                for (const meal of menu.SetMenus) {
                    if (!meal.Name) {
                        console.warn(`Skipping meal with missing name in restaurant ${restaurantId} on ${menu.Date}`);
                        continue;
                    }

                    const mealQuery = `
                        INSERT INTO meals (menu_id, name, price)
                        VALUES ($1, $2, $3) RETURNING id
                    `;
                    const mealResult = await client.query(mealQuery, [
                        menuId, 
                        meal.Name, 
                        meal.Price || '' // Jos hinta puuttuu, asetetaan tyhjä string
                    ]);
                    const mealId = mealResult.rows[0].id;

                    for (const component of meal.Components || []) {
                        const componentQuery = `
                            INSERT INTO meal_components (meal_id, component)
                            VALUES ($1, $2)
                        `;
                        await client.query(componentQuery, [mealId, component]);
                    }
                }
            }
        } catch (err) {
            console.error("Error inserting menus:", err);
        }
    }
}


// Lisää tiedot tauluihin
app.get('/api/fetch-and-insert', async (req, res) => {
    try {
        await insertRestaurantsToDb(); // Lisää ravintolat tietokantaan
        const allMenus = await fetchMenusForAllRestaurants(); // Hakee kaikki ruokalistat
        await insertMenusToDb(allMenus); // Tallentaa ne tietokantaan
        res.send('All menus inserted successfully!');
    } catch (error) {
        console.error("Error in fetch-and-insert:", error);
        res.status(500).send('Error fetching and inserting menus');
    }
});


app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Käyttäjän lisääminen ja sen ID:n saaminen
        const userResult = await client.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        );
        const userId = userResult.rows[0].id;

        // Lisää oletuspreferenssit käyttäjälle
        await client.query(
            'INSERT INTO user_preferences (user_id, eats_meat, eats_pork, eats_fish, eats_soups) VALUES ($1, $2, $3, $4, $5)',
            [userId, true, true, true, true] // Oletusarvot
        );

        res.status(201).send({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send({ message: "Error registering user" });
    }
});


// Kirjaa käyttäjän sisään
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).send({ message: "Invalid email" });
        }

        console.log("User found:", user.rows[0]);

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            console.log("Invalid password inserted")
            return res.status(400).send({ message: "Invalid password" });
        }

const token = jwt.sign({ userId: user.rows[0].id }, SECRET_KEY, { expiresIn: '1h' });
res.send({ token, userId: user.rows[0].id });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ message: "Error logging in" });
    }
});

// Hakee dashboardiin tämän päivän ruokalistan ja filteröit ruoat
app.get('/api/todays-menu', async (req, res) => {
    try {
        const userId = req.query.userId; // Käyttäjän ID tulee frontista
        console.log("Received userId:", userId);
        if (!userId) {
            return res.status(400).json({ message: "Käyttäjä ID puuttuu." });
        }

        const today = moment().format('YYYY-MM-DD');

        // Haetaan käyttäjän ruokapreferenssit
        const prefQuery = `SELECT * FROM user_preferences WHERE user_id = $1`;
        const prefResult = await client.query(prefQuery, [userId]);
        if (prefResult.rows.length === 0) {
            return res.status(404).json({ message: "Käyttäjän ruokapreferenssejä ei löydy." });
        }
        const preferences = prefResult.rows[0];

        // Haetaan päivän ruokalista
        const menusQuery = `
            SELECT r.name as restaurant_name, 
                   meal.id as meal_id, meal.name as meal_name, meal.price,
                   mc.component
            FROM menus m
            JOIN restaurants r ON m.restaurant_id = r.id
            LEFT JOIN meals meal ON meal.menu_id = m.id
            LEFT JOIN meal_components mc ON mc.meal_id = meal.id
            WHERE m.date = $1
            ORDER BY r.name, meal.id;
        `;
        const result = await client.query(menusQuery, [today]);

        // Järjestellään ruokalistat ravintoloiden mukaan
        const formattedMenus = [];
        result.rows.forEach(row => {
            let restaurant = formattedMenus.find(r => r.restaurant === row.restaurant_name);
            if (!restaurant) {
                restaurant = { restaurant: row.restaurant_name, meals: [] };
                formattedMenus.push(restaurant);
            }

            let meal = restaurant.meals.find(m => m.id === row.meal_id);
            if (!meal) {
                meal = { id: row.meal_id, name: row.meal_name, price: row.price, components: [] };
                restaurant.meals.push(meal);
            }
            if (row.component) meal.components.push(row.component);
        });

        // Filtteröidään käyttäjän preferenssien mukaan
        const filteredMenus = formattedMenus.map(restaurant => ({
            restaurant: restaurant.restaurant,
            meals: restaurant.meals.filter(meal => {
                const components = meal.components.map(c => c.toLowerCase());
                
                // Poistetaan ruokia käyttäjän asetusten perusteella
                if (!preferences.eats_meat && meal.components.some(c => c.toLowerCase().includes("broileri"))) {
                    console.log("Henkilö ei syö lihaa", meal.components);
                    return false;
                }
                if (!preferences.eats_pork && meal.components.some(c => c.toLowerCase().includes("makkara"))) {
                    console.log("Henkilö ei syö sikaa", meal.components);
                    return false;
                }
                if (!preferences.eats_fish && (meal.components.some(c => c.toLowerCase().includes("kala")) || meal.components.some(c => c.toLowerCase().includes("seiti")))){
                    console.log("Henkilö ei syö kalaa", meal.components);
                    return false;
                }
                if (!preferences.eats_soups && meal.components.some(c => c.toLowerCase().includes("keitto"))) {
                    console.log("Henkilö ei syö keittoja:", meal.components);
                    return false;
                }
                if (meal.components.length === 0) {
                    console.log("Tyhjä ruoka")
                    return false;
                }
                return true;
            })
        }));

        console.log("Käyttäjän preferenssit:", preferences);
        res.json(filteredMenus);
    } catch (error) {
        console.error("Error fetching today's menu:", error);
        res.status(500).send({ message: "Error fetching today's menu" });
    }
});



app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
