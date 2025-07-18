const { Pool } = require('pg');

// Configure your PostgreSQL connection details
const pool = new Pool({
    user: 'postgres',                   // The user you configured
    host: 'localhost',
    database: 'identity_db',            // The database you created
    password: 'sepecat',   // The password you set
    port: 5432,
});

const createTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Contact" (
                id SERIAL PRIMARY KEY,
                "phoneNumber" TEXT,
                email TEXT,
                "linkedId" INTEGER,
                "linkPrecedence" VARCHAR(10) NOT NULL CHECK("linkPrecedence" IN ('primary', 'secondary')),
                "createdAt" TIMESTAMPTZ NOT NULL,
                "updatedAt" TIMESTAMPTZ NOT NULL,
                "deletedAt" TIMESTAMPTZ,
                CONSTRAINT fk_linked_contact
                    FOREIGN KEY("linkedId") 
                    REFERENCES "Contact"(id)
            );
        `);
        console.log("Table 'Contact' is ready.");
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        client.release();
    }
};

// Initialize the table when the application starts
createTable();

module.exports = {
    query: (text, params) => pool.query(text, params),
};