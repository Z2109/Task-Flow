
import Joi from "joi";

const emptyObject = () =>
    Joi.object({}).required().unknown(false);

const projectParams = Joi.object({
    id: Joi.string().hex().length(24).required(),
}).required().unknown(false);

const createProjectValidator = Joi.object({
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        description: Joi.string().trim().max(2000).allow(""),
        category: Joi.string().trim().max(100).allow(""),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        priority: Joi.string().valid("Low", "Medium", "High"),
        dueDate: Joi.date().iso().allow(null),
        tags: Joi.array().items(Joi.string().trim().max(50)),
        isPrivate: Joi.boolean(),
        reminderEnabled: Joi.boolean(),
    }).required().unknown(false),

    params: emptyObject(),
    query: emptyObject(),
});

const updateProjectValidator = Joi.object({
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100),
        description: Joi.string().trim().max(2000).allow(""),
        category: Joi.string().trim().max(100).allow(""),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        priority: Joi.string().valid("Low", "Medium", "High"),
        dueDate: Joi.date().iso().allow(null),
        tags: Joi.array().items(Joi.string().trim().max(50)),
        isPrivate: Joi.boolean(),
        reminderEnabled: Joi.boolean(),
    }).min(1).required().unknown(false),

    params: projectParams,
    query: emptyObject(),
});

const updateProjectStatusValidator = Joi.object({
    body: Joi.object({
        status: Joi.string()
            .valid("Active", "Completed", "Archived")
            .required(),
    }).required().unknown(false),

    params: projectParams,
    query: emptyObject(),
});

const projectIdValidator = Joi.object({
    body: emptyObject(),
    params: projectParams,
    query: emptyObject(),
});

const projectStatusParamValidator = Joi.object({
    body: emptyObject(),

    params: Joi.object({
        status: Joi.string()
            .valid("Active", "Completed", "Archived")
            .required(),
    }).required().unknown(false),

    query: emptyObject(),
});

export {
    createProjectValidator,
    updateProjectValidator,
    updateProjectStatusValidator,
    projectIdValidator,
    projectStatusParamValidator,
};
