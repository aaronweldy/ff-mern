import React, {useEffect, useState} from 'react';
import { Route, Redirect } from 'react-router-dom';
import {useSelector, useDispatch} from 'react-redux'
import {selectStatus, logout } from '../Redux/userSlice.js'

const SecureRoute = ({ component: Component, ...rest }) => {
    const dispatch = useDispatch();
    const loggedIn = useSelector(selectStatus);
    const url = "/api/v1/user/me/";
    let [redirect, setRedirect] = useState(false);
    let [id, setId] = useState("");
    useEffect(() => {
        async function checkStatus() {
            const reqDict = {
                token: localStorage.getItem('userToken'),
            }
            await fetch(url, {credentials: "include", headers: reqDict}).then(resp => {
                if(!resp.ok) throw Error(resp.statusText);
                return resp.json();
            }).then(data => {
                setId(data._id);
            }).catch(_ => {
                const body = {
                    refreshToken: localStorage.getItem('refreshToken')
                }
                const reqdict = {
                    method : 'POST', 
                    headers : {'content-type' : 'application/json'},
                    body : JSON.stringify(body)
                };
                const url = '/api/v1/user/refresh/';
                fetch(url, reqdict).then(resp => {
                        if (!resp.ok) throw Error(resp.statusText);
                        return resp.json();
                    }).then(data => {
                        localStorage.setItem('userToken', data.newToken);
                        setId(data._id);
                    }).catch(_ => {
                        localStorage.removeItem('userToken');
                        dispatch(logout());
                        setRedirect(true);
                });
            });
        }
        checkStatus();
    }, [dispatch, url]);
    if (!loggedIn || redirect) return <Redirect to="/login"></Redirect>
    return (
        <Route {...rest} component={props => <Component {...rest} {...props} userId={id}/>}/>
    )
}

export default SecureRoute;