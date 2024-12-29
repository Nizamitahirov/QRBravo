const QRCode = require("qrcode");

module.exports = async function (context, req) {
  const name = req.query.name || (req.body && req.body.name);
  const store = req.query.store || (req.body && req.body.store);

  if (!name || !store) {
    context.res = {
      status: 400,
      body: "Please provide 'name' and 'store' parameters",
    };
    return;
  }

  try {
    const qrData = `Name:${name},Store:${store}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 250,
    });

    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, "-");

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
                .content {
                    width: 400px;
                }
                .title {
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .bold {
                    font-weight: bold;
                }
                .qr-image {
                    display: block;
                    margin: 0 auto;
                    width: 250px;
                    height: 250px;
                }
                .footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    font-size: 16px;
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
                </div>
            </div>
        </body>
        </html>`;

    context.res = {
      status: 200,
      body: Buffer.from(html),
      headers: {
        "Content-Type": "text/html",
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: "Error generating QR code: " + error.message,
    };
  }
};
