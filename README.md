# DSE6100_project2

## Project Credits
1. **Key Contributors**:
   - Eisha Akbar
   - Fatima Daher

2. **Division of Tasks**:
   - Both took turns working on Frontend and Backends
        - For example, Eisha set-up the Backend for Client Registration and Frontend; Fatima completed the Registration, then Eisha tookover to work on the Reports section. Each member took turn and worked in parall.
    - Total Time spent: 1 month 4 days

## How to Run the Given Code

To get the project working, follow these steps:

1. **Install XAMPP and Create Project Directory**:
   - In your file system, find xampp folder then within htdocs folder fetch the Github code from this repository.

2. **Set Up Backend**:
   - Use the provided sql `.txt` file or refer to step 7 and run the commands in sql server to create tables.

3. **Initialize Backend**:
   ```bash
   cd Backend
   npm init -y
   npm install express mysql cors nodemon
   ```

4. **Modify Backend Scripts**:
   - Open the `Backend/package.json` file and modify the scripts section as follows:
   ```json
   "scripts": {
       "test": "echo "Error: no test specified" && exit 1",
       "start": "nodemon server.js"
   }
   ```

5. **Start the Backend**:
   - Run the following commands to start the backend server:
   ```bash
   cd Backend
   npm start
   ```
   
6. **Access the Frontend**:
    -Now you can access the html url. For example, you can point your browser to:
        -http://localhost/DSE6100_project2/Frontend/Client.html
        -http://localhost/DSE6100_project2/Frontend/Contractor.html
       
7. **SQL Queries to Set-Up DB**:
-- Clients
CREATE TABLE Clients (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address TEXT,
    credit_card_number VARCHAR(16),
    expiration_date DATE,
    security_code VARCHAR(4),
    phone_number BIGINT, -- Changed to BIGINT to store numeric phone numbers
    email VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Requests
CREATE TABLE Requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    property_address TEXT NOT NULL,
    square_feet INT,
    proposed_price DECIMAL(10,2),
    note TEXT,
    status VARCHAR(20),
    submission_date DATE,
    rejection_note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES Clients(client_id)
);

-- Request Images
CREATE TABLE Request_Images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    image_url LONGTEXT, -- Changed to LONGTEXT for very large text
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES Requests(request_id)
);

-- Quotes
CREATE TABLE Quotes (
    quote_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT,
    initial_price DECIMAL(10,2),
    proposed_price DECIMAL(10,2),
    work_start_date DATE,
    work_end_date DATE,
    latest_client_note TEXT,
    latest_contractor_note TEXT,
    status VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES Requests(request_id)
);

-- Orders
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT,
    status VARCHAR(20),
    order_date DATE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES Quotes(quote_id)
);

-- Quote Negotiations
CREATE TABLE Quote_Negotiations (
    negotiation_id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    client_note TEXT,
    contractor_note TEXT,
    price_offer DECIMAL(10,2),
    work_start_date DATE,
    work_end_date DATE,
    version INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES Quotes(quote_id)
);

-- Bills
CREATE TABLE Bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    initial_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    status VARCHAR(20),
    due_date DATE,
    client_note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- Bill Negotiations
CREATE TABLE Bill_Negotiations (
    negotiation_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    client_note TEXT,
    contractor_note TEXT,
    final_amount DECIMAL(10,2),
    version INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES Bills(bill_id)
);
