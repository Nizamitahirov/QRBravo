const QRCode = require("qrcode");
const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
  try {
    const { name, store } = req.body;

    if (!name || !store) {
      context.res = {
        status: 400,
        body: { message: "Name və store parametrləri tələb olunur" },
      };
      return;
    }

    // Cosmos DB qoşulma
    const client = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY,
    });

    const database = client.database(process.env.COSMOS_DATABASE);
    const container = database.container(process.env.COSMOS_CONTAINER);

    // QR kod yaratma
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

    // Cosmos DB-də saxlama
    const item = {
      name,
      store,
      qrCode: qrDataUrl,
      publishedDate: currentDate,
      createdAt: new Date().toISOString(),
    };

    const { resource } = await container.items.create(item);

    context.res = {
      status: 200,
      body: {
        id: resource.id,
        name: resource.name,
        store: resource.store,
        publishedDate: resource.publishedDate,
        qrCode: resource.qrCode,
      },
    };
  } catch (error) {
    context.log.error("Error:", error);
    context.res = {
      status: 500,
      body: { message: "Server xətası" },
    };
  }
};
