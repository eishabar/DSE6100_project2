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
    const db = dbService.getDbServiceInstance();
    const { phone_number } = req.body;

    try {
        const requestHistory = await db.getRequestHistory(phone_number);

        res.status(200).json({ 
            data: requestHistory,
            found: requestHistory.length > 0
        });
    } catch (error) {
        console.error('Error fetching request history:', error);
        res.status(500).json({ 
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

// New route to handle quote actions
app.post('/quote-action', async (req, res) => {
    const { quote_id, action } = req.body;

    try {
        const db = dbService.getDbServiceInstance();
        await db.updateQuoteStatus(quote_id, action);
        
        res.status(200).json({ 
            message: `Quote ${action} successfully` 
        });
    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ 
            message: 'Error updating quote', 
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

app.get('/requests/:requestId', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const requestId = req.params.requestId;
        const requestDetails = await db.getRequestDetails(requestId);
        res.json(requestDetails);
    } catch (error) {
        console.error('Error fetching request details:', error);
        if (error.message === 'No request found with this ID') {
            res.status(404).send('Request not found');
        } else {
            res.status(500).send('Error fetching request details');
        }
    }
});

// Endpoint to create a quote for a request
app.post('/quotes', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const { 
            requestId, 
            initialPrice, 
            proposedPrice, 
            workStartDate, 
            workEndDate, 
            latestContractorNote 
        } = req.body;
        
        // Validate input
        if (!requestId || !initialPrice || !proposedPrice) {
            return res.status(400).json({ error: 'RequestId, initial price, and proposed price are required' });
        }

        const quoteId = await db.createQuote(
            requestId, 
            initialPrice, 
            proposedPrice, 
            workStartDate, 
            workEndDate, 
            latestContractorNote
        );
        res.status(201).json({ quoteId });
    } catch (error) {
        console.error('Error creating quote:', error);
        res.status(500).json({ 
            error: 'Error creating quote', 
            details: error.message 
        });
    }
});

// Endpoint to get quotes data
app.get('/getquotes', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const results = await db.getAllquotes(); // Use a method to fetch quotes
        res.json(results); // Send results as JSON
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).send('Error fetching data');
    }
});

app.patch('/requests/:requestId/status', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const { requestId } = req.params;
        const { status } = req.body;

        // Validate input
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        // Use the database service method to update status
        const result = await db.updateRequestStatus(requestId, status);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ 
            error: 'Failed to update status', 
            details: error.message 
        });
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});
