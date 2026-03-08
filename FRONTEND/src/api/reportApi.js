import api from "./axios";

const createReport = (data) =>
  api.post("/reports", data);

export default { createReport };


