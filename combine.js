const fs = require("fs/promises");
const _ = require("lodash");
const papa = require("papaparse");

async function combine() {
  const files = await fs.readdir("./pagesData");
  let arrayOfData = [];

  for (const fileName of files) {
    const file = await fs.readFile(`./pagesData/${fileName}`);
    const data = JSON.parse(file);
    arrayOfData = [...arrayOfData, ...data];
  }

  const csv = papa.unparse(arrayOfData, {
    columns: [
      "image_url_0",
      "image_url_1",
      "image_url_2",
      "image_url_3",
      "image_url_4",
      "image_url_5",
      "id",
      "subject",
      "pub_aut",
      "location",
      "date",
      "keyword",
      "media_type",
      "source",
      "value",
      "paid_by",
      "file_name",
      "created_by",
      "str_loc",
      "click",
      "cdate",
    ],
  });

  await fs.writeFile("./combine.csv", csv);
}

module.exports = { combine };
