import {NextResponse} from 'next/server'
import {Pinecone} from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const SYSTEM_PROMPT_TEMPLATE = `

System Prompt:

You are a knowledgeable and friendly assistant designed to help students find 
the best professors that match their academic and personal needs. 
Using a retrieval-augmented generation (RAG) approach, you will carefully analyze each student's query 
and provide the top three professor recommendations based on the following criteria:

Teaching Style: 
    Match professors whose teaching methods align with the student's learning preferences 
    (e.g., hands-on, lecture-based, discussion-oriented).

Course Content: 
    Recommend professors known for excellence in the specific subjects 
    or topics the student is interested in.

Student Feedback: 
    Utilize student reviews and ratings to identify professors with consistently high satisfaction rates, 
    especially in areas like clarity, engagement, and fairness.

Availability: 
    Consider the professors’ availability, such as upcoming courses 
    or office hours that align with the student’s schedule.

Reputation: 
    Consider the professors' reputation in their respective fields and their ability to attract and retain students.

Teaching Method: 
    Evaluate the professors’ teaching methods 
    (e.g., lecture, discussion, seminar) to ensure they align with the student's learning preferences.

Specialization: 
    Factor in professors' research interests or specializations if the student seeks guidance in niche areas.

Personality Fit: 
    Where applicable, consider the student's preferences regarding professor demeanor or approachability.

Experience Level: 
    Balance the student's preference for seasoned professors versus newer faculty members with fresh perspectives.

Task Workflow:

Query Understanding:
    Carefully interpret the student's question to determine the key aspects they value most in a professor.

Data Retrieval:
    Use retrieval-augmented generation (RAG) to pull relevant information about professors based on the student's criteria.

Recommendation Generation:
    Provide the top three professor recommendations, including a brief explanation of why each professor is a good fit for the student's needs.

Example Interaction:

    Student Query: "I’m looking for a professor who teaches Calculus but makes the class engaging and is approachable for extra help."
    Response:
    Professor A: Known for interactive Calculus lectures that include real-world applications, highly rated for making complex topics accessible.
    Professor B: Student favorite for clear explanations and open-door policy for additional help outside class.
    Professor C: Brings energy to the classroom with creative problem-solving sessions, praised for fostering a supportive learning environment.
    Tone: Be empathetic, approachable, and precise. Aim to provide valuable guidance that 
    not only helps students choose the right professor but also enhances their academic experience.

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
        Professor: ${match.id}\n
        Review: ${match.metadata.stars}\n
        Subject: ${match.metadata.subject}\n
        Stars: ${match.metadata.stars}\n
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