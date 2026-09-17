# StudentAI — Future AI Integration Architecture & Plan

**Status:** INACTIVE in MVP (Deterministic local algorithms used exclusively).  
**Philosophy:** No paid AI API dependencies. Future AI must be free or user-controlled.

---

## 1. Architectural Guardrails

StudentAI does not include paid AI APIs in the MVP. We believe students should never be forced into expensive AI API subscriptions for basic utility tools.

Furthermore:
- **No Faux AI:** We do not label standard regular expressions or deterministic tokenizers as "Artificial Intelligence".
- **No Hidden Network Calls:** When AI features are added in the future, they will run either client-side via WebAssembly/WebGPU or explicitly through user-provided API credentials.

---

## 2. Future Client-Side AI Pathways (Zero Cloud Cost)

### Pathway A: In-Browser WebGPU Models (WebLLM / Transformers.js)
- **Concept:** Execute small, quantized open-weights models (e.g. Llama-3.2-1B, Gemma-2-2B, SmolLM-135M, or ONNX models) directly inside the user's browser using **WebGPU** and **WebAssembly**.
- **Pros:**
  - 100% free to operate (runs on user's hardware).
  - Complete privacy: student resumes and drafts never leave the machine.
  - Functions completely offline once weights are cached in Cache API / IndexedDB.
- **Cons:**
  - Initial download size (several hundred MBs).
  - Requires a device with WebGPU support (modern GPU/Chrome/Edge).

### Pathway B: Bring-Your-Own-Key (BYOK) Architecture
- **Concept:** An extensible `AIProvider` abstraction where students can optionally enter their personal free-tier API keys:
  - Google AI Studio (Free Gemini API key)
  - Groq Cloud (Free high-speed inference tier)
  - OpenRouter / Local Ollama (`http://localhost:11434`)
- **Security:** Keys stored strictly in browser `sessionStorage` or local memory, never transmitted to a StudentAI server.

---

## 3. Abstract Interface Specification (For Future Release)

```typescript
export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
  analyzeResume(resumeText: string, jobText: string): Promise<{
    suggestions: string[];
    tailoredSummary: string;
  }>;
}
```

In the current MVP, all career and study tools fulfill their objectives with **deterministic client-side algorithms**, providing instantaneous, reliable results without requiring any AI provider to be configured.
