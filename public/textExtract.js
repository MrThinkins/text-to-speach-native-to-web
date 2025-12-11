import * as pdfjsLib from 'https://mozilla.github.io/pdf.js/build/pdf.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs'

const file = document.getElementById('file')

file.addEventListener('change', async () => {
  console.log('file uploaded')

  const uploadedFile = file.files[0]
  console.log(uploadedFile)

  if (uploadedFile.name.toLowerCase().endsWith('.txt')) {
    console.log('txt')
  } else if (uploadedFile.name.toLowerCase().endsWith('.pdf')) {
    console.log('pdf')
    try {
      const uploadedFileUrl = URL.createObjectURL(uploadedFile)

      const textFromFile = await extractTextFromPdf({ url: uploadedFileUrl })

      window.dispatchEvent(new CustomEvent('textExtracted', { detail: textFromFile }))

      console.log(textFromFile)

      URL.revokeObjectURL(uploadedFileUrl)
    } catch (error) {
      console.error(error)
    }
    
  }
})


async function extractTextFromPdf(pdfData) {
  try {
    const loadingPdf = pdfjsLib.getDocument(pdfData)
    const pdf = await loadingPdf.promise

    const pdfPageCount = pdf.numPages
    const pageTexts = []
    
    for (let x = 1; x <= pdfPageCount; x++) {
      const page = await pdf.getPage(x)
      const pageContent = await page.getTextContent()

      const pageText = pageContent.items
        .map(item => item.str)
        .join('')

      pageTexts.push(pageText)
    }

    return pageTexts.join('\n\n')
  } catch (error) {
    console.error(error)
    throw error
  }
}