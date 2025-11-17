// PDF Generator using jsPDF to generate and download PDF files automatically
import jsPDF from 'jspdf'

interface PDFData {
    report: {
        _id: string
        createdAt: number
        text: string
        emotionData: {
            anger?: number
            sadness?: number
            anxiety?: number
            fear?: number
            happiness?: number
            guilt?: number
        }
        testResults?: Array<{
            question: string
            answer: string
            score: number
        }>
        richTextContent?: string
    }
    childName: string
    evaluatorName: string
}

export async function generatePDF(data: PDFData) {
    const { report, childName, evaluatorName } = data

    // Create new PDF document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPos = margin

    // Helper function to add a new page if needed
    const checkNewPage = (requiredHeight: number) => {
        if (yPos + requiredHeight > pageHeight - margin) {
            doc.addPage()
            yPos = margin
        }
    }

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
        doc.setFontSize(fontSize)
        doc.setTextColor(color)
        if (isBold) {
            doc.setFont('helvetica', 'bold')
        } else {
            doc.setFont('helvetica', 'normal')
        }
        
        const lines = doc.splitTextToSize(text, maxWidth)
        checkNewPage(lines.length * fontSize * 0.4)
        doc.text(lines, margin, yPos)
        yPos += lines.length * fontSize * 0.4 + 5
    }

    // Title
    addText('Assessment Report', 24, true)
    yPos += 10

    // Assessment Information
    addText('Assessment Information', 16, true)
    addText(`Child: ${childName}`, 12)
    addText(`Date: ${new Date(report.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, 12)
    addText(`Evaluator: ${evaluatorName}`, 12)
    yPos += 5

    // Emotional State
    addText('Emotional State', 16, true)
    const emotions = report.emotionData
    const emotionEntries = [
        { name: 'Anger', value: emotions.anger },
        { name: 'Sadness', value: emotions.sadness },
        { name: 'Anxiety', value: emotions.anxiety },
        { name: 'Fear', value: emotions.fear },
        { name: 'Happiness', value: emotions.happiness },
        { name: 'Guilt', value: emotions.guilt },
    ].filter((e) => e.value !== undefined && e.value !== null)
    
    emotionEntries.forEach((e) => {
        addText(`${e.name}: ${e.value}/5`, 12)
    })
    yPos += 5

    // Notes
    addText('Notes', 16, true)
    const notesText = report.text || 'No notes provided.'
    addText(notesText, 12)
    yPos += 5

    // Rich Text Content
    if (report.richTextContent) {
        addText('Additional Notes', 14, true)
        // Strip HTML tags for plain text PDF
        const plainText = report.richTextContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
        addText(plainText, 12)
        yPos += 5
    }

    // Test Results
    if (report.testResults && report.testResults.length > 0) {
        const testScore = Math.round(
            (report.testResults.reduce((sum, r) => sum + r.score, 0) / (report.testResults.length * 4)) * 100
        )
        
        addText('Test Results', 16, true)
        addText(`Overall Score: ${testScore}%`, 12, true, testScore < 50 ? '#ff0000' : testScore < 70 ? '#ff8800' : '#00aa00')
        yPos += 5
        
        report.testResults.forEach((result, index) => {
            checkNewPage(20)
            addText(`${index + 1}. ${result.question}`, 12, true)
            addText(`Answer: ${result.answer}`, 11)
            addText(`Score: ${result.score}/4`, 11)
            yPos += 3
        })
    }

    // Recommendations
    yPos += 5
    addText('Recommendations', 16, true)
    addText('Please review these recommendations with your child\'s therapist for personalized guidance.', 12)

    // Generate filename
    const dateStr = new Date(report.createdAt).toISOString().split('T')[0]
    const filename = `Assessment_Report_${childName.replace(/\s+/g, '_')}_${dateStr}.pdf`

    // Save PDF
    doc.save(filename)
}

