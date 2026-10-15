/** Error with an HTTP status code; the central handler turns it into JSON. */
export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
