const QRCode = require("qrcode");
const puppeteer = require("puppeteer");

// HTML template for the QR code page
const generateHtml = (qrDataUrl, name, store, url, currentDate) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        @page {
            size: 770px 487px;
            margin: 0;
        }
        html, body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: white;
            overflow:hidden;
            
        }
        .qr-container {
            width: 770px;
            height: 487px;
            padding: 30px;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }
        .title {
            text-align: center;
            margin-top: 12px;
            margin-bottom: 62px;
            font-size: 25px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .bold {
            font-weight: bold;
            font-size: 25px;
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
            margin-top: 64px;
            font-size: 25px;
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

async function generatePDF(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 766,
    height: 487,
    deviceScaleFactor: 1,
  });

  await page.setContent(html, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  await page.addStyleTag({
    content: `
            @page {
                size: 766px 487px !important;
                margin: 0 !important;
            }
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 766px !important;
                height: 487px !important;
            }
        `,
  });

  await page.evaluate(() => {
    document.documentElement.style.width = "770px";
    document.documentElement.style.height = "487px";
    document.body.style.width = "770px";
    document.body.style.height = "487px";
  });

  const pdfBuffer = await page.pdf({
    width: "770px",
    height: "487px",
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    },
  });

  await browser.close();
  return pdfBuffer;
}

function formatDate() {
  return new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "-");
}

// ... (previous HTML template and helper functions remain the same) ...

module.exports = async function (context, req) {
  const url = req.query.url || (req.body && req.body.url);
  const name = req.query.name || (req.body && req.body.name);
  const store = req.query.store || (req.body && req.body.store);

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
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 250,
    });

    const currentDate = formatDate();
    const html = generateHtml(qrDataUrl, name, store, url, currentDate);
    const pdfBuffer = await generatePDF(html);

    // Always return PDF response
    context.res = {
      status: 200,
      body: pdfBuffer,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=qr-code.pdf", // Changed to inline
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: "Error generating output: " + error.message,
    };
  }
};
