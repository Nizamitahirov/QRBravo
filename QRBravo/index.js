const QRCode = require("qrcode");

module.exports = async function (context, req) {
  // Accept URL from query parameters or request body
  const url = req.query.url || (req.body && req.body.url);
  const name = req.query.name || (req.body && req.body.name);
  const store = req.query.store || (req.body && req.body.store);

  // Validate input parameters
  if (!url) {
    context.res = {
      status: 400,
      body: "Please provide a 'url' parameter",
    };
    return;
  }

  if (!name || !store) {
    context.res = {
      status: 400,
      body: "Please provide 'name' and 'store' parameters",
    };
    return;
  }

  try {
    // Generate QR code for the provided URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 250,
    });

    // Prepare the current date in dd-mm-yy format
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, "-");

    // HTML content with the QR code and the parameters
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
           <style>
                body {
                    margin: 0;
                    padding: 0;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: white;
                }
                .qr-container {
                    width: 770px;
                    height: 487px;
                    padding: 30px;
                    border: 1px solid #000;
                    background: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                }
                .title {
                    text-align: center;
                    margin-bottom: 62px;
                    font-size: 21px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .bold {
                    font-weight: bold;
                }
                .qr-image {
                    display: block;
                    margin: 0 auto;
                    width: 280px;
                    height: 280px;
                }
                .content {
                    width: 690px;
                }
                .footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 76px;
                    font-size: 21px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
            </style>
        </head>
        <body>
            <div class="qr-container">
                <div class="content">
                   <div class="title">
                        <span class="bold">Planogram Name:</span> ${name}
                    </div>
                    <img src="${qrDataUrl}" class="qr-image" alt="QR Code" />
                    <div class="footer">
                        <div>
                            <span class="bold">Published Date:</span> ${currentDate}
                        </div>
                        <div>
                            <span class="bold">Store:</span> ${store}
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${url}" target="_blank">Click here to visit the URL</a>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

    // Return the HTML response with the QR code
    context.res = {
      status: 200,
      body: Buffer.from(html),
      headers: {
        "Content-Type": "text/html",
      },
    };
  } catch (error) {
    // Handle any errors that occur during QR code generation
    context.res = {
      status: 500,
      body: "Error generating QR code: " + error.message,
    };
  }
};
