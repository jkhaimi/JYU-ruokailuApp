const express = require('express');
const axios = require('axios');
const client = require('./db');
const app = express();
app.use(express.json());

async function fetchMenus() {
    try {
        const response = await axios.get('https://www.semma.fi/menuapi/feed/json?costNumber=1401&language=fi');
        return response.data;  // Palautetaan JSON-data
    } catch (error) {
        console.error('Error fetching menus:', error);
        throw error;
    }
}

async function insertMenusToDb(menus) {
    for (const menu of menus) {
        try {
            const menuQuery = `
                INSERT INTO menus (date, lunch_time)
                VALUES ($1, $2) RETURNING id
            `;
            const menuResult = await client.query(menuQuery, [menu.Date, menu.LunchTime]);
            const menuId = menuResult.rows[0].id;

            for (const meal of menu.SetMenus) {
                console.log("Processing meal:", meal.Name);
                const mealQuery = `
                    INSERT INTO meals (menu_id, name, price)
                    VALUES ($1, $2, $3) RETURNING id
                `;
                const mealResult = await client.query(mealQuery, [menuId, meal.Name, meal.Price]);
                const mealId = mealResult.rows[0].id; 

                for (const component of meal.Components) {
                    console.log("Adding component:", component);
                    const componentQuery = `
                        INSERT INTO meal_components (meal_id, component)
                        VALUES ($1, $2)
                    `;
                    await client.query(componentQuery, [mealId, component]);
                }
            }
            console.log(`Menu for ${menu.Date} added with meals and components.`);
        } catch (err) {
            console.error("Error inserting menu, meals, or components:", err);
        }
    }
}

app.get('/api/fetch-and-insert', async (req, res) => {
    try {
        const data = await fetchMenus(); 
        await insertMenusToDb(data.MenusForDays);
        res.send('Menus inserted successfully!');
    } catch (error) {
        res.status(500).send('Error fetching and inserting menus');
    }
});

app.get('/api/get-menu', async (req, res) => {
    try {
        const data = await fetchMenus();
    } catch (error) {
        res.status(500).send('Error fetching menus');
    }
})

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
