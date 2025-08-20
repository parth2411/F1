import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().min(1).max(50).required(),
  last_name: Joi.string().min(1).max(50).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { error } = registrationSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }
  
  next()
}

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { error } = loginSchema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }
  
  next()
}