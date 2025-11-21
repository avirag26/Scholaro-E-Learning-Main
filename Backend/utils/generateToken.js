import jwt from 'jsonwebtoken'

export const generateAccessToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
        }
    );
};

export const generateRefreshToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        }
    );
};
