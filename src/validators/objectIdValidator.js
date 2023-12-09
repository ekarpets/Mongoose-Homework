import {ObjectId} from '../models/user.model.js'
export const validateById = (id) => ObjectId.isValid(id);