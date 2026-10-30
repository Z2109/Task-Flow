
import Joi from "joi";

const signupValidator = Joi.object({
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        email: Joi.string().trim().email().lowercase().required(),
        password: Joi.string().min(8).max(128).required(),
    }).required().unknown(false),

    params: Joi.object({}).required().unknown(false),
    query: Joi.object({}).required().unknown(false),
});

const loginValidator = Joi.object({
    body: Joi.object({
        email: Joi.string().trim().email().lowercase().required(),
        password: Joi.string().min(1).max(128).required(),
    }).required().unknown(false),

    params: Joi.object({}).required().unknown(false),
    query: Joi.object({}).required().unknown(false),
});

export {
    signupValidator,
    loginValidator,
};
