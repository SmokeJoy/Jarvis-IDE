import type { ApiHandler } from "../index.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js"
import { calculateApiCostOpenAI } from "../../utils/cost.js"
import type { convertToOpenAiMessages } from "../transform/openai-format.js"
import { ApiStream, ApiStreamChunk } from "../transform/stream.js"
import { convertToR1Format } from "../transform/r1-format.js"
import type { BaseStreamHandler } from "../handlers/BaseStreamHandler.js"
import { logger } from "../../utils/logger.js"
// ... existing code ... 