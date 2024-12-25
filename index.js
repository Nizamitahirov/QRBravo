const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// QR Kod Yaratmaq Funksiyası
async function generateQRCode(link) {
    try {
        const qrCodeData = await QRCode.toDataURL(link);
        return qrCodeData; // Base64 formatında QR kod
    } catch (err) {
        console.error('QR kod yaratmaqda problem oldu:', err);
        throw err;
    }
}

// PDF Yaratmaq Funksiyası
async function createPDF(qrCodeData, outputPath, details) {
    const today = new Date();
    const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`; // Bugünkü tarix

    const doc = new PDFDocument({ size: [288, 432] }); // Zebra printer ölçüsü (4x6 inch)
    doc.pipe(fs.createWriteStream(outputPath));

    // QR kod əlavə etmək
    doc.image(Buffer.from(qrCodeData.split(',')[1], 'base64'), 50, 50, { width: 200, height: 200 });

    // Məlumat əlavə etmək
    doc.fontSize(12).text(`Planogram Name: ${details.planogramName}`, 50, 270);
    doc.text(`Published Date: ${formattedDate}`, 50, 290); // Bu günkü tarix
    doc.text(`Store: ${details.store}`, 50, 310);

    doc.end();
}

// HTTP POST Endpoint
app.post('/generate', async (req, res) => {
    const { link, details } = req.body;

    try {
        // QR kodu yarat
        const qrCodeData = await generateQRCode(link);

        // PDF faylı üçün çıxış yolu
        const outputPath = `/tmp/${details.store}_price_tag.pdf`;

        // PDF yarat
        await createPDF(qrCodeData, outputPath, details);

        // Cavab qaytar
        res.status(200).send({ message: 'PDF yaradıldı', outputPath });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'QR kod və ya PDF yaratmaqda səhv baş verdi' });
    }
});

// Serveri işə sal
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server işləyir: http://localhost:${port}`);
});
