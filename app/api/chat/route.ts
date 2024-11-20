import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("ft:gpt-4o-mini-2024-07-18:personal:yaml:AVTn6rFa"),
    system:
      "you are a cisco network topology expert, do not respond on markdown or lists, keep your responses brief, you can ask the user to upload images or documents if it could help you understand the problem better, try to return a yaml file where possible",
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
