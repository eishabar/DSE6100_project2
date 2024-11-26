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

    async registerClient(firstName, lastName, address) {
        const sql = `INSERT INTO Clients (first_name, last_name, address, created_at) VALUES (?, ?, ?, NOW())`;
        return new Promise((resolve, reject) => {
            connection.query(sql, [firstName, lastName, address], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    async submitRequest(clientId, propertyAddress, squareFeet, proposedPrice, note) {
        const sql = `
            INSERT INTO Requests 
            (client_id, property_address, square_feet, proposed_price, note, status, submission_date, created_at) 
            VALUES (?, ?, ?, ?, ?, 'submitted', NOW(), NOW())
        `;
        return new Promise((resolve, reject) => {
            connection.query(sql, [clientId, propertyAddress, squareFeet, proposedPrice, note], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    async lookupRequestsByAddress(address) {
        const sql = `
            SELECT request_id, property_address, status, submission_date, rejection_note 
            FROM Requests 
            WHERE property_address = ?
        `;
        return new Promise((resolve, reject) => {
            connection.query(sql, [address], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    async addQuote(requestId, initialPrice, proposedPrice, workStartDate, workEndDate) {
        const sql = `
            INSERT INTO Quotes 
            (request_id, initial_price, proposed_price, work_start_date, work_end_date, status, last_updated) 
            VALUES (?, ?, ?, ?, ?, 'pending', NOW())
        `;
        return new Promise((resolve, reject) => {
            connection.query(sql, [requestId, initialPrice, proposedPrice, workStartDate, workEndDate], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = DbService;
