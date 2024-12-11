const apiBaseUrl = "http://localhost:3000"; // Change this to match your backend URL



function setupNavigation() {
    const menu = document.querySelector('.menu');
    const registerClientForm = document.getElementById('registerClientForm');
    const lookupStatusPage = document.getElementById('lookupStatusPage');
    const newRequestPage = document.getElementById('newRequestPage');

    const registerClientBtn = document.getElementById('registerClientBtn');
    const lookupStatusBtn = document.getElementById('lookupStatusBtn');
    const newRequestBtn = document.getElementById('newRequestBtn');
    const backToMenuFromLookup = document.getElementById('backToMenuFromLookup');
    const backToMenuFromNewRequest = document.getElementById('backToMenuFromNewRequest');
    const backToMenuFromRegister = document.getElementById('backToMenuFromRegister');

    // Helper function to switch between sections
    function switchSection(hideSection, showSection) {
        hideSection.classList.remove('active');
        showSection.classList.add('active');
    }

    // Show the Register Client form
    registerClientBtn.addEventListener('click', () => {
        switchSection(menu, registerClientForm);
    });

    // Show the New Request form
    newRequestBtn.addEventListener('click', () => {
        switchSection(menu, newRequestPage);
    });

    // Show the Lookup Status form
    lookupStatusBtn.addEventListener('click', () => {
        switchSection(menu, lookupStatusPage);
    });

    // Back to Menu buttons
    backToMenuFromLookup.addEventListener('click', () => {
        switchSection(lookupStatusPage, menu);
    });

    backToMenuFromRegister.addEventListener('click', () => {
        switchSection(registerClientForm, menu);
    });

    backToMenuFromNewRequest.addEventListener('click', () => {
        switchSection(newRequestPage, menu);
    });
}

// Call the function to set up navigation
setupNavigation();



// Client Registration
document.getElementById("registerClientForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = {
        first_name: document.getElementById("firstName").value,
        last_name: document.getElementById("lastName").value,
        phone_number: document.getElementById("phoneNumber").value,
        credit_card_number: document.getElementById("credit_card_number").value,
        expiration_date: document.getElementById("expirationDate").value,
        security_code: document.getElementById("securityCode").value,
        address: document.getElementById("address").value,
        email: document.getElementById("email").value,
    };

    const response = await fetch(`${apiBaseUrl}/register-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        alert("Registration Successful!");
        event.target.reset();
    } else {
        alert("Registration Failed!");
    }
});

// Submit Request
document.getElementById("requestForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const clientId = document.getElementById("clientId").value;
    const propertyAddress = document.getElementById("propertyAddress").value;
    const squareFeet = document.getElementById("squareFeet").value;
    const proposedPrice = document.getElementById("proposedPrice").value;
    const note = document.getElementById("note").value;

    // Collect image URLs from textarea
    const imageUrls = document.getElementById("imageUrls").value.split('\n').map(url => url.trim()).filter(url => url);

    const requestData = {
        client_id: clientId,
        property_address: propertyAddress,
        square_feet: squareFeet,
        proposed_price: proposedPrice,
        note,
        image_urls: imageUrls,
    };

    const response = await fetch(`${apiBaseUrl}/submit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
    });

    if (response.ok) {
        alert("Request Submitted!");
        document.getElementById("requestForm").reset();
    } else {
        alert("Failed to Submit Request!");
    }
});

// lookup section
document.getElementById("lookupForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const phoneNumber = document.getElementById("phoneNumber").value;

    try {
        const response = await fetch(`${apiBaseUrl}/lookup-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number: phoneNumber }),
        });

        if (response.ok) {
            const data = await response.json();
            // Render the lookup result here
            console.log(data);
        } else {
            alert("Lookup failed!");
        }
    } catch (error) {
        console.error("Error during lookup:", error);
    }
});


//contracter management page

document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();  // Make sure the navigation setup happens only when the DOM is ready
    fetchRequests();  // Fetch requests data

    // Setup navigation
    function setupNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');

        // Ensure that tabButtons are found before adding event listeners
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                button.addEventListener('click', function () {
                    // Handle tab switch
                    const targetTab = document.getElementById(button.getAttribute('data-tab'));
                    if (targetTab) {
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                        targetTab.classList.add('active');

                        // Change active tab style
                        tabButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                    }
                });
            });
        }
    }

    // Fetch requests data
    function fetchRequests() {
        fetch('http://localhost:3000/requests')
            .then(response => response.json())
            .then(data => {
                const requestsTableBody = document.getElementById('requestsTableBody');
                requestsTableBody.innerHTML = '';  // Clear previous data
                data.forEach(request => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${request.request_id}</td>
                        <td>${request.client_name}</td>
                        <td>${request.address}</td>
                        <td>${request.status}</td>
                        <td><button class="action">View Details</button></td>
                    `;
                    requestsTableBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error fetching requests:', error));
    }
});






