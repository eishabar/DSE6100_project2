// Import required modules
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware for handling Cross-Origin Resource Sharing
const dotenv = require('dotenv'); // Module for loading environment variables
const dbService = require('./dbService'); // Custom database service module
dotenv.config(); // Load environment variables from .env file

// Initialize the Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for handling requests from different origins
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// === CLIENT ROUTES ===

// Endpoint to register a new client
app.post('/register-client', (req, res) => {
    console.log("Endpoint: register a new client");
    console.log("Request body:", req.body);

    // Extract client information from the request body
    const { first_name, last_name, phone_number, credit_card_number, expiration_date, security_code, address, email } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !phone_number || !credit_card_number || !expiration_date || !security_code || !address || !email) {
        console.log("Validation error: Missing required fields");
        return res.status(400).json({ error: 'All fields are required: firstName, lastName, address' });
    }

    // Get a database instance and register the client
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

// Endpoint to submit a new service request
app.post('/submit-request', (req, res) => {
    console.log("Endpoint: submit a new request");
    console.log("Request body:", req.body);

    // Extract request details
    const { client_id, property_address, square_feet, proposed_price, note, image_urls } = req.body;

    // Validate required fields
    if (!client_id || !property_address || !Array.isArray(image_urls)) {
        console.log("Validation error: Missing required fields or invalid image URLs");
        return res.status(400).json({ error: 'Client ID, property address, and valid image URLs are required' });
    }

    // Get a database instance and submit the request
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

// Endpoint to lookup the status of a request by phone number
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

// Endpoint to perform actions on quotes (e.g., approve, reject)
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


// Endpoint to create a work order when quote is accepted
app.post('/create-work-order', async (req, res) => {
    const { quote_id, proposed_price } = req.body;

    try {
        const db = dbService.getDbServiceInstance();

        // Create work order
        const order_id = await db.createWorkOrder(quote_id);

        // Create initial bill
        await db.createBill(order_id, proposed_price);

        res.status(200).json({
            message: 'Work order created successfully',
            order_id: order_id
        });
    } catch (error) {
        console.error('Error creating work order:', error);
        res.status(500).json({
            message: 'Error creating work order',
            error: error.message
        });
    }
});

// Endpoint to complete a work order
app.post('/complete-work-order', async (req, res) => {
    const { order_id } = req.body;

    try {
        const db = dbService.getDbServiceInstance();

        // Mark work order as completed
        await db.completeWorkOrder(order_id);

        res.status(200).json({
            message: 'Work order completed successfully'
        });
    } catch (error) {
        console.error('Error completing work order:', error);
        res.status(500).json({
            message: 'Error completing work order',
            error: error.message
        });
    }
});

// Endpoint to get work order and bill details
app.post('/get-work-order-details', async (req, res) => {
    const { quote_id } = req.body;

    try {
        const db = dbService.getDbServiceInstance();
        const workOrderDetails = await db.getWorkOrderDetails(quote_id);

        res.status(200).json({
            workOrderDetails: workOrderDetails || null
        });
    } catch (error) {
        console.error('Error fetching work order details:', error);
        res.status(500).json({
            message: 'Error fetching work order details',
            error: error.message
        });
    }
});

// Endpoint to create quote negotiation
app.post('/create-quote-negotiation', async (req, res) => {
    const {
        quote_id,
        client_note,
        price_offer,
        work_start_date,
        work_end_date
    } = req.body;

    try {
        const db = dbService.getDbServiceInstance();

        const negotiationId = await db.createQuoteNegotiation({
            quote_id,
            client_note,
            price_offer,
            work_start_date,
            work_end_date
        });

        res.status(200).json({
            message: 'Quote negotiation created successfully',
            negotiation_id: negotiationId
        });
    } catch (error) {
        console.error('Error creating quote negotiation:', error);
        res.status(500).json({
            message: 'Error creating quote negotiation',
            error: error.message
        });
    }
});

// Endpoint for comprehensive lookup of client records by phone number
app.post('/comprehensive-lookup', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    const { phone_number } = req.body;

    try {
        // Validate phone number input
        if (!phone_number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Retrieve comprehensive client records
        const comprehensiveLookup = await db.getComprehensiveLookup(phone_number);

        if (!comprehensiveLookup || comprehensiveLookup.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(comprehensiveLookup);
    } catch (error) {
        console.error('Error in comprehensive lookup:', error);
        res.status(500).json({
            message: 'Error performing comprehensive lookup',
            error: error.message
        });
    }
});



// === CONTRACTOR ROUTES ===

// Endpoint to get all requests
app.get('/requests', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const results = await db.getAllRequests();
        res.json(results);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).send('Error fetching data');
    }
});

// Endpoint to get all orders
app.get('/orders', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const results = await db.getAllOrders();
        res.json(results);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching data');
    }
});

// Endpoint to get details of a specific request by its ID
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

// Endpoint to get all bills
app.get('/bills', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const results = await db.getAllBills();
        res.json(results);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).send('Error fetching data');
    }
});

// Endpoint to get specific bill details
app.get('/bills/:billId', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const billId = req.params.billId;
        const result = await db.getBillDetails(billId);
        res.json(result);
    } catch (error) {
        console.error('Error fetching bill details:', error);
        res.status(500).send('Error fetching bill details');
    }
});

// Endpoint to create a quote for a specific request
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

// Endpoint to get all quotes
app.get('/getquotes', async (req, res) => {
    const db = dbService.getDbServiceInstance();
    try {
        const results = await db.getAllquotes();
        res.json(results);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).send('Error fetching data');
    }
});

// Endpoint to update the status of a request by its ID
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

// Endpoint to get the most active client(s) for David Smith
app.get('/clients/most-active', (req, res) => {
    console.log("Endpoint: Get most active clients for David Smith");

    const db = dbService.getDbServiceInstance();
    db.getMostActiveClients()
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            console.log("Error fetching most active clients:", err);
            res.status(500).json({ error: 'Error fetching most active clients' });
        });
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});