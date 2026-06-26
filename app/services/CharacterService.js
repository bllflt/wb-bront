import api from "./api";

const getAll = (storyId = 1) => {
  return api.get(`stories/${storyId}/characters?sort=name`);
};

const getAllIDs = (storyId = 1) => {
  return api.get(`stories/${storyId}/characters?fields=id,name&sort=name`);
}

const get = id => {
  return api.get(`characters/${id}`);
};

const create = (data, storyId = 1) => {
  return api.post(`stories/${storyId}/characters`, data);
};

const update = (id, data) => {
  return api.put(`characters/${id}`, data);
};

const remove = id => {
  return api.delete(`characters/${id}`);
};


const findByName = name => {
  return api.get(`characters?name=${name}`);
};

const getCharacterConnections = (id, degree) => {
  return api.get(`characters/${id}/connections?degree=${degree}`);
};

const CharacterService = {
  getAll,
  getAllIDs,
  get,
  create,
  update,
  remove,
  findByName,
  getCharacterConnections,
};

export default CharacterService;
