import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'

const Recommendations = () => {
  const result = useQuery(ALL_BOOKS)
  const userResult = useQuery(ME)

  if (result.loading || userResult.loading ) {
    return <div>Loading...</div>
  }

  const favorite = userResult.data.me.favoriteGenre
  const books = result.data.allBooks
  const recommendedBooks = books.filter((book) =>
    book.genres.includes(favorite)
  )

  return (
    <div>
      <h2>recommendations</h2>
      {userResult.data.me && <p>books in your favorite genre: <b>{favorite}</b></p>}
      {!userResult.data.me && <p>no books of your favorite genre</p>}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {recommendedBooks.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommendations