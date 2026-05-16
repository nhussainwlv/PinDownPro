import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateCaptionAndTags(input: {
  title: string;
  description: string;
  mediaType: string;
}): Promise<{ caption: string; tags: string[] }> {
  if (!openai) {
    return {
      caption: input.description || input.title,
      tags: ["pinterest", input.mediaType, "pindownpro"],
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You generate short social captions and 5-8 lowercase tags for Pinterest downloads. Respond as JSON: { caption: string, tags: string[] }",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { caption?: string; tags?: string[] };
    return {
      caption: parsed.caption ?? input.title,
      tags: parsed.tags ?? ["pinterest"],
    };
  } catch {
    return { caption: input.title, tags: ["pinterest"] };
  }
}
