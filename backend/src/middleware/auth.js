import pkg from 'jsonwebtoken';
import env from 'dotenv'
const { verify } = pkg;
env.config();

export default function (req, res, next) {
    const token = req.header('token');
    if (!token) return res.status(401).json({'message' : 'Authentication Error'});
    try {
        const decoded = verify(token, process.env.APP_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send({'message' : 'Invalid token'});
    }
}