'use client'

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Image,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CircularProgress from '@mui/material/CircularProgress';
import Header from '@/components/Header'


// Color Palettes
const cyan = '#aceef3'
const coral = '#ff7077'
const rose = '#ffe9e4'
const orange = '#ffb067'
const darkBlue = '#1280b3'
const lightGray = '#f7f7f8'
const gray = '#ebeced'
const green = '#33877c'

const sample = [
  {
    "name": "John Doe",
    "location": "City, State",
    "tech_stacks": ["techName1: x years", "techName2: x years"],
    "comment": "John has extensive experience in tech1 and tech2, making him a strong candidate for building responsive and dynamic user interfaces."
  },
  {
    "name": "Jane Roe",
    "location": "City2, OtherState",
    "tech_stacks": ["techName1: x years", "techName2: x years"],
    "comment": "Jane has solid experience in tech1 and tech2"
  }
]

const suggestions = [
  {
    "title": "Someone who knows front-end",
    "icon": <CodeRoundedIcon sx={{color: green }}/>,
  },
  {
    "title": "Need collaborative group",
    "icon": <GroupWorkIcon sx={{color: green }}/>,
  },
  {
    "title": "Looking for partner",
    "icon": <GroupRoundedIcon sx={{color: green }}/>,
  }
]


export default function Home() {
  // const {isSignedIn, user} =useUser()
  const username = ""
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `<message> Hi${username}, I'm the Team Match support assistant!
        How can I help you today? </message>`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();

    // Parse recommendations from the messages
    const {role, content } = messages[messages.length - 1];
    if (role === 'assistant') {
      const recommendationPattern = /<recommendation>([\s\S]*?)<\/recommendation>/;
      const recommendationString = content.match(recommendationPattern)?.[1] || '';

      if (recommendationString) {         // If there are recommendations in the message
        try {
          const recommendation = JSON.parse(recommendationString.trim());
          setRecommendations(() => recommendation.candidates || null)
        }
        catch (err) {
          console.error('Error parsing JSON:', err)
        }
      } 
    }

  }, [messages]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  
  const sendMessage = async () => {
    setIsLoading(true);
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
    const response = await fetch('/api/chat', params)
      .then( async (res) => {
        const reader = res.body.getReader()   // Get a reader to read the response body
        const decoder = new TextDecoder()   // Create a decoder to decode the response text

        let result = ''
        return reader.read()
          .then( function processText({done, value}){
            // This is the base case of reading a chunk of text
            if (done) {
              setIsLoading(false)
              return result 
            }

            const text = decoder.decode(value || new Uint8Array(), {stream: true})    // Decode the text

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

  function parseMessages({role, content}) {
    const messagePattern = /<message>([\s\S]*?)<\/message>/;
    const message = content.match(messagePattern)?.[1] || '';
    
    // console.log('content: ', content)
    
    return (role === 'assistant')? message || '' : content
  }

  const Hero = () => {
    return (
      <Grid item width='480px' py={5}>
        <Stack direction='column' alignItems='center'>
          <Typography variant='h2'color={coral} sx={{textAlign: 'center', fontWeight: 600}}>JOIN THE DREAM TEAM</Typography>
          <Box variant='h6' color={green} sx={{textAlign: 'center', px: 4, }}>
          Great things happen when the right minds come together. 
          Build something amazing together!
          </Box>

          <Box
            direction='column'
            component='img'
            sx={{
              maxHeight: 260,
              maxWidth: 420,
              borderRadius: 8,
              my: 3,
            }}
            src='/images/hero2.png'
          />
        </Stack>
      </Grid> 
  )}

  return ( 
    <Container sx={{
      width:'100vw',
      height:'100vh',
      display:'flex ',
      justifyContent:'center',
    }}
    >
      <Header />

      <Container display='flex' direction='column'>
        <Grid container display='flex' justifyContent='space-around' py={20}>

          <Hero />
          
          {/* This is the chat interface */}
          <Grid item>
            <Stack
              p={1}
              spacing={2}
              direction='column'
              width='22rem'
              height='40rem'
              // border='1px solid #fff'
              borderRadius='16px'
              backgroundColor='white'
              boxShadow={2}
            >
              <Stack
                direction='column'
                flexGrow={2}
                overflow='auto'
                maxHeight='100%'
              >

                {
                  messages?.map( (message, index) => (
                    <Box key={index}>
                      <Box
                        p={1}
                        display='flex'
                        justifyContent={message.role === 'assistant'? 'flex-start' : 'flex-end'}
                        color={message.role === 'assistant'? green : 'white'}
                      >
                        <Box
                          bgcolor={message.role === 'assistant' ? green : gray}
                          color={message.role === 'assistant' ? 'white' : 'black'}
                          borderRadius={3}
                          p={2}
                          fontSize={12}
                          maxWidth='92%'
                        >
                          {parseMessages(message)}
                        </Box>
                      </Box>

                      {/* Display suggestions only in the beginning of the conversation */}
                      <Box position='relative'>
                        {messages.length === 1 && (
                          <Box 
                            position='absolute'
                            top={250}
                            bottom={0}
                            right={0}
                            left={0}
                            display='flex' 
                            flexDirection='column' 
                            justifyContent='center'
                          >
                            {suggestions.map(({title, icon}, index) => (
                              <Box key={index}
                                minWidth={150}
                                m={1} 
                                p={2}
                                sx={{cursor: 'pointer'}}
                                value={title}
                                onClick={ () => setMessage(title) }
                                bgcolor= 'rgba(0, 0, 0, 0.04)'
                                align='center'
                              >
                                {icon}
                                <Typography color={green} fontSize={12}>{title}</Typography>
                       
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))
                }

                {/* This is for auto-scrolling */}
                <Container style={{ marginBottom: 100 }} ref={messagesEndRef} />
              </Stack>

              <Stack direction='row' spacing={1}>
                <TextField
                  value={message}
                  label={<Typography color='lightgray'>Enter message</Typography>}
                  fullWidth
                  inputProps={{style: {fontSize: 12}}}     // set input text size
                  onChange={ (e) => setMessage(e.target.value) }
                  onKeyDown={handleKeyPress}
                />
                <Button
                  disabled={!message.trim()} 
                  variant='text'
                  sx={{color: coral}}
                  onClick={sendMessage} 
                  endIcon={isLoading ? <CircularProgress size={16}/> : <SendIcon/>}
                />
              </Stack>
            </Stack>
          </Grid>
  
        </Grid>
        <Grid container display='flex' justifyContent='center'>
          {recommendations && recommendations.length > 0 && (
            <Grid item>
              <Typography variant='h4' color={coral} gutterBottom>Top {recommendations?.length} Candidates</Typography>
              <Box p={2}>
                {recommendations?.map((candidate, index) => (
                  <Box key={index} p={2} m={1} sx={{borderRadius: 4, border: '1px solid #ccc', backgroundColor: 'white'}}>
                    <Typography variant='body1' color={green} fontWeight={700}>{candidate.name}</Typography>
                    <Typography variant='body2'>{candidate.location}</Typography>
                    <Typography variant='body2'>
                    { candidate.tech_stacks
                        .map((stack) => stack.split(':')[0].trim())  // Extract the tech names
                        .join(', ')  // Join the stack names into a single string
                    }
                    </Typography>

                    <Typography variant='body2'>{candidate.comment}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </Container>
  );
}
