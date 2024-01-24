const excel = require("exceljs");
require("colors");

function createExcel(db) {
  // Ejecutar el querry para obtener los datos
  const querry = "SELECT * FROM prices";
  db.all(querry, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }

    // Crear un libro de excel
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("datos");

    // Agregar datos en columna
    const columnNames = Object(rows[0]);
    worksheet.addRow(columnNames);

    // Agregar datos a la hoja de excel
    rows.forEach((row) => {
      const rowData = Object.values(row);
      worksheet.addRow(rowData);
    });

    // Guardar libro de excel
    workbook.xlsx
      .writeFile("datos_exportados.xlsx")
      .then(() => {
        console.log("Archivo de excel generado con exito".green);
      })
      .catch((error) => {
        console.error("Error al general el archivo excel", error.message);
      });
  });
}

module.exports = {
  createExcel,
};
