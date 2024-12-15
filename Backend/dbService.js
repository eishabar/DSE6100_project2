// Import required modules
const mysql = require('mysql'); // MySQL library for database connection and queries
const dotenv = require('dotenv'); // For loading environment variables from a .env file
dotenv.config(); // Configure environment variables from the .env file

let instance = null; // Singleton instance of the database service

// Create a MySQL database connection using environment variables
const connection = mysql.createConnection({
    host: process.env.HOST, // Database host
    user: process.env.USER, // Database username
    password: process.env.PASSWORD, // Database password
    database: process.env.DATABASE, // Database name
    port: process.env.DB_PORT // Database port
});

// Connect to the database and log the connection state
connection.connect((err) => {
    if (err) {
        console.log(err.message); // Log any connection errors
    }
    console.log('DB connection state:', connection.state); // Log current connection state
});

// Database service class to handle database interactions
class DbService {

    // Return a singleton instance of DbService
    static getDbServiceInstance() {
        return instance ? instance : new DbService();
    }

    // Register a new client in the database
    async registerClient(first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email) {
        const sql = `INSERT INTO Clients (first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email, timestamp) VALUES (?, ?, ?, ? , ? , ? , ? , ? , NOW())`;
        return new Promise((resolve, reject) => {
            connection.query(sql, [first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email], (err, results) => {
                if (err) reject(err); // Reject the promise if there's an error
                resolve(results); // Resolve the promise with the query results
            });
        });
    }

    // Submit a new request and save associated images
    async submitRequest(client_id, property_address, square_feet, proposed_price, note, image_urls) {
        return new Promise((resolve, reject) => {
            const sqlRequest = `
                INSERT INTO Requests (client_id, property_address, square_feet, proposed_price, note, status, submission_date) 
                VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`;

            connection.beginTransaction((err) => {
                if (err) return reject(err); // Reject the promise if transaction start fails

                // Insert the main request
                connection.query(sqlRequest, [client_id, property_address, square_feet, proposed_price, note], (err, results) => {
                    if (err) {
                        return connection.rollback(() => reject(err)); // Roll back on error
                    }

                    const requestId = results.insertId; // Get the generated request ID
                    const sqlImages = `INSERT INTO Request_Images (request_id, image_url, timestamp) VALUES (?, ?, NOW())`;

                    // Insert each image URL into the Request_Images table
                    const imagePromises = image_urls.map((url) =>
                        new Promise((resolve, reject) => {
                            connection.query(sqlImages, [requestId, url], (err, results) => {
                                if (err) reject(err);
                                resolve(results);
                            });
                        })
                    );

                    // Commit the transaction if all images are inserted successfully
                    Promise.all(imagePromises)
                        .then(() => {
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => reject(err));
                                }
                                resolve({ requestId }); // Resolve with the request ID
                            });
                        })
                        .catch((err) => {
                            connection.rollback(() => reject(err)); // Roll back on error
                        });
                });
            });
        });
    }

    // Fetch the request history for a client using their phone number
    async getRequestHistory(phone_number) {
        const sql = `
            SELECT 
                clients.client_id, 
                clients.first_name, 
                clients.last_name, 
                requests.request_id, 
                requests.property_address, 
                requests.square_feet, 
                requests.status, 
                requests.submission_date,
                quotes.quote_id,
                quotes.proposed_price,
                quotes.latest_contractor_note,
                quotes.status AS quote_status
            FROM clients
            LEFT JOIN requests ON clients.client_id = requests.client_id
            LEFT JOIN quotes ON requests.request_id = quotes.request_id
            WHERE clients.phone_number = ?`;

        return new Promise((resolve, reject) => {
            connection.query(sql, [phone_number], (err, results) => {
                if (err) reject(err);
                resolve(results); // Return the fetched history
            });
        });
    }

    // Update the status of a quote in the database
    async updateQuoteStatus(quote_id, status) {
        const sql = 'UPDATE quotes SET status = ? WHERE quote_id = ?';

        return new Promise((resolve, reject) => {
            connection.query(sql, [status, quote_id], (err, results) => {
                if (err) reject(err);
                resolve(results); // Return the result of the update
            });
        });
    }

    // Fetch all requests from the database
    async getAllRequests() {
        const sql = 'SELECT request_id, client_id, property_address, status FROM requests';
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results); // Return the fetched requests
            });
        });
    }

    // Fetch all orders from the database
    async getAllOrders() {
        const sql = 'SELECT order_id, quote_id, status, timestamp FROM orders';
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results); // Return the fetched orders
            });
        });
    }

    // Fetch all bills from the database
    async getAllBills() {
        const sql = `
            SELECT bill_id, order_id, initial_amount, final_amount, status, due_date 
            FROM Bills
        `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results); // Return the fetched bills
            });
        });
    }

    // Get specific bill details
    async getBillDetails(billId) {
        const sql = `
            SELECT bill_id, order_id, initial_amount, final_amount, 
                status, due_date, client_note, timestamp 
            FROM Bills 
            WHERE bill_id = ?
        `;
        return new Promise((resolve, reject) => {
            connection.query(sql, [billId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results[0]); // Return the first (and should be only) result
            });
        });
    }
    // Fetch all quotes from the database
    async getAllquotes() {
        const sql = `
            SELECT 
                quote_id, 
                request_id, 
                initial_price, 
                proposed_price, 
                work_start_date, 
                work_end_date, 
                latest_contractor_note, 
                status 
            FROM quotes`;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results); // Return the fetched quotes
            });
        });
    }

    // Fetch details for a specific request
    async getRequestDetails(requestId) {
        const sql = `
            SELECT r.*, CONCAT(c.first_name, ' ', c.last_name) AS client_name, c.email AS client_email 
            FROM Requests r
            JOIN Clients c ON r.client_id = c.client_id
            WHERE r.request_id = ?`;

        return new Promise((resolve, reject) => {
            connection.query(sql, [requestId], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (results.length === 0) {
                    reject(new Error('No request found with this ID')); // Return an error if no request is found
                    return;
                }
                resolve(results[0]); // Return the fetched request details
            });
        });
    }

    // Create a new quote for a request
    async createQuote(requestId, initialPrice, proposedPrice, workStartDate, workEndDate, latestContractorNote) {
        const sql =
            'INSERT INTO Quotes ' +
            '(request_id, initial_price, proposed_price, work_start_date, work_end_date, latest_contractor_note, status) ' +
            'VALUES (?, ?, ?, ?, ?, ?, "pending")';

        return new Promise((resolve, reject) => {
            connection.query(
                sql,
                [requestId, initialPrice, proposedPrice, workStartDate, workEndDate, latestContractorNote],
                (err, result) => {
                    if (err) {
                        console.error('Error creating quote:', err);
                        reject(err);
                        return;
                    }

                    if (!result || !result.insertId) {
                        reject(new Error('Failed to create quote')); // Error if insert fails
                        return;
                    }

                    resolve(result.insertId); // Return the new quote ID
                }
            );
        });
    }

    // Update the status of a request
    async updateRequestStatus(requestId, status) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE requests SET status = ? WHERE request_id = ?';
            connection.query(query, [status, requestId], (error, result) => {
                if (error) return reject(error);
                resolve(result); // Return the result of the update
            });
        });
    }

    // Create a new work order when a quote is accepted
    async createWorkOrder(quote_id) {
        const sql = 'INSERT INTO orders (quote_id, status, order_date) VALUES (?, ?, CURDATE())';

        return new Promise((resolve, reject) => {
            connection.query(sql, [quote_id, 'In Progress'], (err, results) => {
                if (err) reject(err);
                resolve(results.insertId); // Return the new order_id
            });
        });
    }

    // Generate a bill for a completed work order
    async createBill(order_id, initialAmount) {
        // Calculate due date as 30 days from today
        const sql = `
        INSERT INTO bills (
            order_id, 
            initial_amount, 
            status, 
            due_date, 
            client_note
        ) VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY), '')
    `;

        return new Promise((resolve, reject) => {
            connection.query(sql, [order_id, initialAmount, 'Pending'], (err, results) => {
                if (err) reject(err);
                resolve(results.insertId);
            });
        });
    }

    // Method to mark a work order as completed
    async completeWorkOrder(order_id) {
        const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';

        return new Promise((resolve, reject) => {
            connection.query(sql, ['Completed', order_id], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    // Fetch work order details if they exist
    async getWorkOrderDetails(quote_id) {
        const sql = `
        SELECT 
            o.order_id, 
            o.status AS order_status, 
            o.order_date,
            b.bill_id,
            b.initial_amount,
            b.status AS bill_status,
            b.due_date,
            b.client_note AS bill_client_note
        FROM orders o
        LEFT JOIN bills b ON o.order_id = b.order_id
        WHERE o.quote_id = ?
    `;

        return new Promise((resolve, reject) => {
            connection.query(sql, [quote_id], (err, results) => {
                if (err) reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Create a new quote negotiation
    async createQuoteNegotiation(negotiationData) {
        const sql = `
        INSERT INTO quote_negotiations (
            quote_id, 
            client_note, 
            price_offer, 
            work_start_date, 
            work_end_date, 
            version
        ) VALUES (?, ?, ?, ?, ?, 
            (SELECT COALESCE(MAX(version), 0) + 1 
             FROM quote_negotiations AS qn 
             WHERE qn.quote_id = ?)
        )
    `;

        return new Promise((resolve, reject) => {
            connection.query(
                sql,
                [
                    negotiationData.quote_id,
                    negotiationData.client_note,
                    negotiationData.price_offer,
                    negotiationData.work_start_date,
                    negotiationData.work_end_date,
                    negotiationData.quote_id
                ],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results.insertId);
                }
            );
        });
    }
    // Move the helper functions inside the class
    static fetchQuotes(request_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
            SELECT quote_id, initial_price, proposed_price, work_start_date, work_end_date, 
                   status, latest_client_note, latest_contractor_note
            FROM quotes 
            WHERE request_id = ?
        `, [request_id], (err, quotes) => {
                if (err) reject(err);
                else resolve(quotes);
            });
        });
    }

    static fetchQuoteNegotiations(request_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
            SELECT qn.negotiation_id, qn.quote_id, qn.client_note, 
                   qn.contractor_note, qn.price_offer, 
                   qn.work_start_date, qn.work_end_date
            FROM quote_negotiations qn
            JOIN quotes qq ON qn.quote_id = qq.quote_id
            WHERE qq.request_id = ?
        `, [request_id], (err, negotiations) => {
                if (err) reject(err);
                else resolve(negotiations);
            });
        });
    }

    static fetchOrders(request_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
            SELECT o.order_id, o.quote_id, o.status, o.order_date
            FROM orders o
            JOIN quotes qq ON o.quote_id = qq.quote_id
            WHERE qq.request_id = ?
        `, [request_id], (err, orders) => {
                if (err) reject(err);
                else resolve(orders);
            });
        });
    }

    static fetchBills(request_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
            SELECT b.bill_id, b.order_id, b.initial_amount, b.final_amount, 
                   b.status, b.due_date, b.client_note
            FROM bills b
            JOIN orders o ON b.order_id = o.order_id
            JOIN quotes qq ON o.quote_id = qq.quote_id
            WHERE qq.request_id = ?
        `, [request_id], (err, bills) => {
                if (err) reject(err);
                else resolve(bills);
            });
        });
    }

    static fetchBillNegotiations(request_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
            SELECT bn.negotiation_id, bn.bill_id, bn.client_note, 
                   bn.contractor_note, bn.final_amount
            FROM bill_negotiations bn
            JOIN bills b ON bn.bill_id = b.bill_id
            JOIN orders o ON b.order_id = o.order_id
            JOIN quotes qq ON o.quote_id = qq.quote_id
            WHERE qq.request_id = ?
        `, [request_id], (err, negotiations) => {
                if (err) reject(err);
                else resolve(negotiations);
            });
        });
    }


    // Update the getComprehensiveLookup method to use static method calls
    async getComprehensiveLookup(phone_number) {
        return new Promise((resolve, reject) => {
            connection.query(
                'SELECT client_id FROM clients WHERE phone_number = ?',
                [phone_number],
                (err, clientRows) => {
                    if (err) {
                        return reject(err);
                    }

                    if (clientRows.length === 0) {
                        return resolve([]);
                    }

                    const client_id = clientRows[0].client_id;

                    connection.query(`
                    SELECT r.* FROM requests r
                    WHERE r.client_id = ?
                    ORDER BY r.submission_date DESC
                `, [client_id], (err, requests) => {
                        if (err) {
                            return reject(err);
                        }

                        const requestPromises = requests.map(request => {
                            return new Promise((resolveRequest, rejectRequest) => {
                                Promise.all([
                                    DbService.fetchQuotes(request.request_id),
                                    DbService.fetchQuoteNegotiations(request.request_id),
                                    DbService.fetchOrders(request.request_id),
                                    DbService.fetchBills(request.request_id),
                                    DbService.fetchBillNegotiations(request.request_id)
                                ]).then(([
                                    quotes,
                                    quoteNegotiations,
                                    orders,
                                    bills,
                                    billNegotiations
                                ]) => {
                                    resolveRequest({
                                        ...request,
                                        quotes,
                                        quote_negotiations: quoteNegotiations,
                                        orders,
                                        bills,
                                        bill_negotiations: billNegotiations
                                    });
                                }).catch(rejectRequest);
                            });
                        });

                        Promise.all(requestPromises)
                            .then(resolve)
                            .catch(reject);
                    });
                }
            );
        });
    }

    // === Reports Queries ===

    // Query for Big Clients (most orders by David Smith)
    getBigClients() {
        const sql = `
        SELECT 
            c.client_id, 
            CONCAT(c.first_name, ' ', c.last_name) AS client_name, 
            COUNT(o.order_id) AS total_orders
        FROM 
            Clients c
        JOIN 
            Requests r ON c.client_id = r.client_id
        JOIN 
            Quotes q ON r.request_id = q.request_id
        JOIN 
            Orders o ON q.quote_id = o.quote_id
        GROUP BY 
            c.client_id
        ORDER BY 
            total_orders DESC
        LIMIT 1;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    // Query for Difficult Clients
    getDifficultClients() {
        const sql = `
        SELECT 
            c.client_id, 
            CONCAT(c.first_name, ' ', c.last_name) AS client_name
        FROM 
            Clients c
        JOIN 
            Requests r ON c.client_id = r.client_id
        LEFT JOIN 
            Quotes q ON r.request_id = q.request_id
        WHERE 
            q.request_id IS NULL
        GROUP BY 
            c.client_id
        HAVING 
            COUNT(DISTINCT r.request_id) >= 3;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Query for This Month's Quotes (December 2024)
    getThisMonthQuotes() {
        const sql = `
        SELECT 
            q.quote_id, 
            r.property_address, 
            q.initial_price, 
            q.proposed_price, 
            q.status, 
            q.timestamp
        FROM 
            Quotes q
        JOIN 
            Requests r ON q.request_id = r.request_id
        WHERE 
            MONTH(q.timestamp) = 12
            AND YEAR(q.timestamp) = 2024;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Query for Prospective Clients
    getProspectiveClients() {
        const sql = `
        SELECT 
            c.client_id, 
            CONCAT(c.first_name, ' ', c.last_name) AS client_name
        FROM 
            Clients c
        LEFT JOIN 
            Requests r ON c.client_id = r.client_id
        WHERE 
            r.request_id IS NULL;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Query for Largest Driveway
    getLargestDriveway() {
        const sql = `
        SELECT 
            r.property_address, 
            MAX(r.square_feet) AS largest_square_feet
        FROM 
            Requests r
        JOIN 
            Quotes q ON r.request_id = q.request_id
        JOIN 
            Orders o ON q.quote_id = o.quote_id
        GROUP BY 
            r.property_address
        ORDER BY 
            largest_square_feet DESC
        LIMIT 1;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Query for Overdue Bills
    getOverdueBills() {
        const sql = `
        SELECT 
            b.bill_id, 
            b.due_date, 
            b.status, 
            TIMESTAMPDIFF(DAY, b.due_date, CURRENT_DATE()) AS overdue_days
        FROM 
            Bills b
        WHERE 
            b.due_date < CURRENT_DATE() - INTERVAL 7 DAY;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Query for Bad Clients
    getBadClients() {
        const sql = `
        SELECT 
            c.client_id, 
            CONCAT(c.first_name, ' ', c.last_name) AS client_name
        FROM 
            Clients c
        JOIN 
            Requests r ON c.client_id = r.client_id
        JOIN 
            Quotes q ON r.request_id = q.request_id
        JOIN 
            Orders o ON q.quote_id = o.quote_id
        JOIN 
            Bills b ON o.order_id = b.order_id
        WHERE 
            b.due_date < CURRENT_DATE() 
        GROUP BY 
            c.client_id;
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Query for Good Clients (paid within 24 hours)
    getGoodClients() {
        const sql = `
        SELECT 
            c.client_id, 
            CONCAT(c.first_name, ' ', c.last_name) AS client_name
        FROM 
            Clients c
        JOIN 
            Requests r ON c.client_id = r.client_id
        JOIN 
            Quotes q ON r.request_id = q.request_id
        JOIN 
            Orders o ON q.quote_id = o.quote_id
        JOIN 
            Bills b ON o.order_id = b.order_id
        WHERE 
            b.status = 'PAID'
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    // Revenue Report Query
    getRevenueReport() {
        const sql = `
        SELECT
            SUM(final_amount) AS total_revenue
        FROM
            Bills
        WHERE
            status = 'Paid';
    `;
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

}

// Export the DbService class
module.exports = DbService;