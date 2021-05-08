import pkg from 'jsonwebtoken';
import env from 'dotenv'
const { verify } = pkg;
env.config();

export default function (req, res, next) {
    const token = req.header('token');
    console.log(token);
    if (!token) return res.status(401).json({'message' : 'Authentication Error'});
    try {
        const decoded = verify(token, process.env.APP_SECRET);
        console.log(decoded);
        req.user = decoded.user;
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send({'message' : 'Invalid token'});
    }
}