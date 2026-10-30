

import Joi from "joi";

export const createOrganizationSchema = Joi.object({
  body: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        "string.empty": "Organization name is required",
        "string.min": "Organization name must be at least 2 characters",
        "string.max": "Organization name cannot exceed 100 characters",
        "any.required": "Organization name is required",
      }),
  })
    .required()
    .unknown(false),

  params: Joi.object({}).required().unknown(false),
  query: Joi.object({}).required().unknown(false),
});
