import User, {ObjectId} from '../models/user.model.js';
import { validateById } from '../validators/objectIdValidator.js';
export const getUsers = async (req, res, next) => {
  try {
    const sortBy = getSortBy(req.query.sortBy);
    const orderBy = getOrderBy(req.query.orderBy);
    const filter = sortBy === 'createdAt' ? {} : {[sortBy]: {$exists: true}}; 

    const project = {_id: 1, fullName: 1, email: 1, age: 1}

    const result = await User
      .find(filter)
      .sort([[sortBy, orderBy]])
      .select(project).lean(); 

    return res.status(200).json(result);
  } catch (err) {
    next(err);
    res.status(400);
  }
}

export const getUserByIdWithArticles = async (req, res, next) => {
  try {
    const {id: userId} = req.params

    if (!validateById(userId))
      return res.status(400).json({ error: 'Invalid user id' });

    const userWithArticles = await User.aggregate([
      { $match: {_id: new ObjectId(userId)}},
      { $lookup: {
        from: 'articles',
        localField: '_id',
        foreignField: 'owner',
        as: 'articles',
      }},
      { $project: {
        _id: 1,
        fullName: 1,
        email: 1,
        age: 1,
        numberOfArticles: 1,
        articles: {
          $map: {
            input: '$articles',
            as: 'article',
            in: {
              title: '$$article.title',
              subtitle: '$$article.subtitle',
              createdAt: '$$article.createdAt'
            }
          }
        },
      }},
    ])

    if (userWithArticles.length === 0)
      return res.status(404).json({ error: 'User not found' });

    res.status(200).json(userWithArticles[0])
  } catch (err) {
    next(err);
  }
}

export const createUser = async (req, res, next) => {
  try {
    const {firstName, lastName, email, role, age, numberOfArticles} = req.body;
    const user = new User({ firstName, lastName, email, role, age, numberOfArticles });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export const updateUserById = async (req, res, next) => {
  try {
    const {id: userId} = req.params;
    if (!validateById(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const project = {firstName: 1, lastName: 1, fullName: 1, age: 1 };
    const user = await User.findById({_id: userId}).select(project);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    const dataFromBody = {...req.body}

    for (const key in dataFromBody) {
      user[key] = dataFromBody[key];
    }

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export const deleteUserById = async (req, res, next) => {
  try {
    const {id: userId} = req.params;
    if (!validateById(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findById({_id: userId}).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.deleteOne({_id: userId});
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

const getSortBy = (type) => {
  return Object.keys(User.schema.paths).includes(type)
    ? type
    : 'createdAt';
}

const getOrderBy = (order) => {
  return order === ('desc' || -1) ? -1 : 1;
}
