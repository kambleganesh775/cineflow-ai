import { GoogleAuth } from 'google-auth-library';
import {
  OmniStoryboardResult,
  OmniGeneratedScene,
  OmniEnhancePromptResult,
  CAMERA_MOVEMENTS,
  LIGHTING_STYLES,
  VISUAL_STYLES,
} from '@cineflow/shared';
import { config } from '../config';

export class OmniDirectorService {
  private auth: GoogleAuth;

  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: config.googleCloudProject,
    });
  }

  /**
   * Generates a coherent multi-scene cinematic storyboard from a high-level concept
   */
  async generateStoryboard(
    concept: string,
    genre = 'Cinematic Sci-Fi',
    sceneCount = 4
  ): Promise<OmniStoryboardResult> {
    const cleanCount = Math.min(6, Math.max(2, sceneCount));

    // Try Google Cloud Vertex AI Gemini if credentials are active
    try {
      const client = await this.auth.getClient();
      const token = await client.getAccessToken();

      if (token.token && !config.mockVertexAi && config.googleCloudProject !== 'cineflow-default-project') {
        const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config.googleCloudProject}/locations/${config.googleCloudLocation}/publishers/google/models/gemini-1.5-flash:generateContent`;

        const systemPrompt = `You are an elite Hollywood Director and AI Video Cinematographer for Google Veo.
Create a ${cleanCount}-scene visual storyboard based on the user's concept in the ${genre} genre.
Return STRICT JSON ONLY conforming to:
{
  "title": "Title of the Film",
  "synopsis": "A concise 1-sentence logline",
  "scenes": [
    {
      "title": "Scene Name",
      "prompt": "Detailed cinematic visual prompt describing character, action, textures, lighting and camera for Veo",
      "negativePrompt": "blurry, low quality, distorted",
      "cameraMovement": "One of: ${CAMERA_MOVEMENTS.join(', ')}",
      "lighting": "One of: ${LIGHTING_STYLES.join(', ')}",
      "visualStyle": "One of: ${VISUAL_STYLES.join(', ')}",
      "durationSeconds": 5
    }
  ]
}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nConcept: ${concept}` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            if (parsed.scenes && Array.isArray(parsed.scenes)) {
              return parsed;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[OmniDirector] Vertex AI Gemini call skipped/failed, using cinematic generator fallback:', err);
    }

    // High-Quality Built-In Cinematic Heuristic Director (Works 100% offline & without API keys)
    return this.generateHeuristicStoryboard(concept, genre, cleanCount);
  }

  /**
   * Enhances a simple prompt into an ultra-detailed, photorealistic cinematic prompt for Veo
   */
  async enhancePrompt(
    prompt: string,
    existingCamera?: string,
    existingLighting?: string,
    existingStyle?: string
  ): Promise<OmniEnhancePromptResult> {
    const camera = existingCamera || CAMERA_MOVEMENTS[Math.floor(Math.random() * CAMERA_MOVEMENTS.length)];
    const lighting = existingLighting || LIGHTING_STYLES[Math.floor(Math.random() * LIGHTING_STYLES.length)];
    const style = existingStyle || VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)];

    // Try Vertex AI Gemini enhancement if available
    try {
      const client = await this.auth.getClient();
      const token = await client.getAccessToken();

      if (token.token && !config.mockVertexAi && config.googleCloudProject !== 'cineflow-default-project') {
        const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config.googleCloudProject}/locations/${config.googleCloudLocation}/publishers/google/models/gemini-1.5-flash:generateContent`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Rewrite this video prompt for Google Veo to maximize cinematic photorealism, physical motion, depth of field, and volumetric atmosphere. Keep it concise (under 80 words). Prompt: "${prompt}"`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.7 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (enhanced) {
            return {
              enhancedPrompt: enhanced,
              suggestedCamera: camera,
              suggestedLighting: lighting,
              suggestedStyle: style,
            };
          }
        }
      }
    } catch (_) {}

    // Fallback cinematic enhancement rule
    const enhancedPrompt = `Cinematic master shot of ${prompt.trim().replace(/\.+$/, '')}, rendered with ${style}, framed by ${camera}, illuminated by ${lighting.toLowerCase()}, sharp focus, 8k resolution textures, anamorphic lens flare, photorealistic physics.`;

    return {
      enhancedPrompt,
      suggestedCamera: camera,
      suggestedLighting: lighting,
      suggestedStyle: style,
    };
  }

  /**
   * Cinematic Storyboard Heuristic Generator
   */
  private generateHeuristicStoryboard(
    concept: string,
    genre: string,
    sceneCount: number
  ): OmniStoryboardResult {
    const title = `${concept.slice(0, 30).trim()}: The Sequence`;
    const synopsis = `A ${genre.toLowerCase()} journey capturing ${concept}.`;

    const arcTemplates = [
      {
        title: 'Prologue & Establishing',
        camera: 'Cinematic Drone Orbit',
        lighting: 'Golden Hour Sunlight',
        style: 'Cinematic Photorealistic 35mm',
        prefix: 'Wide expansive establishing shot setting the visual world of',
      },
      {
        title: 'The Encounter',
        camera: 'Low Angle Tracking',
        lighting: 'Moody Noir High Contrast',
        style: 'Anamorphic Film Grain',
        prefix: 'Close atmospheric shot focusing on the central subject in',
      },
      {
        title: 'Climactic Motion',
        camera: 'Dolly Forward',
        lighting: 'Volumetric Fog & God Rays',
        style: 'Hyperrealistic IMAX Nature',
        prefix: 'Dynamic high-intensity sequence capturing decisive action in',
      },
      {
        title: 'Resolving Epilogue',
        camera: 'Slow Zoom Out',
        lighting: 'Ethereal Moonlight',
        style: 'Sci-Fi Blade Runner Aesthetic',
        prefix: 'Lingering poignant final framing reflecting upon',
      },
      {
        title: 'Atmospheric Interlude',
        camera: 'Smooth Tilt Down',
        lighting: 'Cyberpunk Neon Ambient',
        style: 'Vintage 1970s Kodachrome',
        prefix: 'Rich textural visual study detailing the environmental mood of',
      },
      {
        title: 'Final Horizon',
        camera: 'FPV High-Speed Flythrough',
        lighting: 'Bioluminescent Glow',
        style: 'Cinematic Photorealistic 35mm',
        prefix: 'Sweeping panoramic crescendo across the horizon of',
      },
    ];

    const scenes: OmniGeneratedScene[] = [];
    for (let i = 0; i < sceneCount; i++) {
      const template = arcTemplates[i % arcTemplates.length];
      scenes.push({
        title: `Scene ${i + 1}: ${template.title}`,
        prompt: `${template.prefix} ${concept}, rich atmospheric depth, cinematic 35mm framing, fine textural details, photorealistic lighting.`,
        negativePrompt: 'blurry, oversaturated, deformed, cartoon, low quality',
        cameraMovement: template.camera,
        lighting: template.lighting,
        visualStyle: template.style,
        durationSeconds: 5,
      });
    }

    return {
      title,
      synopsis,
      scenes,
    };
  }
}

export const omniDirectorService = new OmniDirectorService();
