import api from "./api";

const getAll = () => api.get(`virtues?sort=name`);

const getAllIDs = () => api.get(`virtues?fields=name&sort=name`);

const get = name => api.get(`virtues/${name}`);

const findByName = name => {
  return api.get(`virtues?name=${name}`);
};

const VirtueService = {
  getAll,
  getAllIDs,
  get,
  findByName,
};

export default VirtueService;
