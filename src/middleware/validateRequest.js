
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(
            {
                body: req.body,
                params: req.params,
                query: req.query,
            },
            {
                abortEarly: false,
                allowUnknown: false,
                convert: true,
            }
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message,
                })),
            });
        }

        req.body = value.body;
        req.validatedParams = value.params;
        req.validatedQuery = value.query;

        return next();
    };
};

export default validateRequest;
