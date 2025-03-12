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

    // app.use((req, res, next) => {
    //     if (req.headers['x-forwarded-proto'] !== 'https') {
    //         return res.redirect('https://' + req.get('Host') + req.url);
    //     }
    //     next();
    // });

    // app.use(cors({
    //     origin: ['https://jyu-ruokailu-app-kappa.vercel.app', 'http://localhost:3000'],
    //     methods: ['GET', 'POST', 'PUT', 'DELETE'],
    //     credentials: true,
    //     allowedHeaders: ['Content-Type']
    //   }));

const RESTAURANTS = [
    { name: "Lozzi", costNumber: "1401", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Piato", costNumber: "1408", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Maija", costNumber: "1402", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Tilia", costNumber: "1413", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Uno", costNumber: "1414", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Ylistö", costNumber: "1403", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Rentukka", costNumber: "1416", apiBaseUrl: "https://www.semma.fi/menuapi/feed/json" },
    { name: "Taide", costNumber: "0301", apiBaseUrl: "https://www.compass-group.fi/menuapi/feed/json" }
];

//// Ravintolaan littyvien taulujen päivitys

// Hakee kaikkien ravintoloiden listat
async function fetchMenusForAllRestaurants() {
    let allMenus = [];

    for (const restaurant of RESTAURANTS) {
        try {
            const response = await axios.get(`${restaurant.apiBaseUrl}?costNumber=${restaurant.costNumber}&language=fi`);
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
        await insertRestaurantsToDb(); 
        const allMenus = await fetchMenusForAllRestaurants(); 
        await insertMenusToDb(allMenus); 
        res.send('All menus inserted successfully!');
    } catch (error) {
        console.error("Error in fetch-and-insert:", error);
        res.status(500).send('Error fetching and inserting menus');
    }
});

//// Käyttäjiin liittyvien taulujen päivitys

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await client.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );
        const userId = userResult.rows[0].id;
        const registeredUsername = userResult.rows[0].username;

        await client.query(
            'INSERT INTO user_preferences (user_id, eats_meat, eats_pork, eats_fish, eats_soups, lozzi_ok, maija_ok, piato_ok, rentukka_ok, taide_ok, tilia_ok, uno_ok, ylisto_ok, only_295, only_glutenfree, only_dairyfree, only_lactosefree, eats_vegetarian, eats_vegan) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
            [userId, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, true, true] 
        );

        const token = jwt.sign({ userId: userId }, SECRET_KEY, { expiresIn: '1h' });

        res.send({ token, userId, username: registeredUsername });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send({ message: "Ongelma rekisteröinnissä..." });
    }
});

// Kirjaa käyttäjän sisään
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).send({ message: "Väärä käyttäjänimi" });
        }

        console.log("User found:", user.rows[0]);

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            console.log("Invalid password inserted")
            return res.status(400).send({ message: "Väärä salasana" });
        }

        const token = jwt.sign({ userId: user.rows[0].id }, SECRET_KEY, { expiresIn: '1h' });

        res.send({ token, userId: user.rows[0].id, username: user.rows[0].username });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ message: "Sisäänkirjautumisessa ongelmia" });
    }
});

app.post('/api/logout', (req, res) => {
    res.status(200).send({ message: "Uloskirjautuminen onnistui!" });
});

//// Käyttäjien preferenssien päivitys

app.get('/api/user-preferences', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: "Käyttäjä ID puuttuu." });
        }

        const query = `SELECT * FROM user_preferences WHERE user_id = $1`;
        const result = await client.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Käyttäjän ruokapreferenssejä ei löydy." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        res.status(500).send({ message: "Error fetching user preferences" });
    }
});

app.put('/api/user-preferences', async (req, res) => {
    try {
        const { userId, eats_meat, eats_pork, eats_fish, eats_soups, lozzi_ok, maija_ok, piato_ok, rentukka_ok, taide_ok, tilia_ok, uno_ok, ylisto_ok, only_295, only_glutenfree, only_dairyfree, only_lactosefree, eats_vegetarian, eats_vegan } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "Käyttäjä ID puuttuu." });
        }

        const query = `
            UPDATE user_preferences 
            SET eats_meat = $1, eats_pork = $2, eats_fish = $3, eats_soups = $4, lozzi_ok = $5, maija_ok = $6, piato_ok = $7, rentukka_ok = $8, taide_ok = $9, tilia_ok = $10, uno_ok = $11, ylisto_ok = $12, only_295 = $13, only_glutenfree = $14, only_dairyfree = $15, only_lactosefree = $16, eats_vegetarian = $17, eats_vegan = $18
            WHERE user_id = $19
            RETURNING *;
        `;

        const result = await client.query(query, [eats_meat, eats_pork, eats_fish, eats_soups, lozzi_ok, maija_ok, piato_ok, rentukka_ok, taide_ok, tilia_ok, uno_ok, ylisto_ok, only_295, only_glutenfree, only_dairyfree, only_lactosefree, eats_vegetarian, eats_vegan, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Käyttäjän ruokapreferenssejä ei löytynyt." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating user preferences:", error);
        res.status(500).send({ message: "Error updating user preferences" });
    }
});

/// Arvosteluiden päivitys

// Lisää arvostelun tietylle ruoalle
app.post('/api/reviews', async (req, res) => {
    const { meal_id, rating, comment, userId } = req.body;
    if (!userId || !meal_id) {
        return res.status(400).json({ message: "Käyttäjä ID tai ateria ID puuttuu." });
    }
    try {
        const mealResult = await client.query('SELECT * FROM meals WHERE id = $1', [meal_id]);
        if (mealResult.rows.length === 0) {
            return res.status(404).json({ message: "Ateria ei löytynyt." });
        }
        
        const result = await client.query(
            'INSERT INTO meal_reviews (user_id, meal_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, meal_id, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding review:", err.message);
        res.status(500).send({ message: "Virhe arvostelun lisäämisessä." });
    }
});


// Hakee kaikki arvostelut tietylle ruoalle
app.get('/api/reviews/:meal_id', async (req, res) => {
    const { meal_id } = req.params;
    try {
        const result = await client.query('SELECT * FROM meal_reviews WHERE meal_id = $1', [meal_id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching reviews:", err.message);
        res.status(500).send({ message: "Error fetching reviews" });
    }
});


//// Frontendin päivitys

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
const filteredMenus = formattedMenus.filter(restaurant => {
    const blockedRestaurants = [
        { key: "lozzi_ok", name: "lozzi" },
        { key: "maija_ok", name: "maija" },
        { key: "piato_ok", name: "piato" },
        { key: "rentukka_ok", name: "rentukka" },
        { key: "taide_ok", name: "taide" },
        { key: "tilia_ok", name: "tilia" },
        { key: "uno_ok", name: "uno" },
        { key: "ylisto_ok", name: "ylistö" }
    ];

    if (blockedRestaurants.some(r => !preferences[r.key] && restaurant.restaurant.toLowerCase() === r.name)) {
        console.log(`Henkilö ei syö ${restaurant.restaurant}`);
        return false;
    }

    return true;
})
    .map(restaurant => ({
        restaurant: restaurant.restaurant,
        meals: restaurant.meals.filter(meal => {

            // Tarkistettavat allergeenit ja niiden vastaavat preferenssit
            const allergenFilters = [
                { key: "only_glutenfree", allergen: "G" },
                { key: "only_dairyfree", allergen: "M" },
                { key: "only_lactosefree", allergen: "L" }
            ];

            const filterByAllergens = (meal, filters) => {
                return filters.every(filter => {
                    if (!preferences[filter.key]) return true;

                    return meal.components.every(component => {
                        const tags = component.match(/\((.*?)\)/);
                        if (!tags) return false; 

                        const allergens = tags[1].split(",").map(tag => tag.trim());
                        return allergens.includes(filter.allergen);
                    });
                });
            };

            if (!filterByAllergens(meal, allergenFilters)) {
                console.log("Ateria ei täytä allergeenivaatimuksia, poistetaan:", meal.components);
                return false;
            }

            const dietFilters = [
                { key: "eats_meat", blockedWords: ["broileri", "nauta", "kana", "liha", "chicken", "meetvursti", "naudanlihaa", "makkara", "kinkku", "sianliha", "pekoni", "porsas", "kebab"] },
                { key: "eats_pork", blockedWords: ["makkara", "kinkku", "sianliha", "pekoni", "porsas", "wieninleike"] },
                { key: "eats_fish", blockedWords: ["kala", "seiti", "lohi", "lohta", "silakka", "kampela"] },
                { key: "eats_soups", blockedWords: ["keitto"] }
            ];

            const filterByDiet = (meal, filters) => {
                return filters.every(filter => {
                    if (preferences[filter.key]) return true;
    
                    return !meal.components.some(component => 
                        filter.blockedWords.some(word => component.toLowerCase().includes(word))
                    );
                });
            };
            
            if (!filterByDiet(meal, dietFilters)) {
                console.log("Ateria ei täytä ruokavaliorajoituksia, poistetaan:", meal.components);
                return false;
            }

            if (!preferences.eats_vegetarian && 
                meal.name.toLowerCase().includes("kasvis") && 
                !meal.name.toLowerCase().includes("vegaani")) { 
                console.log("Henkilö ei syö kasvisruokia, poistetaan:", meal.name);
                return false;
            }

            if (!preferences.eats_vegan && meal.name.toLowerCase().includes("vegaani")) {
                console.log("Henkiö ei syö vegaaniruokia: " + meal.name);
                return false;
            }
            
            if (preferences.only_295 && !meal.price.split("/").some(c => c.toLowerCase().includes("2,95"))) {
                console.log("Henkilö syö vain 2,95 ruokia", meal.price);
                return false;
            }

            if (meal.components.length === 0) {
                console.log("Tyhjä ruoka")
                return false;
            }
            return true;
        })
    }));

// Poistetaan ravintolat, joilla ei ole yhtään ateriaa
const nonEmptyMenus = filteredMenus.filter(restaurant => restaurant.meals.length > 0);
res.json(nonEmptyMenus);

    } catch (error) {
        console.error("Error fetching today's menu:", error);
        res.status(500).send({ message: "Error fetching today's menu" });
    }
});



app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
