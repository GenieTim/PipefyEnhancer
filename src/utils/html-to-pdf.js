const {chromium} = require('playwright')

async function htmlToPdf(html, filepath) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html)
  await page.pdf({path: filepath, format: 'A4'})
  await browser.close()
}
module.exports = htmlToPdf
