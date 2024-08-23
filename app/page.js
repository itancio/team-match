'use client'

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send';


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi, I'm the Rate My Professor support assistant! How can I help you today?"
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const [message, setMessage] = useState('');
  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''}
    ])

    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}])
    }

    setMessage('')

    // Send the message to the server
    const response = fetch('/api/chat', params)
      .then( async (res) => {
        const reader = res.body.getReader()   // Get a reader to read the response body
        const decoder = new TextDecoder()   // Create a decoder to decode the response text

        let result = ''
        return reader.read()
          .then( function processText({done, value}){
            if (done) { return result }

            const text = decoder.decode(value || new Uint8Array(), {stream: true})    // Decode the text

            console.log("text: ", text)

            setMessages( (messages) => {
              let lastMessage = messages[messages.length - 1]   // Get the last message (assistant's placeholder)
              let otherMessages = messages.slice(0, messages.length - 1)    // Get all other messages
              return [
                ...otherMessages,
                {...lastMessage, content: lastMessage.content + text},
              ]
            })

            return reader.read().then(processText)    // Continue reading the next chunk of the response
        })
    })
  }

  return ( 
    <Container sx={{
      width:'100vw',
      height:'100vh',
      display:'flex ',
      flexDirection:'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'lightgray',
    }}
    >
      {/* This is the chat interface */}
      <Stack
        p={2}
        spacing={3}
        direction='column'
        width='500px'
        height='800px'
        border='1px solid #fff'
        borderRadius='25px'
        backgroundColor='white'
      >
        <Stack
          direction='column'
          spacing={2}
          flexGrow={2}
          overflow='auto'
          maxHeight='100%'
        >
          {
            messages?.map( (message, index) => (
              <Box
                p={2}
                key={index}
                display='flex'
                justifyContent={message.role === 'assistant'? 'flex-start' : 'flex-end'}
                color={message.role === 'assistant'? 'black' : 'white'}
              >
                <Box
                  bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                  color='white'
                  borderRadius={16}
                  p={3}
                >
                  {message.content}  
                </Box>
              </Box>
            ))
          }
        </Stack>
        <Stack direction='row' >
          <TextField
            value={message}
            label={<Typography color='lightgray'>Enter your message here...</Typography>}
            fullWidth
            onChange={ (e) => setMessage(e.target.value) }
            onKeyDown={handleKeyPress}
          />
          <Button 
            sx={{borderRadius: 20}} 
            disabled={!message.trim()} 
            variant='text' onClick={sendMessage} 
            endIcon={<SendIcon/>} 
          >
            send
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
