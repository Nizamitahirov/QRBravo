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
            margin-top: 76px;
            font-size: 25px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .download-btn {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            text-decoration: none;
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
    <script>
        function downloadPDF() {
            // Get current URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            // Add download parameter
            urlParams.append('download', 'true');
            // Create new URL with download parameter
            const downloadUrl = window.location.pathname + '?' + urlParams.toString();
            // Open in new tab to trigger download
            window.open(downloadUrl, '_blank');
        }
    </script>
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
    <button onclick="downloadPDF()" class="download-btn no-print">
        Download PDF
    </button>
</body>
</html>`;

// Generate PDF with exact dimensions
const generatePDF = async (html) => {
   const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    });

    const page = await browser.newPage();

  await page.setViewport({
    width: 770,
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
        size: 770px 487px;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 770px;
        height: 487px;
        overflow: hidden;
      }
      .qr-container {
        width: 770px;
        height: 487px;
      }
    `,
  });

  await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    docEl.style.width = "770px";
    docEl.style.height = "487px";
    body.style.width = "770px";
    body.style.height = "487px";
    body.style.overflow = "hidden";
  });

  const pdfBuffer = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  return pdfBuffer;
};

function formatDate() {
  return new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "-");
}

module.exports = async function (context, req) {
  const url = req.query.url || (req.body && req.body.url);
  const name = req.query.name || (req.body && req.body.name);
  const store = req.query.store || (req.body && req.body.store);
  const download = req.query.download === "true";

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

    if (download) {
      const pdfBuffer = await generatePDF(html);
      context.res = {
        status: 200,
        body: pdfBuffer,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=qr-code.pdf",
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
