const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      const books = await Book.find({}).populate('author')
      let filtered = [...books]
      if(args.author) {
        filtered = filtered.filter(book => book.author.name === args.author)
      }
      if(args.genre) {
        filtered = filtered.filter(book => book.genres.includes(args.genre))
      }
      
      return filtered
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      const books = await Book.find({}).populate('author')
      
      return authors.map(author => ({
        name: author.name,
        born: author.born,
        bookCount: author.bookCount
      }))
    },
    me : (root, args, context) => {
      return context.currentUser
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      let author = await Author.findOne({ name: args.author})
      const currentUser = context.currentUser
      
      if (!currentUser) {
        throw new GraphQLError('not logged in', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

      if (!author) {
        author = new Author({ name: args.author, bookCount: 1 })
        try {
          await author.save()
        } catch (error) {
          throw new GraphQLError('Adding author failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
      } else {
        try {
          author.bookCount += 1
          await author.save()
        } catch (error) {
          throw new GraphQLError('Updating author bookCount failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
        
      }
      
      const book = new Book({ ...args, author: author })

      try {
        const savedBook = await book.save()
        await savedBook.populate('author')
        pubsub.publish('BOOK_ADDED', { bookAdded: savedBook })

        return savedBook
        
      } catch (error) {
        throw new GraphQLError('Adding book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
    },
    editAuthor: async (root, args, context) => {
      let author = await Author.findOne({ name: args.name })
      const currentUser = context.currentUser
      
      if (!currentUser) {
        throw new GraphQLError('not logged in', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

      if (!author) {
        return null
      }
  
      author.born = args.setBornTo
      try {
        await author.save()
        return author
      } catch (error) {
        throw new GraphQLError('Editing author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre})
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'password' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
    }
  }
}

module.exports = resolvers