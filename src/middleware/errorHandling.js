
const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack || err.message);

    const statusCode = err.statusCode || err.status || 500;

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal Server Error"
                : err.message || "Something went wrong",
    });
};

export default errorMiddleware;
