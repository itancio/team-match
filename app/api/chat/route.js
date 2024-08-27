import {NextResponse} from 'next/server'
import {Pinecone} from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const SYSTEM_PROMPT_TEMPLATE = `
You are an expert in finding the right teamm mate that matches your need for your project.

You operate in two phases.
In Phase 1, you learn about a project's need and create a customized plan (tech stacks or skills) the user needs.
In Phase 2, you help a user find a suitable teammate for their project.

Here are your steps:
In Phase 1, Learn about the project and customize a recommendation what type of tech stacks or skills and their corresponding level of experiences, 
 and location the project+ requires.
In Phase 2, make a recommendation of a suitable team mate for the project. Minimize the questions to up 4. Recommend at least 3 candidates.
 
 Before responding to the user, think step by step what you need to ask or do to create the recommendation. output your thinking 
 within <thinking></thinking> tags and include what phase you are in. Then generate your user-facing message output within <message></message> tags. 
 This could contain the question or comment you want to present to the user. Do not pass any other tags within <message></message> tags. 
 Your messages should be simple and to the point. Avoid overly narrating. Only ask 1 question at a time. When you have a recommendation for candidates, 
 output it within <recommendation></recommendation> tags. And inside it contains a json file with this attributes: name, location, list of tech stacks, comment. 
 in the comment section, this contains your reasoning why this candidate is the suitable one for the project.

`

export async function POST(req) {
  try {
      // Step 1: READ DATA - Extract the user's query from the request body.
      console.log('Received query:', req)
      const data = await req.json()

      const pc = new Pinecone({
          apiKey: process.env.PINECODE_API_KEY,
      })
      const index = pc.index("rmp-ai").namespace('ns1')
      const openai = new OpenAI()

      // Step 2: Process the user's query using the vector database.

      const text = data[data.length - 1].content
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      })

      // Step 3: Query Pinecone. use the embedding to find similar professor reviews in Pinecone

      const results = await index.query({
          topK: 5,
          includeMetadata: true,
          vector: embedding.data[0].embedding,
        })

      // Step 4: Format the results. Process the Pinecone results into a readable string.
      let resultString = ''
      results.matches.forEach((match) => {
        resultString += `
        Returned Results:\n
        User: ${match.id}\n
        Location: ${match.metadata.location}\n
        Tech-stacks: ${match.metadata.tech_stack}\n
        Interest: ${match.metadata.interest}\n
        Goal: ${match.metadata.goal}\n
        \n\n`
      })
      
      // Step 5: Prepare the OpenAI request
      const lastMessage = data[data.length - 1]
      const lastMessageContent = lastMessage.content + resultString
      const lastDataWithoutLastMessage = data.slice(0, data.length - 1)

      // Step 6: Send request to OpenAI
      const completion = await openai.chat.completions.create({
          messages: [
            {role: 'system', content: SYSTEM_PROMPT_TEMPLATE},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent},
          ],
          model: 'gpt-4o-mini',
          stream: true,
          temperature: 0.3,
          max_tokens: 700,
        })

      // Step 7: Set up streaming response
      const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()   // Create a TextEncoder to convert strings to Uint8Array
            try {
              // Iterate over the streamed chunks of the response
              for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content
                if (content) {
                  const text = encoder.encode(content)    // Encode the content to Uint8Array
                  controller.enqueue(text)
                }
              }
            } catch (err) {
              controller.error(err)   // Handle any errors that occur during streaming
            } finally {
              controller.close()    // Close the stream when done
            }
          },
        })
        return new NextResponse(stream)
  }
  catch (error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json('Error processing request ', { error: error.message }, { status: 500 });
  }
}