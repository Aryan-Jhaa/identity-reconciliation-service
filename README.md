# Identity Reconciliation Service

This is a Node.js web service designed to identify and consolidate customer contact information. Given an email and/or a phone number, the service links related contacts and returns a consolidated profile.

The service is built with Node.js, Express, and PostgreSQL, and is deployed live on Render.

**Live API Endpoint**: `https://identity-service-0e2k.onrender.com/`

---

## How to Use the API

The primary endpoint for this service is `/identify`. You can interact with it by sending `POST` requests. We recommend using a tool like [Postman](https://www.postman.com/downloads/) to test the endpoint.

### Sending a Request with Postman

1.  **Set the Method**: Open Postman and set the request method to `POST`.

2.  **Enter the URL**: Use the following URL for the `/identify` endpoint:
    ```
    [https://identity-service-0e2k.onrender.com/identify](https://identity-service-0e2k.onrender.com/identify)
    ```

3.  **Configure the Body**:
    * Go to the **Body** tab.
    * Select the **raw** radio button.
    * From the dropdown menu on the right, choose **JSON**.

4.  **Write the JSON Payload**: In the text area, provide a JSON object with an `email` and/or a `phoneNumber`.

---

### Example Payloads

Here are some example bodies you can copy and paste into Postman to see how the service works.

**Example 1: A new contact with both email and phone**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Example 2: A contact with a new email but an existing phone number**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Example 3: A contact with only an email**
```json
{
  "email": "george@hillvalley.edu"
}
```

**Example 4: A contact with only a phone number**
```json
{
  "phoneNumber": "919191"
}
```

### Example Response

After sending a request, the API will return a consolidated contact profile in the following format:

```json
{
    "contact": {
        "primaryContactId": 1,
        "emails": [
            "lorraine@hillvalley.edu",
            "mcfly@hillvalley.edu"
        ],
        "phoneNumbers": [
            "123456"
        ],
        "secondaryContactIds": [
            2
        ]
    }
}
```

---

### Local Development

To run this project locally:

1.  Clone the repository.
2.  Install PostgreSQL and create a database.
3.  Create a `.env` file and add your `DATABASE_URL`.
4.  Run `npm install`.
5.  Run `npm start`.
