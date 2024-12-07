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

// Endpoint for Lookup Status
app.post('/lookup-status', async (req, res) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const requestHistory = await dbService.getRequestHistory(phone_number);

        if (requestHistory.length > 0) {
            res.status(200).json({ data: requestHistory });
        } else {
            res.status(404).json({ message: 'No history found for this phone number' });
        }
    } catch (error) {
        console.error('Error fetching request history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// === CONTRACTOR ROUTES ===



// Fetch requests from the database
app.get('/requests', (req, res) => {
    const query = 'SELECT * FROM requests';
    db.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
  // Fetch quotes from the database
  app.get('/quotes', (req, res) => {
    const query = 'SELECT * FROM quotes';
    db.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });


// Start server
app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});
