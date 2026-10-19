import api from "./api";

const getAll = () => api.get(`flaws?sort=name`);

const getAllIDs = () => api.get(`flaws?fields=name&sort=name`);

const get = name => api.get(`flaws/${name}`);

const findByName = name => {
  return api.get(`flaws?name=${name}`);
};

const semanticSearch = qtext => {
  return api.get("flaws", {
    params: { q: qtext, mode: "semantic", limit: 10, fields: "name" },
  });
};

const FlawService = {
  getAll,
  getAllIDs,
  get,
  findByName,
  semanticSearch,
};

export default FlawService;
