import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

export async function extractTextFromPDF(file) {
    try {
        if (!file) {
            console.error("No file provided for PDF extraction.");
            return null;
        }
        console.log("Extracting text from file:", file.name, "size:", file.size);

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;

        console.log(`PDF loaded with ${pdf.numPages} pages.`);

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
            console.log(`Extracted text from page ${i}:`, pageText.slice(0, 100) + "...");
        }

        return fullText;
    } catch (error) {
        console.error("❌ Could not extract PDF text:", error);
        return null;
    }
}
