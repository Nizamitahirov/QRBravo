const QRCode = require('qrcode');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // Get the text to encode from the query parameter or request body
    const text = (req.query.text || (req.body && req.body.text));

    if (!text) {
        context.res = {
            status: 400,
            body: "Please provide a text parameter in the query string or request body"
        };
        return;
    }

    try {
        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        // Convert data URL to buffer
        const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');

        context.res = {
            status: 200,
            body: buffer,
            headers: {
                'Content-Type': 'image/png'
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: "Error generating QR code: " + error.message
        };
    }
};
