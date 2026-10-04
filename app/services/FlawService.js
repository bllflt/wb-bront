import api from "./api";

const getAll = () => api.get(`flaws?sort=name`);

const getAllIDs = () => api.get(`flaws?fields=name&sort=name`);

const get = name => api.get(`flaws/${name}`);

const findByName = name => {
  return api.get(`flaws?name=${name}`);
};

const FlawService = {
  getAll,
  getAllIDs,
  get,
  findByName,
};

export default FlawService;
