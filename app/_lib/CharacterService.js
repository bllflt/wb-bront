import http from "./http-common";

const getAll = () => {
  return http.get("/characters?sort=name");
};

const getAllIDs = () => {
  return http.get("/characters?fields=id,name&sort=name");
}

const get = id => {
  return http.get(`/characters/${id}`);
};

const create = data => {
  return http.post("/characters", data);
};

const update = (id, data) => {
  return http.put(`/characters/${id}`, data);
};

const remove = id => {
  return http.delete(`/characters/${id}`);
};


const findByName = name => {
  return http.get(`/characters?name=${name}`);
};

const getCharacterConnections = id => {
  return http.get(`/characters/${id}/connections`);
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
