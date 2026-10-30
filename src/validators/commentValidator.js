
import Joi from "joi";

const createCommentValidator = Joi.object({
    body: Joi.object({
        text: Joi.string().trim().min(1).max(2000).required(),
    }).required().unknown(false),

    params: Joi.object({}).required().unknown(false),
    query: Joi.object({}).required().unknown(false),
});

const updateCommentValidator = Joi.object({
    body: Joi.object({
        text: Joi.string().trim().min(1).max(2000).required(),
    }).required().unknown(false),

    params: Joi.object({
        commentId: Joi.string().hex().length(24).required(),
    }).required().unknown(false),

    query: Joi.object({}).required().unknown(false),
});

export {
    createCommentValidator,
    updateCommentValidator,
};
