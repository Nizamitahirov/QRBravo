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
        
 

         html,   body {
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
                  margin-top:12px;
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
                  margin-top: 76px;
                  font-size: 25px;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
        @media print {
            .no-print {
                display: none;
            }
            html, body, .qr-container {
                width: 770px !important;
                height: 487px !important;
                 border: none;
            }
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
                <a href="${url}" target="_blank" class="no-print">Click here to visit the URL</a>
            </div>
        </div>
    </div>
    <div style="position: fixed; bottom: 20px; text-align: center; width: 100%;" class="no-print">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Download PDF
        </button>
    </div>
</body>
</html>`;

async function generatePDF(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Force exact page size
  await page.setViewport({
    width: 766,
    height: 487,
    deviceScaleFactor: 1,
  });

  await page.setContent(html, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // Additional CSS to force size
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

  // Force viewport size through JavaScript
  await page.evaluate(() => {
    document.documentElement.style.width = "770px";
    document.documentElement.style.height = "487px";
    document.body.style.width = "770px";
    document.body.style.height = "487px";
  });

  // Generate PDF with exact dimensions
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

// Format current date
function formatDate() {
  return new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "-");
}

// Main Azure Function
module.exports = async function (context, req) {
  const url = req.query.url || (req.body && req.body.url);
  const name = req.query.name || (req.body && req.body.name);
  const store = req.query.store || (req.body && req.body.store);
  const format = req.query.format || (req.body && req.body.format) || "html";

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

    if (format === "pdf") {
      const pdfBuffer = await generatePDF(html);
      context.res = {
        status: 200,
        body: pdfBuffer,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=output.pdf",
        },
      };
    } else {
      context.res = {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
        body: html,
      };
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: "Error generating output: " + error.message,
    };
  }
};
