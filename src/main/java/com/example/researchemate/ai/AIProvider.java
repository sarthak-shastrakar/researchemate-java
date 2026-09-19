package com.example.researchemate.ai;

public interface AIProvider {
    String generateSummary(String content);

    String explainContent(String content, String level);

    String answerQuestion(String question, String context);

    String explainImage(String base64Image, String mimeType, String optionalPrompt);

    String checkDuplicate(String content1, String content2);

    String generateReport(String projectContext);

    String extractKnowledgeGraph(String content);
}