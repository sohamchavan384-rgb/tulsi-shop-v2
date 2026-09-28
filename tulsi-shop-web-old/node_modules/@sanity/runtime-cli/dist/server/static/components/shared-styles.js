/* globals fetch */

let sharedStyleSheetsPromise = null

async function loadSharedStyleSheets() {
  // Fetch both stylesheets
  const [mCssResponse, appCssResponse] = await Promise.all([
    fetch('./vendor/m-.css'),
    fetch('./components/app.css'),
  ])

  const [mCssText, appCssText] = await Promise.all([mCssResponse.text(), appCssResponse.text()])

  // Create CSSStyleSheet objects
  const mSheet = new CSSStyleSheet()
  const appSheet = new CSSStyleSheet()

  await Promise.all([mSheet.replace(mCssText), appSheet.replace(appCssText)])

  return [mSheet, appSheet]
}

export function getSharedStyleSheets() {
  if (!sharedStyleSheetsPromise) {
    sharedStyleSheetsPromise = loadSharedStyleSheets().catch((error) => {
      console.error('Failed to load shared stylesheets:', error)
      // Reset so a later caller can retry instead of being stuck with [].
      sharedStyleSheetsPromise = null
      return []
    })
  }

  return sharedStyleSheetsPromise
}
