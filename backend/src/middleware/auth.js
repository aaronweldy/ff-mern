import pkg from 'jsonwebtoken';
const { verify } = pkg;

export default function (req, res, next) {
    const token = req.header('token');
    console.log(token);
    if (!token) return res.status(401).json({'message' : 'Authentication Error'});
    try {
        const decoded = verify(token, 'secret');
        req.user = decoded.user;
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send({'message' : 'Invalid token'});
    }
}