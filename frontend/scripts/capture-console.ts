import { chromium } from 'playwright'

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  page.on('console', (msg) => {
    console.log(`[console:${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err) => {
    console.error('[pageerror]', err)
  })

  const url = `http://127.0.0.1:${process.env.PORT ?? '5175'}/login`
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  await browser.close()
})()
