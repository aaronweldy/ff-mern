import { Router } from "express";
import { check, validationResult } from "express-validator";
import Team  from '../model/team.js'
import RefreshToken from '../model/refreshToken.js'
import pkg from "bcryptjs";
import pkg2 from "jsonwebtoken";
import auth from '../middleware/auth.js';
import env from 'dotenv';
const router = Router();
const { genSalt, hash, compare } = pkg;
const { sign, verify } = pkg2;

import User from "../model/user.js";

env.config();

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */
router.get('/:username/leagues/', auth, async (req, res) => {
    const teams = [];
    for await (const team of Team.find({owner: req.user.id})) {
        teams.push(team);
    }
    console.log(teams);
    res.json({teams});
});

router.get("/me/", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      res.json(user);
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
});

router.post("/signup/",
    [
        check("username", "Please Enter a Valid Username").not().isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({ min : 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            username,
            email,
            password
        } = req.body;
        try {
            let user = await User.find({ $or: [{email}, {username}]})
            if (user.length > 0) {
                return res.status(400).json({
                    msg: "User Already Exists"
                });
            }

            user = new User({
                username,
                email,
                password
            });
            const salt = await genSalt(10);
            user.password = await hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            };
            console.log(user);
            const refreshToken = sign(payload, process.env.APP_SECRET, {expiresIn: 2500000});
            sign(payload, process.env.APP_SECRET,
              {
                expiresIn: 360000
              },
              async (err, token) => {
                if (err) throw err;
                const newToken = new RefreshToken({refreshToken, token});
                await newToken.save();
                res.status(200).json({
                  token, refreshToken
                });
              }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    }
);

router.post("/login/",
    [
      check("email", "Please enter a valid email").isEmail(),
      check("password", "Please enter a valid password").isLength({
        min: 6
      })
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }
      const { email, password } = req.body;
      try {
        let user = await User.findOne({
          email
        });
        if (!user)
          return res.status(400).json({
            message: "User does not exist"
          });
  
        const isMatch = await compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({
            message: "Incorrect Password !"
          });
        console.log("Password matches");
        const payload = {
          user: {
            id: user.id
          }
        };
        const refreshToken = sign(payload, process.env.APP_SECRET, {expiresIn: 2500000});
        sign(payload, process.env.APP_SECRET,
          {
            expiresIn: 360000
          },
          async (err, token) => {
            if (err) throw err;
            const newToken = new RefreshToken({refreshToken, token});
            await newToken.save();
            res.status(200).json({
              token, refreshToken
            });
          }
        );
      } catch (e) {
        console.error(e);
        res.status(500).json({
          message: "Server Error"
        });
      }
    }
  );

  router.post('/refresh/', async (req, res) => {
    const reqToken = req.body.refreshToken;
    const refreshToken = await RefreshToken.findOne({refreshToken: reqToken});
    if (!refreshToken) res.status(401).send('Invalid request.');
    else {
      try {
        const oldPayload = verify(refreshToken.refreshToken, process.env.APP_SECRET);
        const newUser = {
          user: {
            id: oldPayload.user.id
          }
        }
        const newToken = sign(newUser, process.env.APP_SECRET, {expiresIn: 25000});
        await RefreshToken.findByIdAndUpdate(refreshToken._id, {token: newToken}, {useFindAndModify: false});
        res.status(200).json({newToken});
      }
      catch (e) {
        console.log(e);
        res.status(401).send('Unable to verify user.');
      }
    }
  })

export default router;