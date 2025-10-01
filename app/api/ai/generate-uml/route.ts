import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { prompt, type } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const systemPrompt = `You are a UML class diagram generator. Based on the user's description, generate a JSON structure representing UML classes and their relationships.

Return ONLY a valid JSON object with this exact structure:
{
  "classes": [
    {
      "id": "unique-id",
      "name": "ClassName",
      "stereotype": "class" | "interface" | "abstract",
      "attributes": [
        {
          "name": "attributeName",
          "type": "String",
          "visibility": "private" | "public" | "protected",
          "isStatic": false,
          "isAbstract": false
        }
      ],
      "methods": [
        {
          "name": "methodName",
          "returnType": "void",
          "parameters": [
            {
              "name": "paramName",
              "type": "String"
            }
          ],
          "visibility": "public" | "private" | "protected",
          "isStatic": false,
          "isAbstract": false
        }
      ]
    }
  ],
  "relationships": [
    {
      "id": "rel-id",
      "sourceClassId": "source-class-id",
      "targetClassId": "target-class-id",
      "relationshipType": "inheritance" | "composition" | "aggregation" | "association",
      "sourceMultiplicity": "1..1" | "*" | "0..1" | "1..*",
      "targetMultiplicity": "1..1" | "*" | "0..1" | "1..*",
      "label": "relationship label"
    }
  ]
}

Guidelines:
- Use proper UML naming conventions
- Include appropriate attributes and methods for each class
- Set correct visibility modifiers (private, public, protected)
- Use proper Java/OOP data types (String, Integer, Boolean, etc.)
- Create meaningful relationships between classes
- For inheritance, use "inheritance" relationship type
- For composition (strong ownership), use "composition"
- For aggregation (weak ownership), use "aggregation"
- For simple associations, use "association"
- Set appropriate multiplicities (1, *, 0..1, 1..*)
`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: `Generate UML classes for: ${prompt}`,
      temperature: 0.3,
    })

    // Parse the generated JSON
    let umlData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        umlData = JSON.parse(jsonMatch[0])
      } else {
        umlData = JSON.parse(text)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    return NextResponse.json(umlData)
  } catch (error) {
    console.error("Error generating UML:", error)
    return NextResponse.json({ error: "Failed to generate UML diagram" }, { status: 500 })
  }
}