# QR Code PDF Generator
This Azure Function App generates QR codes and formats them into PDFs.

## Usage
- POST to the HTTP trigger with the following JSON:
  {
    "link": "<your link>",
    "details": {
      "planogramName": "Example Name",
      "store": "1234"
    }
  }
