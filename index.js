const { load } = require("cheerio");
const fs = require("fs/promises");
const puppeteer = require("puppeteer-core");
const { combine } = require("./combine");

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto("https://db.ipohworld.org/web_report/", {
    waitUntil: ["domcontentloaded", "networkidle0"],
  });

  try {
    let continueToNextPage = true;
    let pageNumber = 1;
    let headers = [];
    let $;

    // Get headers
    const headerHtml = await page.content();
    $ = load(headerHtml);

    $("#dtItemsTable > thead > tr")
      .children()
      .each((i, td) => {
        headers[i] = $(td).text();
      });

    // select 500
    await page.select("#dtItemsTable_length > label > select", "100");
    await page.waitForNetworkIdle({ timeout: 0 });

    do {
      console.log(`Current page is: ${pageNumber}`);
      let currentPageData = [];

      const html = await page.content();
      const $ = load(html);

      const rows = $("tbody tr");

      rows.each((rowNumber, row) => {
        currentPageData.push({});

        $(row)
          .children()
          .each((k, column) => {
            // Special handling for column 0
            if (k === 0) {
              $(column)
                .children()
                .each((imageIndex, el) => {
                  if (el.tagName !== "a") return false;

                  const rawLink = $(el).attr("href").substring(2);
                  const link = `https://db.ipohworld.org${rawLink}`;
                  currentPageData[rowNumber][`image_url_${imageIndex}`] = link;
                });

              //   console.log(firstCol.attr("href"));
            } else {
              const colValue = $(column).text();
              currentPageData[rowNumber][headers[k]] = colValue;
            }
          });
      });

      // Write data of current page
      await fs.writeFile(
        `./pagesData/page-${pageNumber}.json`,
        JSON.stringify(currentPageData)
      );
      console.log(`Done writing to ./pagesData/page-${pageNumber}.json`);

      // Click Next button
      await page.click("#dtItemsTable_next");
      await page.waitForNetworkIdle({ timeout: 0 });

      await page.screenshot({ path: "example.png" });
      if (pageNumber === 5) continueToNextPage = false;

      pageNumber++;
    } while (continueToNextPage);

    await browser.close();

    // Combine data
    await combine();
  } catch (error) {
    console.error("ERROR SOMEWHERE", error);
  }
}

main();
