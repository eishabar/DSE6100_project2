const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

let instance = null;

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.log(err.message);
    }
    console.log('DB connection state:', connection.state);
});

class DbService {
    static getDbServiceInstance() {
        return instance ? instance : new DbService();
    }

    async registerClient(first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email) {
        const sql = `INSERT INTO Clients (first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email, timestamp) VALUES (?, ?, ?, ? , ? , ? , ? , ? , NOW())`;
        return new Promise((resolve, reject) => {
            connection.query(sql, [first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    async submitRequest(client_id, property_address, square_feet, proposed_price, note, image_urls) {
        return new Promise((resolve, reject) => {
            const sqlRequest = `
                INSERT INTO Requests (client_id, property_address, square_feet, proposed_price, note, status, submission_date) 
                VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`;
    
            connection.beginTransaction((err) => {
                if (err) return reject(err);
    
                // Insert the main request
                connection.query(sqlRequest, [client_id, property_address, square_feet, proposed_price, note], (err, results) => {
                    if (err) {
                        return connection.rollback(() => reject(err));
                    }
    
                    const requestId = results.insertId;
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
                                resolve({ requestId });
                            });
                        })
                        .catch((err) => {
                            connection.rollback(() => reject(err));
                        });
                });
            });
        });
    }
    
    // Fetch Request History by Phone Number
    async getRequestHistory(phone_number) {
        const sql = `SELECT 
                    clients.client_id, 
                    clients.first_name, 
                    clients.last_name, 
                    requests.request_id, 
                    requests.property_address, 
                    requests.square_feet, 
                    requests.status, 
                    requests.submission_date
                FROM clients
                LEFT JOIN requests ON clients.client_id = requests.client_id
                WHERE clients.phone_number = ?`;

        return new Promise((resolve, reject) => {
            connection.query(sql, [phone_number], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }


    async getAllRequests() {
        const sql = 'SELECT request_id, client_id, property_address, status FROM requests';
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results);
            });
        });
    }
    
    async getAllquotes() {
        const sql = 'SELECT quote_id, request_id, initial_price, proposed_price, status FROM quotes';
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                }
                resolve(results);
            });
        });
    }
    
    
}
    


module.exports = new DbService;
