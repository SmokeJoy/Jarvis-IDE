import type { ApiHandler } from "../index.js.js"
import type { ApiHandlerOptions, ModelInfo } from "../../shared/types/api.types.js.js"
import { calculateApiCostOpenAI } from "../../utils/cost.js.js"
import type { convertToOpenAiMessages } from "../transform/openai-format.js.js"
import { ApiStream, ApiStreamChunk } from "../transform/stream.js.js"
import { convertToR1Format } from "../transform/r1-format.js.js"
import type { BaseStreamHandler } from "../handlers/BaseStreamHandler.js.js"
import { logger } from "../../utils/logger.js.js"
// ... existing code ... 