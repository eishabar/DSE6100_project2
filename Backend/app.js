const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dbService = require('./dbService');
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Register a new client
app.post('/register-client', (req, res) => {
    console.log("Endpoint: register a new client");
    console.log("Request body:", req.body);

    const { first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email } = req.body;
    if (!first_name || !last_name || !phone_number || !credit_card_number || !expiration_date || !security_code || !address || !email) {
        console.log("Validation error: Missing required fields");
        return res.status(400).json({ error: 'All fields are required: firstName, lastName, address' });
    }

    const db = dbService.getDbServiceInstance();

    db.registerClient(first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email)
        .then(data => {
            console.log("New client registered with ID:", data.insertId);
            res.status(201).json({ success: true, clientId: data.insertId });
        })
        .catch(err => {
            console.log("Error in register:", err);
            res.status(500).json({ error: 'Error registering client' });
        });
});

// Submit a new request
app.post('/submit-request', (req, res) => {
    console.log("Endpoint: submit a new request");
    console.log("Request body:", req.body);

    const { client_id, property_address, square_feet, proposed_price, note, image_urls } = req.body;

    if (!client_id || !property_address || !Array.isArray(image_urls)) {
        console.log("Validation error: Missing required fields or invalid image URLs");
        return res.status(400).json({ error: 'Client ID, property address, and valid image URLs are required' });
    }

    const db = dbService.getDbServiceInstance();

    db.submitRequest(client_id, property_address, square_feet, proposed_price, note, image_urls)
        .then(data => {
            console.log("Request submitted with ID:", data.requestId);
            res.status(201).json({ success: true, requestId: data.requestId });
        })
        .catch(err => {
            console.log("Error in submit-request:", err);
            res.status(500).json({ error: 'Error submitting request' });
        });
});

app.post('/lookup-status', async (req, res) => {
    const { phone_number } = req.body;


    try {
        const requestHistory = await dbService.getRequestHistory(phone_number);

        if (requestHistory && requestHistory.length > 0) {
            res.status(200).json({ data: requestHistory });
        } else {
            res.status(404).json({ 
                message: 'No request history found for this phone number',
                data: [] 
            });
        }
    } catch (error) {
        console.error('Error fetching request history:', error);
        console.log(dbService);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});




// === CONTRACTOR ROUTES ===



// Endpoint to get request data
app.get('/requests', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    
    try {
        const results = await db.getAllRequests(); // Use a method to fetch requests
        res.json(results); // Send results as JSON
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).send('Error fetching data');
    }
});



// Endpoint to get quotes data
app.get('/quotes', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const results = await db.getAllquotes(); // Use a method to fetch quotes
        res.json(results); // Send results as JSON
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).send('Error fetching data');
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});
