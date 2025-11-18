import api from './api';


const createWork = data => api.put('/ai/work/caption/request', data);


const AiService = {
    createWork,
};


export default AiService;