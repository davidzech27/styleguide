import Anthropic from "@anthropic-ai/sdk"

async function chat({ message, apiKey }: { message: string; apiKey: string }) {
    const anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
    })

    return await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        messages: [
            {
                role: "user",
                content: message,
            },
        ],
        temperature: 0,
        max_tokens: 8192,
    })
}

export async function generateSuggestions({
    content,
    rules,
    apiKey,
}: {
    content: string
    rules: string[]
    apiKey: string
}) {
    if (content.trim() === "") return []

    const sentenceToOffset = new Map<number, number>()

    let currentMark = -1
    const markedContent = content.replaceAll(
        /(?<=^|\.(?:”|")? )./gm,
        (sentenceFirstCharacter, offset: number) => {
            currentMark++
            sentenceToOffset.set(currentMark, offset)
            return `【${currentMark}】 ${sentenceFirstCharacter}`
        },
    )

    return (
        await Promise.all(
            rules.map(async (rule) => {
                const responseObject = await chat({
                    message: `You are checking some writing against the following style guide:

<style-guide>
${rules.map((rule) => "<rule>\n" + rule + "\n</rule>").join("\n\n")}
</style-guide>

Here is the writing, marked with sentence indices:

<writing>
${markedContent}
</writing>

Currently, you are only checking the writing against the following rule from the style guide:

<rule>
${rule}
</rule>

First, decide if there are any suggestions for the writing relevant to the rule. If not, respond only with "N/A". Otherwise, output each individual fine-grained suggestion in the following format:

Sentence range: {start}-{end}
Title: {title}
Content: {content}

Phrase your suggestion content pointedly and tersely.

Begin.`,
                    apiKey,
                })

                const response =
                    responseObject.content[0] &&
                    responseObject.content[0].type === "text"
                        ? responseObject.content[0].text
                        : ""

                console.debug(response)

                return response.trim() === "N/A"
                    ? []
                    : response
                          .split(/\n(?=Sentence range:)/)
                          .map((suggestionString) => {
                              const [sentenceStart, sentenceEnd] = (
                                  suggestionString.match(
                                      /(?<=Sentence range: ).+/,
                                  )?.[0] ?? ""
                              )
                                  .split("-")
                                  .map(Number)
                              const suggestion = {
                                  start:
                                      sentenceToOffset.get(
                                          sentenceStart ?? 0,
                                      ) ?? 0,
                                  end:
                                      sentenceToOffset.get(
                                          (sentenceEnd ?? 0) + 1,
                                      ) ?? content.length,
                                  title:
                                      suggestionString.match(
                                          /(?<=Title: ).+/,
                                      )?.[0] ?? "",
                                  content:
                                      suggestionString
                                          .match(/(?<=Content: )[\s\S]+/)?.[0]
                                          ?.trim() ?? "",
                              }

                              return suggestion
                          })
            }),
        )
    ).flat()
}
