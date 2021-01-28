import { Joi, Segments, celebrate } from 'celebrate';

export const ruleSchema = {
  [Segments.BODY]: Joi.object().keys({
    rule: Joi.object()
      .keys({
        field: Joi.string().required(),
        condition: Joi.string().valid('eq', 'neq', 'gt', 'gte', 'contains').required(),
        condition_value: Joi.alternatives(Joi.string(), Joi.number()).required()
      })
      .required(),
    data: Joi.alternatives(Joi.object(), Joi.array(), Joi.string()).required()
  })
};

export const validatePayload = celebrate(ruleSchema);
