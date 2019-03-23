var createJsonResponse = (error, result) => {
  if(error) {
    return {
      meta: {
        code: 400,
        errorMessage: error
      }
    }
  } else {
    return {
      meta: {
        code: 200
      },
      response: result
    }
  }
}

exports.createJsonResponse = createJsonResponse;
