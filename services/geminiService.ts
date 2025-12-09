import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface LicensePlateResult {
  plate: string;
  confidence: number;
  detectedType?: string;
}

export const analyzeLicensePlate = async (base64Image: string): Promise<LicensePlateResult | null> => {
  try {
    // Strip header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Extract the license plate number from this image. Also identify if it looks like a CAR, MOTORCYCLE, or TRUCK. Return JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plate: { type: Type.STRING, description: "The alphanumeric license plate text, uppercase, no hyphens." },
            vehicleType: { type: Type.STRING, description: "CAR, MOTORCYCLE, or TRUCK" },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
          },
          required: ["plate", "vehicleType"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        plate: data.plate,
        confidence: data.confidence || 0.9,
        detectedType: data.vehicleType
      };
    }
    return null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};