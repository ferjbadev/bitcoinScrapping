const cheerio = require("cheerio");
const cron = require("node-cron");
const axios = require("axios").default;
const path = require("path");
const { createExcel } = require("./excel");
const sqlite3 = require("sqlite3").verbose();
require("colors");

var connection = null;

// Funcion para conectar a la base de datos SQLite
function connectToDatabase() {
  const dbPath = path.resolve(__dirname, "bitcoin.db");
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error conectando a la base de datos:", err.message.red);
    } else {
      console.log("Conexion a la base de datos exitosa".green);
    }
  });
  return db;
}

// Funcion para crear la table 'prices
function createPricesTable(dbConn, callback) {
  dbConn.run(
    `
      CREATE TABLE IF NOT EXISTS prices (
        price REAL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    (err) => {
      if (err) {
        console.error("Error creando la tabla:", err.message.red);
        return false;
      } else {
        console.log("Tabla creada exitosamente".green);
        // Llama a la función de callback si se proporciona
        if (typeof callback === "function") {
          callback(dbConn);
        }
        return true;
      }
    }
  );
}
// Función para insertar un nuevo archivo en la tabla 'prices'
function insertPrice(dbConn, price) {
  return new Promise((resolve, reject) => {
    const date = new Date();

    dbConn.run(
      "INSERT INTO prices (price) VALUES (?)",
      [price],
      function (err) {
        if (err) {
          console.error("Error insertando precio:", err.message.red);
          reject(err.message);
        } else {
          console.log(
            `Se ha insertado un nuevo archivo con ID ${this.lastID}`.green
          );
          resolve({ id: this.lastID, price: price });
        }
      }
    );
  });
}

// Se crea la funcion asincrona
function getBitcoinPrice() {
  return axios
    .get("https://es.investing.com/crypto/", { responseType: "document" })
    .then((html) => {
      // Cheerio analiza y manipula la informacion de la pagina
      let $ = cheerio.load(html.data);
      // Creo una variable con una matriz vacia
      (cryptos = []),
        // Creo una variable con una matriz vacia
        (crypto = []),
        // Creo una variable para encontrar y mostrar en una lista los elementos <tbody>
        (tbody = $("tbody").find("tr").toArray());
      // El ciclo for itera cada elemento tr en el tbody de la pagina
      for (let tr of tbody) {
        // Creo una variable con una matriz vacia
        crypto = [];
        // filter itera y filtra cada elemento que sea diferente a !=='' y lo muestra como lista
        tr = $(tr)
          .find("td")
          .filter((i, elem) => $(elem).text() !== "")
          .toArray();
        for (let td of tr) {
          // Se agrega el resultado a td como texto
          crypto.push($(td).text());
        }
        cryptos.push(crypto);
      }
      // Se muestra por consola el precio actual del Bitcoin
      const priceFound = cryptos[0][4];
      console.log(
        `El precio actual del Bitcoin es de Type: ` +
          typeof priceFound +
          ` y es: ${priceFound}`.green
      );
      price = parseFloat(priceFound.replace(".", "")); // La , en ingles es solo para separar miles, no decimales
      return price;
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
}
// Modifica startApp para que sea asíncrona y use await
async function startApp() {
  console.log("Conectando a la base de datos...".green);
  connection = connectToDatabase();
  console.log("Creando tabla de precios..".green);
  createPricesTable(connection, createExcel);
  console.log("Obteniendo precios..".green);

  try {
    // Usa await para esperar a que la promesa se resuelva
    let price = await getBitcoinPrice();
    console.log("Precio obtenido: ".green + parseFloat(price));
    console.log("Guardando precios en la tabla de datos...".green);
    insertPrice(connection, price);
  } catch (error) {
    console.error("Error al obtener el precio de Bitcoin:", error.message.red);
  }
}
//cron.schedule('0 * * * *', () => {
//});
startApp();
