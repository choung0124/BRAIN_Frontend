/*
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-kit-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import React, { useState, useEffect } from "react"; // Import useState

// @mui material components
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// Material Kit 2 React components
import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

import SearchBar from "./SearchBar";

// Routes
import routes from "routes";

// Images
import bgImage from "assets/images/Brain_img.png";

import EntityExtractor from "./EntityExtractor";

import { firebaseAuth } from "firebaseConfig";
import { signOut } from "firebase/auth";

function Presentation() {
  const [searchValue, setSearchValue] = useState(""); // This state is lifted up to Presentation
  const [isSearchActive, setSearchActive] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const user = firebaseAuth.currentUser;

  // isSearchActive starts as false
  function handleSearchActive() {
    setSearchActive(true);
  }

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut(firebaseAuth);
    handleClose();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <MKBox
        variant="gradient"
        bgColor="dark"
        shadow="sm"
        py={0.25}
        display="flex"
        justifyContent="flex-end"
      >
        <MKTypography
          onClick={handleMenu}
          color="white"
          sx={{
            fontSize: "12pt",
            cursor: "pointer",
            marginRight: "10px", // 우측 여백 조정
          }}
        >
          {user.email}
        </MKTypography>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom", // 메뉴가 글자 아래에 위치하도록 변경
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </MKBox>

      {isSearchActive ? (
        <SearchBar
          brand="ARIS"
          routes={routes}
          sticky
          // 2. Pass the function to update the state to DefaultNavbar.
          setSearchValue={setSearchValue}
          handleSearchActive={handleSearchActive}
          searchValue={searchValue}
        />
      ) : (
        // do nothing
        <></>
      )}
      <MKBox
        minHeight="75vh"
        width="100%"
        sx={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Container>
          <Grid container item xs={12} lg={7} justifyContent="center" mx="auto">
            <MKTypography
              variant="h1"
              color="cyan"
              mt={-6}
              mb={1}
              sx={({ breakpoints, typography: { size } }) => ({
                [breakpoints.down("md")]: {
                  fontSize: size["3xl"],
                },
              })}
            >
              BRAIN{" "}
            </MKTypography>
            <MKTypography
              variant="body1"
              color="white"
              textAlign="center"
              px={{ xs: 6, lg: 12 }}
              mt={1}
            >
              The Bridge between AI, In silico, In Vitro, In Vivo
            </MKTypography>
            {isSearchActive ? (
              // do nothing
              <></>
            ) : (
              <SearchBar
                brand="ARIS"
                routes={routes}
                sticky
                // 2. Pass the function to update the state to DefaultNavbar.
                setSearchValue={setSearchValue}
                handleSearchActive={handleSearchActive}
                searchValue={searchValue}
              />
            )}
          </Grid>
        </Container>
      </MKBox>
      <Card
        sx={{
          p: 25,
          mx: { xs: 2, lg: 3 },
          mt: -8,
          mb: 4,
          backgroundColor: ({ palette: { white }, functions: { rgba } }) => rgba(white.main, 0.8),
          backdropFilter: "saturate(200%) blur(30px)",
          boxShadow: ({ boxShadows: { xxl } }) => xxl,
        }}
      >
        <EntityExtractor key={searchValue} initialQuestion={searchValue} />
      </Card>
    </>
  );
}

export default Presentation;
