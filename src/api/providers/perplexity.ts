import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../transform/stream';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { logger } from '../../utils/logger';
// ... existing code ...
