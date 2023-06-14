import { useState } from 'react'
import { useQuery } from "@apollo/client"
import { ALL_BOOKS } from "../queries"

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState(null)

  const variables = selectedGenre === null ? {} : {genre: selectedGenre}
  const resultByGenre = useQuery(ALL_BOOKS, { variables: variables })
  const result = useQuery(ALL_BOOKS)

  if (!props.show) {
    return null
  }

  if (result.loading || resultByGenre.loading)  {
    return <div>loading...</div>
  }

  const filteredBooks = resultByGenre.loading ? [] : resultByGenre.data.allBooks

  const books = result.data.allBooks
  const genres = [...new Set(books.flatMap((book) => book.genres))]

  return (
    <div>
      <h2>books</h2>
      {selectedGenre && <p>in genre: <b>{selectedGenre}</b></p>}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {filteredBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {genres.map((genre) => (
          <button key={genre} onClick={() => setSelectedGenre(genre)}>
            {genre}
          </button>
        ))}
        <button onClick={() => setSelectedGenre(null)}>all genres</button>
      </div>
    </div>
  )
}

export default Books
