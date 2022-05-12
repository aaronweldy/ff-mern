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
import ImageModal from "../shared/ImageModal";
import { auth, storage } from "../../firebase-config";
import { getDownloadURL, uploadString, ref } from "firebase/storage";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import "../../CSS/LeaguePages.css";
import { Team } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { useUploadPhotoMutation } from "../../hooks/query/useUploadPhotoMutation";
import { useTeamsByUser } from "../../hooks/query/useTeamsByUser";

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
  const [showImageModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const user = useAuthUser("user", auth);
  const updateUserQuery = useUploadPhotoMutation();
  const userTeamsQuery = useTeamsByUser(user?.data?.uid);

  useEffect(() => {
    if (userTeamsQuery.isSuccess) {
      userTeamsQuery.data.teams.forEach((team: Team) => {
        if (team.leagueLogo) {
          getDownloadURL(ref(storage, `logos/${team.leagueLogo}`)).then(
            (newUrl) => {
              setTeamLogos((teamLogos) => {
                return { ...teamLogos, [team.id]: newUrl };
              });
            }
          );
        }
      });
    }
  }, [userId, imageUrl, userTeamsQuery.isSuccess, userTeamsQuery.data]);

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
    if (user.isSuccess && user.data && user.data?.email) {
      const providedCredential = EmailAuthProvider.credential(
        user.data.email,
        state.oldPassword
      );
      const errAction: PasswordReducerAction = {
        type: "setFlags",
        success: false,
        incorrectPassword: true,
        changePassword: true,
        unmatched: false,
      };
      reauthenticateWithCredential(user.data, providedCredential)
        .then(() => {
          if (user.data) {
            updatePassword(user.data, state.firstNewPassword)
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
          } else {
            throw new Error("User data is undefined");
          }
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
    uploadString(ref(storage, `${subUser.email}/logo`), url, "data_url").then(
      (snapshot) => {
        getDownloadURL(snapshot.ref).then((newUrl) => {
          updateProfile(subUser, { photoURL: newUrl }).then(() => {
            setShowModal(false);
            if (userId) {
              updateUserQuery.mutate({ id: userId, newUrl });
              setImageUrl(newUrl);
            }
          });
        });
      }
    );
  };
  return (
    <Container fluid>
      {user.isSuccess ? (
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
                <h1 className="mt-3">{user.data?.displayName}</h1>
              </Row>
              <Row>
                <div className="subtitle">{user.data?.email}</div>
              </Row>
            </Col>
          </Row>
        </>
      ) : (
        ""
      )}
      {user.data && userId === user.data.uid ? (
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
      {user.data ? (
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
        <CardDeck>
          {userTeamsQuery.isSuccess &&
            userTeamsQuery.data.teams.map((team, index) => (
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
                    <Button
                      className="mt-auto"
                      href={`/league/${team.league}/`}
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
            ))}
        </CardDeck>
      </Row>
    </Container>
  );
};

export default User;
