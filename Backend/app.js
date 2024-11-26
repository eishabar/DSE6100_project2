const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dbService = require('./dbService');
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register a new client
app.post('/register', (req, res) => {
    console.log("Endpoint: register a new client");
    console.log("Request body:", req.body);

    const { firstName, lastName, address } = req.body;
    if (!firstName || !lastName || !address) {
        console.log("Validation error: Missing required fields");
        return res.status(400).json({ error: 'All fields are required: firstName, lastName, address' });
    }

    const db = dbService.getDbServiceInstance();

    db.registerClient(firstName, lastName, address)
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

    const { clientId, propertyAddress, squareFeet, proposedPrice, note } = req.body;
    if (!clientId || !propertyAddress) {
        console.log("Validation error: Missing required fields");
        return res.status(400).json({ error: 'Client ID and property address are required' });
    }

    const db = dbService.getDbServiceInstance();

    db.submitRequest(clientId, propertyAddress, squareFeet, proposedPrice, note)
        .then(data => {
            console.log("Request submitted with ID:", data.insertId);
            res.status(201).json({ success: true, requestId: data.insertId });
        })
        .catch(err => {
            console.log("Error in submit-request:", err);
            res.status(500).json({ error: 'Error submitting request' });
        });
});

// Lookup requests by address
app.get('/lookup', (req, res) => {
    const { address } = req.query;
    console.log("Endpoint: lookup requests by address");
    console.log("Query params:", req.query);

    if (!address) {
        console.log("Validation error: Address is required");
        return res.status(400).json({ error: 'Address is required' });
    }

    const db = dbService.getDbServiceInstance();

    db.lookupRequestsByAddress(address)
        .then(result => {
            if (result.length === 0) {
                console.log("No requests found for this address");
                return res.status(404).json({ error: 'No requests found for this address' });
            }
            res.status(200).json({ success: true, requests: result });
        })
        .catch(err => {
            console.log("Error in lookup:", err);
            res.status(500).json({ error: 'Error fetching requests' });
        });
});

// Submit a quote for a request
app.post('/submit-quote', (req, res) => {
    console.log("Endpoint: submit a quote");
    console.log("Request body:", req.body);

    const { requestId, initialPrice, proposedPrice, workStartDate, workEndDate } = req.body;
    if (!requestId || !initialPrice || !proposedPrice || !workStartDate || !workEndDate) {
        console.log("Validation error: Missing required fields");
        return res.status(400).json({ error: 'All fields are required: requestId, initialPrice, proposedPrice, workStartDate, workEndDate' });
    }

    const db = dbService.getDbServiceInstance();

    db.addQuote(requestId, initialPrice, proposedPrice, workStartDate, workEndDate)
        .then(data => {
            console.log("Quote submitted with ID:", data.insertId);
            res.status(201).json({ success: true, quoteId: data.insertId });
        })
        .catch(err => {
            console.log("Error in submit-quote:", err);
            res.status(500).json({ error: 'Error submitting quote' });
        });
});

// Start server
app.listen(5050, () => {
    console.log("Server is running on port 5050.");
});
