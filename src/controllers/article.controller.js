import Article from '../models/article.model.js';
import { validateById } from '../validators/objectIdValidator.js';

export const createArticle = async (req, res, next) => {
  try {
    const ownerId = req.body.owner;

    if (!ownerId)
      return res.status(400).json({error: 'Owner is required'});

    if (!validateById(ownerId))
      return res.status(400).json({error: 'Invalid owner id'});
    
    const {title, subtitle, description, category} = req.body;
    const article = new Article({ title, subtitle, description, owner: ownerId, category });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
}

export const getArticles = async (req, res, next) => {
  try {
    const sortType = getSortBy(req.query.sortBy);
    const order = getOrderBy(req.query.orderBy);
    const page = getPage(req.query.page);
    const limit = getLimit(req.query.limit);

    const project = {createdAt: 0, updatedAt: 0};
    const skipCount = (page - 1) * limit;

    const articles = await Article
      .find()
      .skip(skipCount)
      .sort([[sortType, order]])
      .limit(limit)
      .select(project)
      .populate('owner', 'fullName email age -_id');

      console.log(req.body)
    res.status(200).json(articles);
  } catch (err) {
    next(err);
  }
}

export const getArticleById = async (req, res, next) => {
  try {
    const {id: articleId} = req.params
    if (!validateById(articleId))
      return res.status(400).json({error: 'Invalid article id'});

    const article = await Article.findById({_id: articleId}).lean();

    if (!article)
      return res.status(404).json({error: 'Article not found'});

    const project = {createdAt: 0, updatedAt: 0};
    const articleWithOwner = await Article
      .findById({_id: articleId})
      .select(project)
      .populate('owner', 'fullName email age -_id');

    res.status(200).json(articleWithOwner);
  } catch (err) {
    next(err);
  }
}

export const updateArticleById = async (req, res, next) => {
  try {
    const {id: articleId} = req.params;

    if (!validateById(articleId))
      return res.status(400).json({error: 'Invalid article id'});

    const article = await Article.findById({_id: articleId}).lean();

    if (!article)
      return res.status(404).json({error: 'Article not found'});

    if (!article.owner.equals(req.user.id))
      return res.status(403).json({error: 'Permission denied'});

    const { title, subtitle, description, category } = req.body;

    const updatedArticle = await Article.findByIdAndUpdate(
      { _id: articleId },
      { title, subtitle, description, category },
      { runValidators: true, new: true }
    );
    res.status(200).json(updatedArticle);
  } catch (err) {
    next(err);
  }
}

export const deleteArticleById = async (req, res, next) => {
  try {
    const {id: articleId} = req.params;

    if (!validateById(articleId))
      return res.status(400).json({error: 'Invalid article id'});

    const article = await Article.findById({_id: articleId}).lean();

    if (!article)
      return res.status(404).json({error: 'Article not found'});

    const {title, subtitle, description, category} = req.body;

    const updatedArticle = await Article.findByIdAndUpdate(
      {_id: articleId},
      {title, subtitle, description, category},
      {runValidators: true, new: true}
    ).lean();

    await Article.deleteOne({ _id: articleId });
    res.status(200).json(updatedArticle);
  } catch (err) {
    next(err);
  }
}

const getSortBy = (type) => {
  if (type !== 'title' && type !== 'category') {
    return 'createdAt';
  }

  return type;
}

const getOrderBy = function (order) {
  return order === ('desc' || -1) ? -1 : 1;
}

const getPage = function (page) {
  if (page > 0 && page <= 10) {
    return parseInt(page);
  }

  return 1;
}

const getLimit = function (limit) {
  if (limit > 0 && limit <= 10) {
    return parseInt(limit);
  }

  return 10;
}
