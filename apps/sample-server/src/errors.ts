export class SampleDatabaseError extends Error {
  readonly name = "SampleDatabaseError"

  constructor() {
    super("Database connection failed")
  }
}

export class SampleAuthError extends Error {
  readonly name = "SampleAuthError"

  constructor() {
    super("Access token expired")
  }
}

export class SampleAsyncJobError extends Error {
  readonly name = "SampleAsyncJobError"

  constructor() {
    super("Background job promise rejected")
  }
}

export class SampleRandomError extends Error {
  readonly name = "SampleRandomError"

  constructor() {
    super("Random sample failure")
  }
}
