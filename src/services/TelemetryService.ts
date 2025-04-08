import { PostHog } from "posthog-node";
import { TelemetrySetting } from "../types/global.js";

export class TelemetryService {
  private client: PostHog | null = null;
  private telemetrySetting: TelemetrySetting = "ask";

  constructor(apiKey: string, telemetrySetting: TelemetrySetting) {
    this.telemetrySetting = telemetrySetting;
    if (telemetrySetting === "enabled") {
      this.client = new PostHog(apiKey, {
        host: "https://app.posthog.com",
      });
    }
  }

  /**
   * Inizializza il servizio di telemetria
   * @param context Contesto dell'estensione VS Code
   */
  async initialize(context: any): Promise<void> {
    // In futuro potrebbe essere necessario inizializzare ulteriormente il servizio di telemetria
    console.log("Telemetria inizializzata");
  }

  async capture(event: string, properties: Record<string, any> = {}, distinctId: string = "anonymous"): Promise<void> {
    if (this.telemetrySetting === "enabled" && this.client) {
      try {
        await this.client.capture({
          distinctId,
          event,
          properties,
        });
      } catch (error) {
        console.error("Error capturing telemetry event:", error);
      }
    }
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      try {
        await this.client.shutdownAsync();
      } catch (error) {
        console.error("Error shutting down telemetry client:", error);
      }
    }
  }
} 