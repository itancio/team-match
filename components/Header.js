import { 
    AppBar,
    Box,
    Button,
    CardActionArea,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Link,
    Paper,
    TextField,
    Toolbar,
    Typography,
    createTheme,
    useMediaQuery,
  } from "@mui/material"
  
  import LoginIcon from '@mui/icons-material/Login';
  import LogoutIcon from '@mui/icons-material/Logout';
  
  import React from "react"
  import Image from "next/image";

// Color Palettes
const cyan = '#aceef3'
const coral = '#ff7077'
const rose = '#ffe9e4'
const orange = '#ffb067'
const darkBlue = '#1280b3'
const lightGray = '#f7f7f8'
const gray = '#ebeced'
const green = '#33877c'

  
  export const Header = () => {
    // const user = useUser;
  
      return (
        <AppBar >
          <Toolbar
            sx={{
              background: coral,
              display: 'flex',
              justifyContent:'space-between',
              alignItems: 'center',
              padding: '0 16px',}}
          >
            <Box 
              style={{flexGrow: 2}}
            >
              <Button href='/' variant="text">
                {/* This is for the logo image */}
                {/* <Image 
                  alt='logo' 
                  src='/images/logo.png' 
                  width={32} 
                  height={32}
                /> */}

                <Typography variant='h6' color='white' paddingLeft={2} sx={{fontWeight: '600'}}>TEAM MATCH</Typography>
              </Button>
            </Box>
        
          </Toolbar>
        </AppBar>
      )
  }
  
  
  export default Header;
  
  