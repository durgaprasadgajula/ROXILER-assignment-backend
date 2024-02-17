// const express = require("express");
// const sqlite3 = require("sqlite3");
// const { open } = require("sqlite");
// const path = require("path");
// const cors = require("cors");
// const axios = require("axios");

// const app = express();
// app.use(cors());
// app.use(express.json());

// let database;

// const initializeDBandServer = async () => {
//     try {
//         database = await open({
//             filename: path.join(__dirname, "transactions.db"),
//             driver: sqlite3.Database,
//         });

//         app.listen(3000, () => {
//             console.log("Server is running on http://localhost:3000/");
//         });
//     } catch (error) {
//         console.log(`Database error is ${error.message}`);
//         process.exit(1);
//     }
// };

// initializeDBandServer();

// const intialisedBackendData = async () => {
//     try {
//         const options = {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         };
//         const response = await axios.get(
//             "https://s3.amazonaws.com/roxiler.com/product_transaction.json",
//             options
//         );
//         const data = response.data;
//         for (const element of data) {
//             await database.run(
//                 `INSERT INTO transactions (id, title, price, description, category, sold, dateOfSale)
//                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                 [
//                     element.id,
//                     element.title,
//                     element.price,
//                     element.description,
//                     element.category,
//                     element.sold,
//                     element.dateOfSale,
//                 ]
//             );
//         }

//         console.log("Database initialized with data.");
//     } catch (error) {
//         console.error("Error initializing database with data:", error);
//     }
// };

// intialisedBackendData();

// app.get("/transactions", async (req, res) => {
//     try {
//         const {
//             month = "March",
//             page = 1,
//             perPage = 10,
//             search = "electronics",
//         } = req.query;
//         const offset = (page - 1) * perPage;
//         const limit = perPage;

//         let query = `SELECT * FROM transactions`;
//         const monthMap = {
//             January: "01",
//             February: "02",
//             March: "03",
//             April: "04",
//             May: "05",
//             June: "06",
//             July: "07",
//             August: "08",
//             September: "09",
//             October: "10",
//             November: "11",
//             December: "12",
//         };
//         let selectedMonth = monthMap[month];

//         if (month) {
//             query += ` WHERE strftime('%m', dateOfSale) = '${selectedMonth}'`;
//         }

//         if (search) {
//             query += query.includes("WHERE") ? ` AND ` : ` WHERE `;
//             query += ` (title LIKE '%${search}%' OR description LIKE '%${search}%' OR price LIKE '%${search}%')`;
//         }

//         query += ` LIMIT ${limit} OFFSET ${offset}`;

//         const rows = await database.all(query);
//         res.send(rows);
//     } catch (error) {
//         console.error("Error fetching transactions:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });
// app.get("/transactionStatistics", async (req, res) => {
//     try {
//         const { month = "March" } = req.query;

//         const monthMap = {
//             January: "01",
//             February: "02",
//             March: "03",
//             April: "04",
//             May: "05",
//             June: "06",
//             July: "07",
//             August: "08",
//             September: "09",
//             October: "10",
//             November: "11",
//             December: "12",
//         };
//         const selectedMonth = monthMap[month];

//         const queryTotalAmount = `SELECT SUM(price) AS totalAmount FROM transactions WHERE strftime('%m', dateOfSale) = ?`;
//         const queryTotalSoldItems = `SELECT COUNT(*) AS totalSoldItems FROM transactions WHERE strftime('%m', dateOfSale) = ? AND sold = 1`;
//         const queryTotalUnsoldItems = `SELECT COUNT(*) AS totalUnsoldItems FROM transactions WHERE strftime('%m', dateOfSale) = ? AND sold = 0`;

//         const [totalAmountResult] = await database.all(
//             queryTotalAmount,
//             selectedMonth
//         );
//         const [totalSoldItemsResult] = await database.all(
//             queryTotalSoldItems,
//             selectedMonth
//         );
//         const [totalUnsoldItemsResult] = await database.all(
//             queryTotalUnsoldItems,
//             selectedMonth
//         );

//         const totalAmount = totalAmountResult.totalAmount || 0;
//         const totalSoldItems = totalSoldItemsResult.totalSoldItems || 0;
//         const totalUnsoldItems = totalUnsoldItemsResult.totalUnsoldItems || 0;

//         res.json({ totalAmount, totalSoldItems, totalUnsoldItems });
//     } catch (error) {
//         console.error("Error calculating transaction statistics:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// app.get("/barChart", async (req, res) => {
//     try {
//         const { month } = req.query;
//         const transactions = await getTransactionsForMonth(month);

//         // Define price ranges
//         const priceRanges = [
//             { min: 0, max: 100 },
//             { min: 101, max: 200 },
//             { min: 201, max: 300 },
//             { min: 301, max: 400 },
//             { min: 401, max: 500 },
//             { min: 501, max: 600 },
//             { min: 601, max: 700 },
//             { min: 701, max: 800 },
//             { min: 801, max: 900 },
//             { min: 901, max: Infinity }, // "Infinity" represents anything above 900
//         ];

//         // Initialize count for each price range
//         const priceRangeCounts = priceRanges.map(() => 0);

//         // Iterate through transactions and count items in each price range
//         transactions.forEach((transaction) => {
//             const { price } = transaction;
//             for (let i = 0; i < priceRanges.length; i++) {
//                 const { min, max } = priceRanges[i];
//                 if (price >= min && price <= max) {
//                     priceRangeCounts[i]++;
//                     break;
//                 }
//             }
//         });

//         // Prepare response data
//         const responseData = priceRanges.map((range, index) => ({
//             priceRange: `${range.min} - ${range.max}`,
//             itemCount: priceRangeCounts[index],
//         }));

//         // Send response
//         res.json(responseData);
//     } catch (error) {
//         console.error("Error fetching data for bar chart:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// async function getTransactionsForMonth(month) {
//     try {
//         const monthMap = {
//             January: "01",
//             February: "02",
//             March: "03",
//             April: "04",
//             May: "05",
//             June: "06",
//             July: "07",
//             August: "08",
//             September: "09",
//             October: "10",
//             November: "11",
//             December: "12",
//         };
//         const selectedMonth = monthMap[month];
//         const query = `
//             SELECT *
//             FROM transactions
//             WHERE strftime('%m', dateOfSale) = '${selectedMonth}'`;
//         const transactions = await database.all(query);

//         // Return the transactions retrieved from the database
//         return transactions;
//     } catch (error) {
//         console.error("Error retrieving transactions for month:", error);
//         throw error;
//     }
// }

// app.get("/pieChart", async (req, res) => {
//     try {
//         const { month = "March" } = req.query;
//         const categoriesData = await getCategoryDataForMonth(month);
//         console.log(categoriesData);
//         res.json(categoriesData);
//     } catch (error) {
//         console.error("Error fetching data for pie chart:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// // Function to retrieve category data for the selected month
// async function getCategoryDataForMonth(month) {
//     const monthMap = {
//         January: "01",
//         February: "02",
//         March: "03",
//         April: "04",
//         May: "05",
//         June: "06",
//         July: "07",
//         August: "08",
//         September: "09",
//         October: "10",
//         November: "11",
//         December: "12",
//     };
//     const selectedMonth = monthMap[month];
//     const query = `
//         SELECT category, COUNT(*) AS itemCount
//         FROM transactions
//         WHERE strftime('%m', dateOfSale) = ?
//         GROUP BY category
//     `;
//     const rows = await database.all(query, selectedMonth);
//     return rows.map(({ category, itemCount }) => ({ category, itemCount }));
// }

// module.exports = app;
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

let database;

const initializeDBandServer = async () => {
    try {
        database = await open({
            filename: path.join(__dirname, "transactions.db"),
            driver: sqlite3.Database,
        });

        app.listen(3000, () => {
            console.log("Server is running on http://localhost:3000/");
        });
    } catch (error) {
        console.log(`Database error is ${error.message}`);
        process.exit(1);
    }
};

initializeDBandServer();

const intialisedBackendData = async () => {
    try {
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        };
        const response = await axios.get(
            "https://s3.amazonaws.com/roxiler.com/product_transaction.json",
            options
        );
        const data = response.data;
        for (const element of data) {
            await database.run(
                `INSERT INTO transactions (id, title, price, description, category, sold, dateOfSale)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    element.id,
                    element.title,
                    element.price,
                    element.description,
                    element.category,
                    element.sold,
                    element.dateOfSale,
                ]
            );
        }

        console.log("Database initialized with data.");
    } catch (error) {
        console.error("Error initializing database with data:", error);
    }
};

intialisedBackendData();

app.get("/transactions", async (req, res) => {
    try {
        const {
            month = "March",
            page = 1,
            perPage = 10,
            search = "electronics",
        } = req.query;
        const offset = (page - 1) * perPage;
        const limit = perPage;

        let query = `SELECT * FROM transactions`;
        const monthMap = {
            January: "01",
            February: "02",
            March: "03",
            April: "04",
            May: "05",
            June: "06",
            July: "07",
            August: "08",
            September: "09",
            October: "10",
            November: "11",
            December: "12",
        };
        let selectedMonth = monthMap[month];

        if (month) {
            query += ` WHERE strftime('%m', dateOfSale) = '${selectedMonth}'`;
        }

        if (search) {
            query += query.includes("WHERE") ? ` AND ` : ` WHERE `;
            query += ` (title LIKE '%${search}%' OR description LIKE '%${search}%' OR price LIKE '%${search}%')`;
        }

        query += ` LIMIT ${limit} OFFSET ${offset}`;

        const rows = await database.all(query);
        res.send(rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/transactionStatistics", async (req, res) => {
    try {
        const { month = "March" } = req.query;

        const monthMap = {
            January: "01",
            February: "02",
            March: "03",
            April: "04",
            May: "05",
            June: "06",
            July: "07",
            August: "08",
            September: "09",
            October: "10",
            November: "11",
            December: "12",
        };
        const selectedMonth = monthMap[month];

        const queryTotalAmount = `SELECT SUM(price) AS totalAmount FROM transactions WHERE strftime('%m', dateOfSale) = ?`;
        const queryTotalSoldItems = `SELECT COUNT(*) AS totalSoldItems FROM transactions WHERE strftime('%m', dateOfSale) = ? AND sold = 1`;
        const queryTotalUnsoldItems = `SELECT COUNT(*) AS totalUnsoldItems FROM transactions WHERE strftime('%m', dateOfSale) = ? AND sold = 0`;

        const [totalAmountResult] = await database.all(
            queryTotalAmount,
            selectedMonth
        );
        const [totalSoldItemsResult] = await database.all(
            queryTotalSoldItems,
            selectedMonth
        );
        const [totalUnsoldItemsResult] = await database.all(
            queryTotalUnsoldItems,
            selectedMonth
        );

        const totalAmount = totalAmountResult.totalAmount || 0;
        const totalSoldItems = totalSoldItemsResult.totalSoldItems || 0;
        const totalUnsoldItems = totalUnsoldItemsResult.totalUnsoldItems || 0;

        res.json({ totalAmount, totalSoldItems, totalUnsoldItems });
    } catch (error) {
        console.error("Error calculating transaction statistics:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/barChart", async (req, res) => {
    try {
        const { month } = req.query;
        const transactions = await getTransactionsForMonth(month);

        // Define price ranges
        const priceRanges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }, // "Infinity" represents anything above 900
        ];

        // Initialize count for each price range
        const priceRangeCounts = priceRanges.map(() => 0);

        // Iterate through transactions and count items in each price range
        transactions.forEach((transaction) => {
            const { price } = transaction;
            for (let i = 0; i < priceRanges.length; i++) {
                const { min, max } = priceRanges[i];
                if (price >= min && price <= max) {
                    priceRangeCounts[i]++;
                    break;
                }
            }
        });

        // Prepare response data
        const responseData = priceRanges.map((range, index) => ({
            priceRange: `${range.min} - ${range.max}`,
            itemCount: priceRangeCounts[index],
        }));

        // Send response
        res.json(responseData);
    } catch (error) {
        console.error("Error fetching data for bar chart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

async function getTransactionsForMonth(month) {
    try {
        const monthMap = {
            January: "01",
            February: "02",
            March: "03",
            April: "04",
            May: "05",
            June: "06",
            July: "07",
            August: "08",
            September: "09",
            October: "10",
            November: "11",
            December: "12",
        };
        const selectedMonth = monthMap[month];
        const query = `
            SELECT * 
            FROM transactions 
            WHERE strftime('%m', dateOfSale) = '${selectedMonth}'`;
        const transactions = await database.all(query);

        // Return the transactions retrieved from the database
        return transactions;
    } catch (error) {
        console.error("Error retrieving transactions for month:", error);
        throw error;
    }
}

app.get("/pieChart", async (req, res) => {
    try {
        const { month = "March" } = req.query;
        const categoriesData = await getCategoryDataForMonth(month);
        console.log(categoriesData);
        res.json(categoriesData);
    } catch (error) {
        console.error("Error fetching data for pie chart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Function to retrieve category data for the selected month
async function getCategoryDataForMonth(month) {
    const monthMap = {
        January: "01",
        February: "02",
        March: "03",
        April: "04",
        May: "05",
        June: "06",
        July: "07",
        August: "08",
        September: "09",
        October: "10",
        November: "11",
        December: "12",
    };
    const selectedMonth = monthMap[month];
    const query = `
        SELECT category, COUNT(*) AS itemCount
        FROM transactions
        WHERE strftime('%m', dateOfSale) = ?
        GROUP BY category
    `;
    const rows = await database.all(query, selectedMonth);
    return rows.map(({ category, itemCount }) => ({ category, itemCount }));
}

// Define combined data endpoint
app.get("/combinedData", async (req, res) => {
    try {
        const transactionStatistics = await axios.get(
            `http://localhost:3000/transactionStatistics?month=${req.query.month}`
        );
        const barChartData = await axios.get(
            `http://localhost:3000/barChart?month=${req.query.month}`
        );
        const pieChartData = await axios.get(
            `http://localhost:3000/pieChart?month=${req.query.month}`
        );

        // Combine the responses
        const combinedData = {
            transactionStatistics: transactionStatistics.data,
            barChartData: barChartData.data,
            pieChartData: pieChartData.data,
        };

        res.json(combinedData);
    } catch (error) {
        console.error("Error fetching combined data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = app;
