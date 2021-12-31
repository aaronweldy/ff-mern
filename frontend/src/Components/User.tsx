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
import { Team } from "../ff-types/types";

type PasswordReducerState = {
  oldPassword: string;
  firstNewPassword: string;
  secondNewPassword: string;
  unmatched: boolean;
  incorrectPassword: boolean;
  success: boolean;
  changePassword: boolean;
};

type PasswordReducerAction =
  | { type: "changePassword" }
  | { type: "setOldPassword"; password: string }
  | { type: "setFirstNewPassword"; unmatched: boolean; password: string }
  | { type: "setSecondNewPassword"; unmatched: boolean; password: string }
  | {
      type: "setFlags";
      success: boolean;
      incorrectPassword: boolean;
      changePassword: boolean;
      unmatched: boolean;
    }
  | {
      type: "reset";
      initState: PasswordReducerState;
    };

const passwordReducer = (
  state: PasswordReducerState,
  action: PasswordReducerAction
) => {
  switch (action.type) {
    case "changePassword":
      return { ...state, changePassword: !state.changePassword };
    case "setOldPassword":
      return { ...state, oldPassword: action.password };
    case "setFirstNewPassword":
      return {
        ...state,
        unmatched: action.unmatched || true,
        firstNewPassword: action.password,
      };
    case "setSecondNewPassword":
      return {
        ...state,
        unmatched: action.unmatched || true,
        secondNewPassword: action.password,
      };
    case "setFlags":
      return {
        ...state,
        unmatched: action.unmatched && true,
        incorrect: action.incorrectPassword || false,
        success: action.success || false,
        changePassword: action?.changePassword,
      };
    case "reset":
      return action.initState;
    default:
      return { ...state };
  }
};

const User = () => {
  const { userId } = useParams<{ userId: string }>();
  const initialState: PasswordReducerState = {
    oldPassword: "",
    firstNewPassword: "",
    secondNewPassword: "",
    unmatched: true,
    incorrectPassword: false,
    success: false,
    changePassword: false,
  };
  const [state, dispatch] = useReducer(passwordReducer, initialState);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showImageModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const currUser = auth.currentUser;
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/user/${userId}/leagues/`;
        fetch(url)
          .then((resp) => {
            if (!resp.ok) {
              throw Error(resp.statusText);
            }
            return resp.json();
          })
          .then((data) => {
            setTeams(data.teams);
            if (data.url && !imageUrl) {
              setImageUrl(data.url);
            }
            data.teams.entries.forEach((team: Team) => {
              if (team.leagueLogo) {
                storage
                  .ref(`logos/${team.leagueLogo}`)
                  .getDownloadURL()
                  .then((newUrl) => {
                    setTeamLogos({ ...teamLogos, [team.id]: newUrl });
                  });
              }
            });
          })
          .catch((e) => {
            console.log(e);
          });
      }
    });
    return () => unsub();
  }, [userId, imageUrl, teamLogos]);

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    str: string
  ) => {
    const unmatched =
      (str === "First"
        ? e.target.value !== state.secondNewPassword
        : e.target.value !== state.firstNewPassword) || e.target.value === "";
    const action = {
      type: `set${str}NewPassword` as
        | "setFirstNewPassword"
        | "setSecondNewPassword",
      password: e.target.value,
      unmatched,
    };
    dispatch(action);
  };

  const handlePasswordSubmission = () => {
    if (currUser && currUser.email) {
      const providedCredential = firebase.auth.EmailAuthProvider.credential(
        currUser.email,
        state.oldPassword
      );
      const errAction: PasswordReducerAction = {
        type: "setFlags",
        success: false,
        incorrectPassword: true,
        changePassword: true,
        unmatched: false,
      };
      currUser
        .reauthenticateWithCredential(providedCredential)
        .then(() => {
          currUser
            .updatePassword(state.firstNewPassword)
            .then(() => {
              const action: PasswordReducerAction = {
                type: "setFlags",
                success: true,
                incorrectPassword: false,
                changePassword: true,
                unmatched: false,
              };
              dispatch(action);
              setTimeout(() => {
                const resetAction: PasswordReducerAction = {
                  type: "reset",
                  initState: initialState,
                };
                dispatch(resetAction);
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
    }
  };

  const handleImageSubmission = (url: string) => {
    const subUser = auth.currentUser;
    if (!subUser) {
      return;
    }
    storage
      .ref()
      .child(`${subUser.email}/logo`)
      .putString(url, "data_url")
      .then((snapshot) => {
        snapshot.ref.getDownloadURL().then((newUrl) => {
          subUser.updateProfile({ photoURL: newUrl }).then(() => {
            setShowModal(false);
            const sendUrl = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/user/${userId}/updatePhoto/`;
            const body = { newUrl };
            const reqdict = {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
            };
            fetch(sendUrl, reqdict).then(() => {
              setImageUrl(newUrl);
            });
          });
        });
      });
  };
  return (
    <Container fluid>
      {currUser ? (
        <>
          <Row className="justify-content-center mb-3 mt-3">
            <Col sm="auto">
              <Image
                src={
                  imageUrl ||
                  `${process.env.REACT_APP_PUBLIC_URL}/football.jfif`
                }
                className="image-fit-height mr-3"
                roundedCircle
              />
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
      {currUser && userId === currUser.uid ? (
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
            unmatched={state?.unmatched || true}
            incorrectPassword={state.incorrectPassword}
            success={state.success}
            handlePasswordChange={handlePasswordChange}
            setOldPassword={(val) =>
              dispatch({ type: "setOldPassword", password: val })
            }
            handlePasswordSubmission={handlePasswordSubmission}
            handleHide={() => dispatch({ type: "changePassword" })}
          />

          <ImageModal
            show={showImageModal}
            handleHide={() => setShowModal(!showImageModal)}
            handleInfoSubmission={handleImageSubmission}
          />
        </>
      ) : (
        ""
      )}
      <Row className="justify-content-center">
        <CardDeck id="teamCards">
          {teams.map((team, index) => (
            <Card key={index} className="m-2">
              <Card.Body className="d-flex flex-column align-content-end">
                <a href={`/league/${team.league}/team/${team.id}/`}>
                  <Card.Img
                    variant="bottom"
                    className="mt-auto"
                    src={teamLogos[team.id] || team.logo}
                  />
                </a>
                <div className="mt-auto">
                  <Card.Title>{team.name}</Card.Title>
                  <Card.Text>{team.leagueName}</Card.Text>
                  <Button className="mt-auto" href={`/league/${team.league}/`}>
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
          ))}
        </CardDeck>
      </Row>
    </Container>
  );
};

export default User;
