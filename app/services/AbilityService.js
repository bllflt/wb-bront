import api from "./api";

const getAll = () => api.get(`abilities?sort=name`);

const getAllIDs = () => api.get(`abilities?fields=name&sort=name`);

const get = name => api.get(`abilities/${name}`);

const findByName = name => {
  return api.get(`abilities?name=${name}`);
};

const semanticSearch = qtext => {
  return api.get("abilities", {
    params: { q: qtext, mode: "semantic", limit: 10, fields: "name" },
  });
};

const AbilityService = {
  getAll,
  getAllIDs,
  get,
  findByName,
  semanticSearch,
};

export default AbilityService;
