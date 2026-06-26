import api from "./api";

const get_story_names = () => {
  return api.get("get_permitted_stories_by_ids");
}

const StoryService = {
  get_story_names,
};

export default StoryService;