const puppeteer = require("puppeteer");

async function generateGraphic(datasets) {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 600, height: 600 }
  });
  const page = await browser.newPage();
  await page.setContent(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            background: #fff;
            color: #000;
            margin: 0;
          }
          html,
          body,
          #chart {
            width: 600px;
            height: 600px;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0"></script>
      </head>
      <body>
        <canvas id="chart"></canvas>

        <script>
          var ctx = document.getElementById("chart").getContext("2d");
          var chart = new Chart(ctx, {
            // The type of chart we want to create
            type: "bar",

            // The data for our dataset
            data: {
              labels: ${Object.keys(datasets)},
              datasets: [
                {
                  label: "Op/Sec",
                  backgroundColor: "rgb(0, 99, 255)",
                  data: ${Object.values(datasets)}
                }
              ]
            },

            // Configuration options go here
            options: {
              aspectRatio: 1,
              tooltips: {
                mode: "index"
              },
              animation: {
                duration: 0 // general animation time
              }
            }
          });
        </script>
      </body>
    </html>
    `,
    {
      waitUntil: ["domcontentloaded", "load", "networkidle2"]
    }
  );

  await page.screenshot({ path: "./benchmarks/benchmarks.png" });

  await browser.close();
}

generateGraphic({
  schemapack: 100,
  "default socket.io": 70,
  msgpack: 60,
  JSON: 40
});
