import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import MovieGrid from "./components/MovieGrid";
import GlobalStyle from "./styles/GlobalStyle";
import Header from "./components/Header";
import Loading from "./components/Loading";

// Set OpenAI API key
const TMBD_API_KEY = import.meta.env.VITE_APP_TMBD_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_APP_OPENAI_API_KEY;

const DEFAULT_PARAMS = {
  model: "gpt-3.5-turbo",
  temperature: 0.1,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

const App = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMoviesFromTMDB = async (movieTitles) => {
    console.log("fetching movies from TMDB...");
    const fetchedMovies = [];

    for (const title of movieTitles) {
      console.log(`fetching movie: ${title}`);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMBD_API_KEY}&query=${title}`
        );
        console.log(response);

        if (response.data.results.length > 0) {
          fetchedMovies.push(response.data.results[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }

    setMovies(fetchedMovies.slice(0, 16));
  };

  const fetchMovieTitlesFromOpenAI = async (searchTerm) => {
    try {
      const prompt = `Return an array of movie titles that best match this search term, 
                ordered from most to least relevant. Generate up to 16 titles.
  
                Example:
                prompt: "movies with brando"
                
                response: ["The Godfather", "The Godfather: Part II", "Apocalypse Now", "The Wild One"]
  
                prompt: ${searchTerm}
                response:
                `;

      const params = {
        ...DEFAULT_PARAMS,
        messages: [{ role: "user", content: prompt }],
      };
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + String(OPENAI_API_KEY),
        },
        body: JSON.stringify(params),
      };

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        requestOptions
      );

      const data = await response.json();

      console.log(data);

      const movieTitles = data.choices[0].message.content
        .trim()
        .split("\n")
        .filter((title) => title);

      console.log(movieTitles);

      return JSON.parse(movieTitles);
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleSearchButtonClick = async () => {
    if (searchTerm) {
      setLoading(true);
      const movieTitles = await fetchMovieTitlesFromOpenAI(searchTerm);
      await fetchMoviesFromTMDB(movieTitles);
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyle />
      <Header />
      <SearchBar
        setSearchTerm={setSearchTerm}
        onSearchButtonClick={handleSearchButtonClick}
      />
      {loading && <Loading />}
      <MovieGrid movies={movies} />
    </>
  );
};

export default App;
