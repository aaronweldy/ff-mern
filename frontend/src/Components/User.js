import React, { useEffect, useState, useReducer } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardDeck,
  Container,
  Row,
  Col,
  Button,
  Image,
} from "react-bootstrap";
import PasswordModal from "./PasswordModal";
import ImageModal from "./ImageModal";
import firebase, { auth, storage } from "../firebase-config";

import "../CSS/LeaguePages.css";

const passwordReducer = (state, action) => {
  switch (action.type) {
    case "changePassword":
      return { ...state, changePassword: !state.changePassword };
    case "setOldPassword":
      return { ...state, oldPassword: action.password };
    case "setFirstNewPassword":
      return {
        ...state,
        unmatched: action.unmatched,
        firstNewPassword: action.password,
      };
    case "setSecondNewPassword":
      return {
        ...state,
        unmatched: action.unmatched,
        secondNewPassword: action.password,
      };
    case "setFlags":
      return {
        ...state,
        unmatched: action.unmatched && true,
        incorrect: action.incorrect || false,
        success: action.success || false,
        changePassword: action.changePassword,
      };
    case "reset":
      return action.initState;
    default:
      return { ...state };
  }
};

const User = () => {
  const { userid } = useParams();
  const initialState = {
    oldPassword: "",
    firstNewPassword: "",
    secondNewPassword: "",
    unmatched: true,
    incorrectPassword: false,
    success: false,
    changePassword: false,
  };
  const [state, dispatch] = useReducer(passwordReducer, initialState);
  const [teams, setTeams] = useState([]);
  const [showImageModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const currUser = auth.currentUser;
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const url = `/api/v1/user/${userid}/leagues/`;
        fetch(url)
          .then((resp) => {
            if (!resp.ok) throw Error(resp.statusText);
            return resp.json();
          })
          .then((data) => {
            setTeams(data.teams);
            if (data.url && !imageUrl) setImageUrl(data.url);
            for (const [index, team] of data.teams.entries()) {
              if (team.leagueLogo) {
                storage
                  .ref(`logos/${team.leagueLogo}`)
                  .getDownloadURL()
                  .then((url) => {
                    setTeams((teams) => {
                      const tempTeams = [...teams];
                      tempTeams[index].logoUrl = url;
                      console.log(tempTeams);
                      return tempTeams;
                    });
                  });
              }
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    });
    return () => unsub();
  }, [userid, imageUrl]);

  const handlePasswordChange = (e, str) => {
    const unmatched =
      (str === "First"
        ? e.target.value !== state.secondNewPassword
        : e.target.value !== state.firstNewPassword) || e.target.value === "";
    const action = {
      type: "set" + str + "NewPassword",
      password: e.target.value,
      unmatched,
    };
    dispatch(action);
  };

  const handlePasswordSubmission = (_) => {
    const providedCredential = firebase.auth.EmailAuthProvider.credential(
      currUser.email,
      state.oldPassword
    );
    const errAction = {
      type: "setFlags",
      success: false,
      incorrectPassword: true,
      changePassword: true,
    };
    currUser
      .reauthenticateWithCredential(providedCredential)
      .then(() => {
        currUser
          .updatePassword(state.firstNewPassword)
          .then((_) => {
            const action = {
              type: "setFlags",
              success: true,
              incorrect: false,
              changePassword: true,
            };
            dispatch(action);
            setTimeout(() => {
              const action = {
                type: "reset",
                initState: initialState,
              };
              dispatch(action);
            }, 2500);
          })
          .catch((e) => {
            console.log(e);
            dispatch(errAction);
          });
      })
      .catch((e) => {
        console.log(e);
        dispatch(errAction);
      });
  };

  const handleImageSubmission = (url) => {
    const currUser = auth.currentUser;
    storage
      .ref()
      .child(currUser.email + "/logo")
      .putString(url, "data_url")
      .then((snapshot) => {
        snapshot.ref.getDownloadURL().then((url) => {
          currUser.updateProfile({ photoURL: url }).then(() => {
            setShowModal(false);
            const sendUrl = `/api/v1/user/${userid}/updatePhoto/`;
            const body = { url };
            const reqdict = {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
            };
            fetch(sendUrl, reqdict).then(() => {
              setImageUrl(url);
            });
          });
        });
      });
  };
  console.log(currUser);
  return (
    <Container fluid>
      {currUser ? (
        <>
          <Row className="justify-content-center mb-3 mt-3">
            <Col sm="auto">
              <Image
                src={
                  imageUrl ||
                  process.env.REACT_APP_PUBLIC_URL + "/football.jfif"
                }
                className="image-fit-height mr-3"
                roundedCir
              ></Image>
            </Col>
            <Col sm="auto">
              <Row>
                <h1 className="mt-3">{currUser.displayName}</h1>
              </Row>
              <Row>
                <div className="subtitle">{currUser.email}</div>
              </Row>
            </Col>
          </Row>
        </>
      ) : (
        ""
      )}
      {currUser && userid === currUser.uid ? (
        <>
          <Row className="justify-content-center mb-3">
            <Button onClick={() => dispatch({ type: "changePassword" })}>
              Change Password
            </Button>
          </Row>
          <Row className="justify-content-center mb-3">
            <Button onClick={() => setShowModal(true)}>
              Change/Set User Image
            </Button>
          </Row>
        </>
      ) : (
        ""
      )}
      {currUser ? (
        <>
          <PasswordModal
            changePassword={state.changePassword}
            unmatched={state.unmatched}
            incorrectPassword={state.incorrect}
            success={state.success}
            handlePasswordChange={handlePasswordChange}
            setOldPassword={(val) =>
              dispatch({ type: "setOldPassword", password: val })
            }
            handlePasswordSubmission={handlePasswordSubmission}
            handleHide={() => dispatch({ type: "changePassword" })}
          ></PasswordModal>

          <ImageModal
            showImage={showImageModal}
            handleHide={() => setShowModal(!showImageModal)}
            handleImageSubmission={handleImageSubmission}
          ></ImageModal>
        </>
      ) : (
        ""
      )}
      <Row className="justify-content-center">
        <CardDeck id="teamCards">
          {teams.map((team, index) => {
            return (
              <Card key={index} className="m-2">
                <Card.Body className="d-flex flex-column align-content-end">
                  <a href={"/league/" + team.league + "/team/" + team.id + "/"}>
                    <Card.Img
                      variant="bottom"
                      className="mt-auto"
                      src={team.logoUrl ? team.logoUrl : team.logo}
                    ></Card.Img>
                  </a>
                  <div className="mt-auto">
                    <Card.Title>{team.name}</Card.Title>
                    <Card.Text>{team.leagueName}</Card.Text>
                    <Button
                      className="mt-auto"
                      href={"/league/" + team.league + "/"}
                    >
                      Go to league
                    </Button>
                  </div>
                </Card.Body>
                {team.isCommissioner ? (
                  <Card.Footer>Commissioner</Card.Footer>
                ) : (
                  ""
                )}
              </Card>
            );
          })}
        </CardDeck>
      </Row>
    </Container>
  );
};

export default User;
