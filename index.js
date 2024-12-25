const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// Function to generate QR code
async function generateQRCode(link) {
    try {
        return await QRCode.toDataURL(link); // Generate QR Code in Base64 format
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw err;
    }
}

// Function to generate PDF
async function createPDF(qrCodeData, outputPath, details) {
    const today = new Date();
    const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    const doc = new PDFDocument({ size: [288, 432] }); // Zebra printer size (4x6 inches)
    doc.pipe(fs.createWriteStream(outputPath));

    // Add QR Code
    doc.image(Buffer.from(qrCodeData.split(',')[1], 'base64'), 50, 50, { width: 200, height: 200 });

    // Add details
    doc.fontSize(12).text(`Planogram Name: ${details.planogramName}`, 50, 270);
    doc.text(`Published Date: ${formattedDate}`, 50, 290);
    doc.text(`Store: ${details.store}`, 50, 310);

    doc.end();
}

// HTTP endpoint for Azure Function
app.post('/api/generate', async (req, res) => {
    const { link, details } = req.body;

    try {
        const qrCodeData = await generateQRCode(link);
        const outputPath = `/tmp/${details.store}_price_tag.pdf`;
        await createPDF(qrCodeData, outputPath, details);

        res.status(200).send({ message: 'PDF generated successfully', outputPath });
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send({ error: 'Failed to generate PDF' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
