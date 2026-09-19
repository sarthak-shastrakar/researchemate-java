package com.example.researchemate.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDBorderStyleDictionary;
import org.apache.poi.xwpf.usermodel.*;
import org.apache.poi.common.usermodel.HyperlinkType;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTBookmark;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DocumentExportService {

    private static final float MARGIN = 55f;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;

    // Regex to find [text](url) Markdown links
    private static final Pattern LINK_PATTERN = Pattern.compile("\\[([^\\]]+)\\]\\(([^)]+)\\)");
    // Regex to strip **bold** and `code` markers for display
    private static final Pattern BOLD_STRIP  = Pattern.compile("\\*\\*([^*]+)\\*\\*");
    private static final Pattern CODE_STRIP  = Pattern.compile("`([^`]+)`");

    // ── PDF Generation ────────────────────────────────────────────────────────

    public byte[] generatePdf(String title, String markdownContent) throws IOException {
        try (PDDocument document = new PDDocument()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font fontRegular  = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontBold     = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontItalic   = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            float[] yPos = { PAGE_HEIGHT - MARGIN };  // array so lambda can mutate it

            // --- helper lambdas via a local class wrapper ---
            class PdfWriter {
                PDPageContentStream cs;
                PDPage currentPage = page;

                PdfWriter(PDPage p) throws IOException {
                    cs = new PDPageContentStream(document, p);
                }

                void newPage() throws IOException {
                    cs.close();
                    currentPage = new PDPage(PDRectangle.A4);
                    document.addPage(currentPage);
                    cs = new PDPageContentStream(document, currentPage);
                    yPos[0] = PAGE_HEIGHT - MARGIN;
                }

                void ensureSpace(float needed) throws IOException {
                    if (yPos[0] < MARGIN + needed) newPage();
                }

                /** Draw plain text line, returns new Y */
                float drawLine(String text, PDType1Font font, float size, float x, float y, float maxW)
                        throws IOException {
                    List<String> wrapped = wrapText(text, font, size, maxW);
                    cs.beginText();
                    cs.setFont(font, size);
                    cs.newLineAtOffset(x, y);
                    for (int i = 0; i < wrapped.size(); i++) {
                        if (i > 0) {
                            cs.newLineAtOffset(0, -(size + 3));
                            y -= (size + 3);
                        }
                        cs.showText(wrapped.get(i));
                    }
                    cs.endText();
                    return y - (size + 3) * wrapped.size();
                }

                /** Draw a clickable link annotation */
                void drawLink(String linkText, String url, float x, float y, float maxW, float size)
                        throws IOException {
                    List<String> wrapped = wrapText(linkText, fontRegular, size, maxW);
                    cs.setNonStrokingColor(0.13f, 0.40f, 0.88f); // blue
                    cs.beginText();
                    cs.setFont(fontRegular, size);
                    cs.newLineAtOffset(x, y);
                    float lineY = y;
                    for (int i = 0; i < wrapped.size(); i++) {
                        String segment = wrapped.get(i);
                        if (i > 0) {
                            cs.newLineAtOffset(0, -(size + 3));
                            lineY -= (size + 3);
                        }
                        cs.showText(segment);
                        // Underline
                        float textW = fontRegular.getStringWidth(segment) / 1000 * size;
                        cs.endText();
                        cs.setStrokingColor(0.13f, 0.40f, 0.88f);
                        cs.setLineWidth(0.5f);
                        cs.moveTo(x, lineY - 1.5f);
                        cs.lineTo(x + textW, lineY - 1.5f);
                        cs.stroke();
                        cs.beginText();
                        cs.setFont(fontRegular, size);
                        cs.newLineAtOffset(x, lineY);
                    }
                    cs.endText();
                    cs.setNonStrokingColor(0f, 0f, 0f); // reset to black

                    // Add clickable annotation
                    PDAnnotationLink linkAnnot = new PDAnnotationLink();
                    PDActionURI action = new PDActionURI();
                    action.setURI(url);
                    linkAnnot.setAction(action);
                    PDBorderStyleDictionary border = new PDBorderStyleDictionary();
                    border.setWidth(0);
                    linkAnnot.setBorderStyle(border);
                    float textH = fontRegular.getStringWidth(wrapped.get(0)) / 1000 * size;
                    linkAnnot.setRectangle(new PDRectangle(x, lineY - 2, Math.min(textH + 10, maxW), size + 4));
                    currentPage.getAnnotations().add(linkAnnot);
                }
            }

            PdfWriter writer = new PdfWriter(page);

            // ── Title page header ─────────────────────────────────────────────
            writer.ensureSpace(40);
            yPos[0] = writer.drawLine(title, fontBold, 20f, MARGIN, yPos[0], USABLE_WIDTH);
            yPos[0] -= 12;

            // Horizontal rule
            writer.cs.setStrokingColor(0.8f, 0.8f, 0.8f);
            writer.cs.setLineWidth(1f);
            writer.cs.moveTo(MARGIN, yPos[0]);
            writer.cs.lineTo(PAGE_WIDTH - MARGIN, yPos[0]);
            writer.cs.stroke();
            yPos[0] -= 16;

            // ── Process each Markdown line ────────────────────────────────────
            String[] lines = markdownContent.split("\\n");
            for (String rawLine : lines) {

                // Blank line → small gap
                if (rawLine.isBlank()) {
                    yPos[0] -= 6;
                    continue;
                }

                // HR separator ---
                if (rawLine.matches("^-{3,}\\s*$") || rawLine.matches("^\\*{3,}\\s*$")) {
                    writer.ensureSpace(16);
                    writer.cs.setStrokingColor(0.8f, 0.8f, 0.8f);
                    writer.cs.setLineWidth(0.75f);
                    writer.cs.moveTo(MARGIN, yPos[0]);
                    writer.cs.lineTo(PAGE_WIDTH - MARGIN, yPos[0]);
                    writer.cs.stroke();
                    writer.cs.setStrokingColor(0f, 0f, 0f);
                    yPos[0] -= 14;
                    continue;
                }

                // Headings
                int headingLevel = 0;
                String headingText = rawLine;
                if (rawLine.startsWith("### ")) { headingLevel = 3; headingText = rawLine.substring(4); }
                else if (rawLine.startsWith("## ")) { headingLevel = 2; headingText = rawLine.substring(3); }
                else if (rawLine.startsWith("# "))  { headingLevel = 1; headingText = rawLine.substring(2); }

                if (headingLevel > 0) {
                    float size = headingLevel == 1 ? 16f : headingLevel == 2 ? 13f : 11.5f;
                    yPos[0] -= (headingLevel == 1 ? 10 : 6);
                    writer.ensureSpace(size + 10);
                    String clean = stripInlineMarkdown(headingText);
                    yPos[0] = writer.drawLine(clean, fontBold, size, MARGIN, yPos[0], USABLE_WIDTH);
                    yPos[0] -= 4;
                    continue;
                }

                // Bullet point
                if (rawLine.startsWith("- ") || rawLine.startsWith("* ")) {
                    String bulletContent = rawLine.substring(2);
                    writer.ensureSpace(18);
                    // Draw bullet dot
                    writer.cs.beginText();
                    writer.cs.setFont(fontRegular, 11f);
                    writer.cs.newLineAtOffset(MARGIN + 4, yPos[0]);
                    writer.cs.showText("\u2022");
                    writer.cs.endText();

                    // Check for link in bullet
                    Matcher m = LINK_PATTERN.matcher(bulletContent);
                    if (m.find()) {
                        // Text before link
                        String before = stripInlineMarkdown(bulletContent.substring(0, m.start()));
                        String linkTxt = m.group(1);
                        String url = m.group(2);
                        String after = stripInlineMarkdown(bulletContent.substring(m.end()));

                        float x = MARGIN + 18;
                        if (!before.isBlank()) {
                            writer.cs.beginText();
                            writer.cs.setFont(fontRegular, 11f);
                            writer.cs.newLineAtOffset(x, yPos[0]);
                            writer.cs.showText(before + " ");
                            writer.cs.endText();
                            x += fontRegular.getStringWidth(before + " ") / 1000 * 11f;
                        }
                        writer.drawLink(linkTxt, url, x, yPos[0], USABLE_WIDTH - 18, 11f);
                        yPos[0] -= 16;
                    } else {
                        String clean = stripInlineMarkdown(bulletContent);
                        yPos[0] = writer.drawLine(clean, fontRegular, 11f, MARGIN + 18, yPos[0], USABLE_WIDTH - 18);
                    }
                    continue;
                }

                // Numbered list: "1. " pattern
                if (rawLine.matches("^\\d+\\.\\s.*")) {
                    int dotIdx = rawLine.indexOf(". ");
                    String num = rawLine.substring(0, dotIdx + 2);
                    String rest = rawLine.substring(dotIdx + 2);
                    writer.ensureSpace(18);

                    Matcher m = LINK_PATTERN.matcher(rest);
                    if (m.find()) {
                        // Draw number
                        writer.cs.beginText();
                        writer.cs.setFont(fontBold, 11f);
                        writer.cs.newLineAtOffset(MARGIN, yPos[0]);
                        writer.cs.showText(num);
                        writer.cs.endText();
                        float numW = fontBold.getStringWidth(num) / 1000 * 11f;

                        // Draw link
                        String before = stripInlineMarkdown(rest.substring(0, m.start()));
                        String linkTxt = m.group(1);
                        String url = m.group(2);

                        float x = MARGIN + numW;
                        if (!before.isBlank()) {
                            writer.cs.beginText();
                            writer.cs.setFont(fontRegular, 11f);
                            writer.cs.newLineAtOffset(x, yPos[0]);
                            writer.cs.showText(before);
                            writer.cs.endText();
                            x += fontRegular.getStringWidth(before) / 1000 * 11f;
                        }
                        writer.drawLink(linkTxt, url, x, yPos[0], USABLE_WIDTH - numW, 11f);
                        yPos[0] -= 16;
                    } else {
                        String clean = num + stripInlineMarkdown(rest);
                        yPos[0] = writer.drawLine(clean, fontRegular, 11f, MARGIN, yPos[0], USABLE_WIDTH);
                    }
                    continue;
                }

                // Regular paragraph — check for inline link
                writer.ensureSpace(18);
                Matcher m = LINK_PATTERN.matcher(rawLine);
                if (m.find()) {
                    String before = stripInlineMarkdown(rawLine.substring(0, m.start()));
                    String linkTxt = m.group(1);
                    String url = m.group(2);
                    String after = stripInlineMarkdown(rawLine.substring(m.end()));

                    float x = MARGIN;
                    if (!before.isBlank()) {
                        writer.cs.beginText();
                        writer.cs.setFont(fontRegular, 11f);
                        writer.cs.newLineAtOffset(x, yPos[0]);
                        writer.cs.showText(before + " ");
                        writer.cs.endText();
                        x += fontRegular.getStringWidth(before + " ") / 1000 * 11f;
                    }
                    writer.drawLink(linkTxt, url, x, yPos[0], USABLE_WIDTH - (x - MARGIN), 11f);
                    yPos[0] -= 15;

                    if (!after.isBlank()) {
                        writer.ensureSpace(14);
                        yPos[0] = writer.drawLine(after.trim(), fontRegular, 11f, MARGIN, yPos[0], USABLE_WIDTH);
                    }
                } else {
                    // Plain text with bold stripping
                    String clean = stripInlineMarkdown(rawLine);
                    yPos[0] = writer.drawLine(clean, fontRegular, 11f, MARGIN, yPos[0], USABLE_WIDTH);
                }
            }

            writer.cs.close();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // ── DOCX Generation ───────────────────────────────────────────────────────

    public byte[] generateDocx(String title, String markdownContent) throws IOException {
        try (XWPFDocument document = new XWPFDocument()) {

            // Document title
            XWPFParagraph titlePara = document.createParagraph();
            titlePara.setStyle("Heading1");
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText(title);
            titleRun.setBold(true);
            titleRun.setFontSize(22);
            titleRun.setColor("1A2B4A");
            titlePara.setSpacingAfter(240);

            String[] lines = markdownContent.split("\\n");

            for (String rawLine : lines) {

                // Blank line
                if (rawLine.isBlank()) {
                    XWPFParagraph blank = document.createParagraph();
                    blank.setSpacingAfter(60);
                    continue;
                }

                // HR ---
                if (rawLine.matches("^-{3,}\\s*$") || rawLine.matches("^\\*{3,}\\s*$")) {
                    XWPFParagraph hrPara = document.createParagraph();
                    hrPara.setSpacingBefore(120);
                    hrPara.setSpacingAfter(120);
                    // Word paragraph border as HR
                    org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPPr ppr =
                            hrPara.getCTP().addNewPPr();
                    org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPBdr borders =
                            ppr.addNewPBdr();
                    org.openxmlformats.schemas.wordprocessingml.x2006.main.CTBorder bot =
                            borders.addNewBottom();
                    bot.setVal(org.openxmlformats.schemas.wordprocessingml.x2006.main.STBorder.SINGLE);
                    bot.setSz(java.math.BigInteger.valueOf(6));
                    bot.setColor("CCCCCC");
                    continue;
                }

                // Headings
                if (rawLine.startsWith("# ") || rawLine.startsWith("## ") || rawLine.startsWith("### ")) {
                    int level = rawLine.startsWith("### ") ? 3 : rawLine.startsWith("## ") ? 2 : 1;
                    String headingText = rawLine.replaceAll("^#+\\s*", "");
                    XWPFParagraph para = document.createParagraph();
                    para.setStyle("Heading" + level);
                    para.setSpacingBefore(level == 1 ? 360 : 240);
                    para.setSpacingAfter(120);
                    XWPFRun run = para.createRun();
                    run.setText(stripInlineMarkdown(headingText));
                    run.setBold(true);
                    run.setFontSize(level == 1 ? 16 : level == 2 ? 14 : 12);
                    run.setColor(level == 1 ? "1A2B4A" : "2D4080");
                    continue;
                }

                // Bullet list
                if (rawLine.startsWith("- ") || rawLine.startsWith("* ")) {
                    String content = rawLine.substring(2);
                    XWPFParagraph para = document.createParagraph();
                    para.setNumID(getOrCreateBulletList(document));
                    para.setSpacingAfter(60);
                    addRunsWithLinks(document, para, content);
                    continue;
                }

                // Numbered list
                if (rawLine.matches("^\\d+\\.\\s.*")) {
                    XWPFParagraph para = document.createParagraph();
                    para.setSpacingAfter(80);
                    addRunsWithLinks(document, para, rawLine);
                    continue;
                }

                // Regular paragraph
                XWPFParagraph para = document.createParagraph();
                para.setSpacingAfter(100);
                addRunsWithLinks(document, para, rawLine);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.write(out);
            return out.toByteArray();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Adds text runs to a DOCX paragraph, creating real Word hyperlinks for [text](url).
     */
    private void addRunsWithLinks(XWPFDocument document, XWPFParagraph para, String text) {
        Matcher m = LINK_PATTERN.matcher(text);
        int last = 0;

        while (m.find()) {
            // Text before link
            String before = stripInlineMarkdown(text.substring(last, m.start()));
            if (!before.isEmpty()) {
                XWPFRun run = para.createRun();
                run.setText(before);
                run.setFontSize(11);
            }

            // Hyperlink
            String linkText = m.group(1);
            String url      = m.group(2);
            String rId = document.getPackagePart()
                    .addExternalRelationship(url, XWPFRelation.HYPERLINK.getRelation())
                    .getId();

            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTHyperlink cth =
                    para.getCTP().addNewHyperlink();
            cth.setId(rId);

            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTR ctr = cth.addNewR();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTRPr rpr = ctr.addNewRPr();

            // Blue colour
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTColor color =
                    rpr.addNewColor();
            color.setVal("2262CC");

            // Underline
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTUnderline ul =
                    rpr.addNewU();
            ul.setVal(org.openxmlformats.schemas.wordprocessingml.x2006.main.STUnderline.SINGLE);

            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTText ctText =
                    ctr.addNewT();
            ctText.setStringValue(linkText);

            last = m.end();
        }

        // Remaining text after last link
        String after = stripInlineMarkdown(text.substring(last));
        if (!after.isEmpty()) {
            XWPFRun run = para.createRun();
            run.setText(after);
            run.setFontSize(11);
        }
    }

    private static java.math.BigInteger bulletListId = null;

    /** Get or create a numbering definition for bullet lists */
    private java.math.BigInteger getOrCreateBulletList(XWPFDocument document) {
        if (bulletListId != null) return bulletListId;
        XWPFNumbering numbering = document.createNumbering();
        bulletListId = java.math.BigInteger.ONE;
        return bulletListId;
    }

    /** Strip **bold**, `code`, and other inline markers from text */
    private String stripInlineMarkdown(String text) {
        if (text == null) return "";
        // Remove **bold** markers but keep text
        text = BOLD_STRIP.matcher(text).replaceAll("$1");
        // Remove `code` markers but keep text
        text = CODE_STRIP.matcher(text).replaceAll("$1");
        // Remove remaining lone * or _
        text = text.replaceAll("(?<![a-zA-Z])([*_])(?![a-zA-Z])", "");
        return text.trim();
    }

    /** Word-wrap text to fit within maxWidth given font + size */
    private List<String> wrapText(String text, PDType1Font font, float fontSize, float maxWidth)
            throws IOException {
        List<String> result = new ArrayList<>();
        if (text == null || text.isBlank()) {
            result.add("");
            return result;
        }
        StringBuilder current = new StringBuilder();
        for (String word : text.split(" ")) {
            String test = current.isEmpty() ? word : current + " " + word;
            float w = font.getStringWidth(test) / 1000 * fontSize;
            if (w > maxWidth && !current.isEmpty()) {
                result.add(current.toString());
                current = new StringBuilder(word);
            } else {
                current = new StringBuilder(test);
            }
        }
        if (!current.isEmpty()) result.add(current.toString());
        return result.isEmpty() ? List.of("") : result;
    }
}