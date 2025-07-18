const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'Email or phone number must be provided.' });
    }

    try {
        // Find contacts that match the given email or phone number
        const findContactsQuery = `
            SELECT * FROM "Contact"
            WHERE email = $1 OR "phoneNumber" = $2
            ORDER BY "createdAt" ASC;
        `;
        const { rows: matchingContacts } = await db.query(findContactsQuery, [email, phoneNumber]);

        if (matchingContacts.length === 0) {
            // Case 1: No existing contact. Create a new primary contact.
            const now = new Date();
            const insertQuery = `
                INSERT INTO "Contact"(email, "phoneNumber", "linkPrecedence", "createdAt", "updatedAt")
                VALUES($1, $2, 'primary', $3, $4)
                RETURNING id;
            `;
            const { rows } = await db.query(insertQuery, [email, phoneNumber, now, now]);
            const newContactId = rows[0].id;

            return res.status(200).json({
                contact: {
                    primaryContactId: newContactId,
                    emails: email ? [email] : [],
                    phoneNumbers: phoneNumber ? [phoneNumber] : [],
                    secondaryContactIds: [],
                },
            });
        }

        // Case 2: Existing contacts found. Consolidate information.
        let primaryContact = matchingContacts[0];
        let secondaryContactsToUpdate = [];

        // Check if we need to merge two primary contacts
        const primaryContacts = new Set(matchingContacts.map(c => c.linkedId || c.id));
        if (primaryContacts.size > 1) {
            // Multiple primary trees are involved, merge them.
            // The oldest contact becomes the primary one.
            const allLinkedIds = Array.from(primaryContacts).join(',');
            const { rows: allContactsInvolved } = await db.query(
                `SELECT * FROM "Contact" WHERE id IN (${allLinkedIds}) OR "linkedId" IN (${allLinkedIds}) ORDER BY "createdAt" ASC`
            );
            
            primaryContact = allContactsInvolved[0];
            secondaryContactsToUpdate = allContactsInvolved.slice(1);

            for (const contact of secondaryContactsToUpdate) {
                if (contact.linkPrecedence === 'primary') {
                     await db.query(
                        `UPDATE "Contact" SET "linkedId" = $1, "linkPrecedence" = 'secondary', "updatedAt" = $2 WHERE id = $3`,
                        [primaryContact.id, new Date(), contact.id]
                    );
                }
            }
        }
        
        // Check if the new request adds new information
        const allEmails = new Set(matchingContacts.map(c => c.email).filter(Boolean));
        const allPhones = new Set(matchingContacts.map(c => c.phoneNumber).filter(Boolean));
        
        const isNewEmail = email && !allEmails.has(email);
        const isNewPhone = phoneNumber && !allPhones.has(phoneNumber);

        if (isNewEmail || isNewPhone) {
            // Create a new secondary contact
             const now = new Date();
             const insertSecondaryQuery = `
                INSERT INTO "Contact"(email, "phoneNumber", "linkedId", "linkPrecedence", "createdAt", "updatedAt")
                VALUES($1, $2, $3, 'secondary', $4, $5);
            `;
            await db.query(insertSecondaryQuery, [email, phoneNumber, primaryContact.id, now, now]);
        }
        
        // Finally, gather all linked contacts to form the response
        const finalContactsQuery = `
            SELECT * FROM "Contact"
            WHERE id = $1 OR "linkedId" = $1
            ORDER BY "createdAt" ASC;
        `;
        const { rows: allRelatedContacts } = await db.query(finalContactsQuery, [primaryContact.id]);

        const emails = [...new Set(allRelatedContacts.map(c => c.email).filter(Boolean))];
        const phoneNumbers = [...new Set(allRelatedContacts.map(c => c.phoneNumber).filter(Boolean))];
        const secondaryContactIds = allRelatedContacts
            .filter(c => c.linkPrecedence === 'secondary')
            .map(c => c.id);

        return res.status(200).json({
            contact: {
                primaryContactId: primaryContact.id,
                emails,
                phoneNumbers,
                secondaryContactIds,
            },
        });

    } catch (err) {
        console.error('Error processing /identify request:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;