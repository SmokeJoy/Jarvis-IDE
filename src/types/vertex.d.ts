declare module "@anthropic-ai/vertex-sdk" {
    export class AnthropicVertex {
        constructor(config: {
            projectId: string
            region: string
        })

        beta: {
            messages: {
                create: (...args: any[]) => any
            }
        }
    }
}

declare module "@google-cloud/vertexai" {
    export class VertexAI {
        constructor(config: {
            project: string
            location: string
        })
        getGenerativeModel(...args: any[]): any
    }
} 