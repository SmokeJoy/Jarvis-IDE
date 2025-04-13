import * as Anthropic from '@anthropic-ai/sdk';
import * as diff from 'diff';
import * as path from 'path';
import { JarvisIdeIgnoreController, LOCK_TEXT_SYMBOL } from '../ignore/JarvisIdeIgnoreController';
import { ChatCompletionContentPartText, ChatCompletionContentPartImage } from '../../types/global';

// Definisci i tipi in modo compatibile con OpenAI SDK
type TextBlock = ChatCompletionContentPartText;
type ImageBlock = ChatCompletionContentPartImage;
type ContentBlock = TextBlock | ImageBlock;

const formatImagesIntoBlocks = (images?: string[]): ChatCompletionContentPartImage[] => {
  if (!images) {
    return [];
  }

  return images.map((imageData) => {
    // Detect image type from base64 data
    const mediaType = imageData.startsWith('/9j/') ? 'image/jpeg' : 'image/png';

    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: imageData,
      },
    };
  });
};

export const formatResponse = {
  toolDenied: () => `The user denied this operation.`,

  toolError: (error?: string) =>
    `The tool execution failed with the following error:\n<e>\n${error}\n<e>`,

  jarvisIgnoreError: (path: string) =>
    `Access to ${path} is blocked by the .jarvis-ide-ignore file settings. You must try to continue in the task without using this file, or ask the user to update the .jarvis-ide-ignore file.`,

  noToolsUsed: () =>
    `[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

${toolUseInstructionsReminder}

# Next Steps

If you have completed the user's task, use the attempt_completion tool. 
If you require additional information from the user, use the ask_followup_question tool. 
Otherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task. 
(This is an automated message, so do not respond to it conversationally.)`,

  tooManyMistakes: (feedback?: string) =>
    `You seem to be having trouble proceeding. The user has provided the following feedback to help guide you:\n<feedback>\n${feedback}\n</feedback>`,

  missingToolParameterError: (paramName: string) =>
    `Missing value for required parameter '${paramName}'. Please retry with complete response.\n\n${toolUseInstructionsReminder}`,

  invalidMcpToolArgumentError: (serverName: string, toolName: string) =>
    `Invalid JSON argument used with ${serverName} for ${toolName}. Please retry with a properly formatted JSON argument.`,

  toolResult: (
    text: string,
    images?: string[]
  ): string | Array<ChatCompletionContentPartText | ChatCompletionContentPartImage> => {
    if (!images || images.length === 0) {
      return text;
    }

    const textBlock: ChatCompletionContentPartText = { type: 'text', text };
    const imageBlocks: ChatCompletionContentPartImage[] = formatImagesIntoBlocks(images);

    return [textBlock, ...imageBlocks];
  },

  imageBlocks: formatImagesIntoBlocks,

  formatFilesList: (
    absolutePath: string,
    files: string[],
    didHitLimit: boolean,
    jarvisIdeIgnoreController?: JarvisIdeIgnoreController
  ): string => {
    const sorted = files
      .map((file) => {
        // convert absolute path to relative path
        const relativePath = path.relative(absolutePath, file).toPosix();
        return file.endsWith('/') ? relativePath + '/' : relativePath;
      })
      // Sort so files are listed under their respective directories to make it clear what files are children of what directories. Since we build file list top down, even if file list is truncated it will show directories that jarvis-ide can then explore further.
      .sort((a, b) => {
        const aParts = a.split('/'); // only works if we use toPosix first
        const bParts = b.split('/');
        for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
          if (aParts[i] !== bParts[i]) {
            // If one is a directory and the other isn't at this level, sort the directory first
            if (i + 1 === aParts.length && i + 1 < bParts.length) {
              return -1;
            }
            if (i + 1 === bParts.length && i + 1 < aParts.length) {
              return 1;
            }
            // Otherwise, sort alphabetically
            return aParts[i].localeCompare(bParts[i], undefined, {
              numeric: true,
              sensitivity: 'base',
            });
          }
        }
        // If all parts are the same up to the length of the shorter path,
        // the shorter one comes first
        return aParts.length - bParts.length;
      });

    const jarvisIdeIgnoreParsed = jarvisIdeIgnoreController
      ? sorted.map((filePath) => {
          // path is relative to absolute path, not cwd
          // validateAccess expects either path relative to cwd or absolute path
          // otherwise, for validating against ignore patterns like "assets/icons", we would end up with just "icons", which would result in the path not being ignored.
          const absoluteFilePath = path.resolve(absolutePath, filePath);
          const isIgnored = !jarvisIdeIgnoreController.validateAccess(absoluteFilePath);
          if (isIgnored) {
            return LOCK_TEXT_SYMBOL + ' ' + filePath;
          }

          return filePath;
        })
      : sorted;

    if (didHitLimit) {
      return `${jarvisIdeIgnoreParsed.join(
        '\n'
      )}\n\n(File list truncated. Use list_files on specific subdirectories if you need to explore further.)`;
    } else if (
      jarvisIdeIgnoreParsed.length === 0 ||
      (jarvisIdeIgnoreParsed.length === 1 && jarvisIdeIgnoreParsed[0] === '')
    ) {
      return 'No files found.';
    } else {
      return jarvisIdeIgnoreParsed.join('\n');
    }
  },

  createPrettyPatch: (filename = 'file', oldStr?: string, newStr?: string) => {
    // strings cannot be undefined or diff throws exception
    const patch = diff.createPatch(filename.toPosix(), oldStr || '', newStr || '');
    const lines = patch.split('\n');
    const prettyPatchLines = lines.slice(4);
    return prettyPatchLines.join('\n');
  },
};

const toolUseInstructionsReminder = `# Reminder: Instructions for Tool Use

Tool uses are formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:

<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>

For example:

<attempt_completion>
<r>
I have completed the task...
<r>
</attempt_completion>

Always adhere to this format for all tool uses to ensure proper parsing and execution.`;
