package com.example.researchemate.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class OpenRouterService implements AIProvider {

    @Value("${researchmate.ai.openrouter-key}")
    private String apiKey;

    @Value("${researchmate.ai.openrouter-url}")
    private String apiUrl;

    @Value("${researchmate.ai.openrouter-model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isGeminiKey() {
        return apiKey != null && apiKey.trim().startsWith("AIza");
    }

    @Override
    public String generateSummary(String content) {
        String prompt = "Summarize the following content in 3-5 concise sentences, "
                + "highlighting the key points:\n\n" + content;
        return callAI(prompt);
    }

    @Override
    public String explainContent(String content, String level) {
        String levelInstruction = switch (level.toLowerCase()) {
            case "beginner" ->
                "Explain as if talking to a complete beginner with no prior knowledge. Use very simple words, everyday analogies, and short sentences. Avoid all jargon.";
            case "intermediate" ->
                "Explain as if talking to someone with basic background knowledge. You can use some technical terms but always clarify them. Use clear examples.";
            case "advanced" ->
                "Explain as if talking to an expert or researcher in the field. Use precise technical language, dive into nuances, and highlight edge cases or deeper implications.";
            default -> "Explain clearly and concisely.";
        };

        String prompt = "You are a helpful educational assistant. Your task is to explain the following content.\n\n"
                + "Audience level: " + level.toUpperCase() + "\n"
                + "Instructions: " + levelInstruction + "\n\n"
                + "Content to explain:\n" + content + "\n\n"
                + "Provide a thorough, multi-paragraph explanation (at least 3-5 sentences). "
                + "Do NOT include any safety disclaimers, metadata, or one-word answers. "
                + "Just explain the content directly.";
        return callAI(prompt);
    }

    @Override
    public String answerQuestion(String question, String context) {
        String prompt = "Answer the question ONLY using the context below. "
                + "If the answer is not in the context, say you don't have enough information.\n\n"
                + "Context:\n" + context + "\n\nQuestion: " + question;
        return callAI(prompt);
    }

    private String callAI(String prompt) {
        if (isGeminiKey()) {
            return callGemini(prompt);
        } else {
            return callOpenRouter(prompt);
        }
    }

    private String callGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
                + apiKey.trim();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        try {
            String response = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            if (root.has("error")) {
                String errMsg = root.path("error").path("message").asText("Gemini AI error");
                throw new RuntimeException("Gemini API error: " + errMsg);
            }
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new RuntimeException(
                    "Gemini API key is invalid or expired (401 Unauthorized). Please set a valid Gemini key (AIza...) or OpenRouter key (sk-or-v1-...) in application.properties.",
                    e);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Gemini AI request failed: " + e.getMessage(), e);
        }
    }

    private String callOpenRouter(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "ResearchMate");

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String response = restTemplate.postForObject(apiUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new RuntimeException(
                    "AI API key is invalid or expired (401 Unauthorized). Please set a valid OpenRouter key (sk-or-v1-...) or Gemini key (AIza...) in application.properties.",
                    e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI request failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String explainImage(String base64Image, String mimeType, String optionalPrompt) {
        if (isGeminiKey()) {
            return explainImageWithGemini(base64Image, mimeType, optionalPrompt);
        } else {
            return explainImageWithOpenRouter(base64Image, mimeType, optionalPrompt);
        }
    }

    private String explainImageWithGemini(String base64Image, String mimeType, String optionalPrompt) {
        String instruction = (optionalPrompt != null && !optionalPrompt.isBlank())
                ? optionalPrompt
                : "Explain what this image shows in detail, in simple language.";

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
                + apiKey.trim();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = Map.of("text", instruction);
        Map<String, Object> imagePart = Map.of(
                "inline_data", Map.of(
                        "mime_type", mimeType,
                        "data", base64Image));

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(textPart, imagePart))));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        try {
            String response = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response);

            if (root.has("error")) {
                String errMsg = root.path("error").path("message").asText("Gemini AI error");
                throw new RuntimeException("Gemini API error: " + errMsg);
            }

            String content = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            if (content == null || content.isBlank()) {
                throw new RuntimeException("Gemini returned an empty response. Please try again.");
            }
            return content;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Gemini image request failed: " + e.getMessage(), e);
        }
    }

    private String explainImageWithOpenRouter(String base64Image, String mimeType, String optionalPrompt) {
        String instruction = (optionalPrompt != null && !optionalPrompt.isBlank())
                ? optionalPrompt
                : "Explain what this image shows in detail, in simple language.";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "ResearchMate");

        Map<String, Object> content1 = Map.of("type", "text", "text", instruction);
        Map<String, Object> content2 = Map.of(
                "type", "image_url",
                "image_url", Map.of("url", "data:" + mimeType + ";base64," + base64Image));

        String visionModel = model;
        if (model == null || (!model.contains("vision") && !model.contains("gemini") && !model.contains("gpt-4o")
                && !model.contains("claude-3"))) {
            visionModel = "google/gemini-2.0-flash-lite-001:free";
        }

        Map<String, Object> requestBody = Map.of(
                "model", visionModel,
                "messages", List.of(
                        Map.of("role", "user", "content", List.of(content1, content2))));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String response = restTemplate.postForObject(apiUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(response);

            if (root.has("error")) {
                String errMsg = root.path("error").path("message").asText("Unknown AI error");
                throw new RuntimeException("AI provider error: " + errMsg);
            }

            String content = root.path("choices").get(0).path("message").path("content").asText();

            if (content == null || content.isBlank()) {
                throw new RuntimeException("AI returned an empty response. Please try again.");
            }
            String contentLower = content.toLowerCase();
            if (contentLower.startsWith("user safety")
                    || contentLower.startsWith("response safety")
                    || contentLower.contains("i cannot") && contentLower.contains("image")
                    || content.trim().length() < 20) {
                throw new RuntimeException(
                        "AI could not analyze this image (content policy or model limitation). " +
                                "Please try a different image or model.");
            }

            return content;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI image request failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String checkDuplicate(String content1, String content2) {
        String prompt = "Compare these two pieces of content. Respond with ONLY one word: "
                + "'DUPLICATE' if they discuss the same specific topic/finding with significant overlap, "
                + "or 'DIFFERENT' if they cover different topics or add distinct information.\n\n"
                + "Content A:\n" + content1 + "\n\nContent B:\n" + content2;
        return callAI(prompt).trim().toUpperCase();
    }

    @Override
    public String generateReport(String projectContext) {
        String prompt = "You are a research assistant. Based on the following collected research "
                + "(source summaries and personal notes), write a well-structured research report in Markdown format. "
                + "Include: a brief introduction, key findings organized under clear headings, "
                + "and a conclusion. Be concise but thorough.\n\n"
                + "Research Data:\n" + projectContext;
        return callAI(prompt);
    }

    @Override
    public String extractKnowledgeGraph(String content) {
        String prompt = "Analyze the following text and extract key concepts, technologies, and entities, "
                + "along with how they relate to each other. "
                + "Return ONLY valid JSON in this exact format, with no extra text or explanation:\n"
                + "{\n"
                + "  \"nodes\": [{\"name\": \"...\", \"type\": \"CONCEPT|TECHNOLOGY|PERSON|OTHER\"}],\n"
                + "  \"edges\": [{\"source\": \"...\", \"target\": \"...\", \"label\": \"uses|requires|related to|part of\"}]\n"
                + "}\n\n"
                + "Extract at most 8 nodes and 8 edges — only the most important ones. "
                + "Node names in 'edges' must exactly match names in 'nodes'.\n\n"
                + "Text:\n" + content;
        return callAI(prompt);
    }

    @Async("aiTaskExecutor")
    public CompletableFuture<String> generateSummaryAsync(String content) {
        String result = generateSummary(content);
        return CompletableFuture.completedFuture(result);
    }
}