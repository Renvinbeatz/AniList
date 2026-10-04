export const SEARCH_ANIME_QUERY = `
  query SearchAnime($search: String, $page: Int = 1, $perPage: Int = 10) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          extraLarge
          color
        }
        bannerImage
        episodes
        duration
        status
        season
        seasonYear
        averageScore
        genres
        synonyms
        studios(isMain: true) {
          nodes {
            name
          }
        }
      }
    }
  }
`

export const GET_ANIME_BY_ID_QUERY = `
  query GetAnimeById($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        extraLarge
        color
      }
      bannerImage
      episodes
      duration
      status
      season
      seasonYear
      averageScore
      genres
      synonyms
      studios(isMain: true) {
        nodes {
          name
        }
      }
    }
  }
`

// Apenas o necessário para o cronograma de lançamentos (sem descrição, gêneros, imagens...).
export const GET_AIRING_SCHEDULE_QUERY = `
  query GetAiringSchedule($mediaId: Int!, $from: Int!, $to: Int!, $perPage: Int = 50) {
    Page(page: 1, perPage: $perPage) {
      airingSchedules(mediaId: $mediaId, airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        id
        episode
        airingAt
        mediaId
      }
    }
  }
`
