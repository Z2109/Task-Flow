
import Joi from "joi";

export const createRoleSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),

    description: Joi.string()
      .trim()
      .max(200)
      .allow("")
      .optional(),

    permissions: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(1)
      .unique()
      .required(),

    scope: Joi.string()
      .valid("organization", "project")
      .required(),
  }).required().unknown(false),

  params: Joi.object({}).required().unknown(false),
  query: Joi.object({}).required().unknown(false),
});
