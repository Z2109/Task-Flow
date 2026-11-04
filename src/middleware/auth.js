
import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  const token = req.headers.token;

  // Check token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please login again.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Attach authenticated user ID
    req.userId = decoded.id;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export default authUser;
