import mongoose from 'mongoose';
import Article from "./article.model.js"
export const {Types: {ObjectId}} = mongoose;

const roleEnum = {
  values: ['admin', 'writer', 'guest'],
  message: 'Role must be admin, writer or guest'
}
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 4,
    maxlength: 50,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 60,
    required: true,
    trim: true,
  }, 
  fullName: String, 
  email: {
    type: String,
    required: true,
    match: [/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email format'],
    lowercase: true,
  },
  role: {
    type: String,
    enum: roleEnum
  },
  age: {
    type: Number,
    min: 1,
    max: 99,
  },
  numberOfArticles: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false,
});

userSchema.pre('save', (next) => {
  this.set({updatedAt: new Date()});

  if (!(this.isModified('firstName') || this.isModified('lastName'))) {
    return next();
  }

  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

userSchema.pre('validate', (next) => {
  if (this.age < 0) {
    this.age = 1
  }
  next();
});

userSchema.post('save', (error, doc, next) => {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('A user with this email already exists'));
  } else {
    next(error);
  }
});

userSchema.pre('deleteOne', async (next) => {
  try {
    const userId = this.getQuery()['_id'];
    await Article.deleteMany({owner: userId});
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

export default User;
