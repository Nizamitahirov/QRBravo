# QR Code PDF Generator

This Azure Function App generates QR codes and formats them into PDFs. The function is triggered via an HTTP request.

## How to Use
1. Deploy this project to an Azure Function App with Node.js 20.
2. Trigger the function using an HTTP POST request with the following payload:
   ```json
   {
       "link": "https://example.com",
       "details": {
           "planogramName": "Beer and Wine",
           "store": "1001"
       }
   }
