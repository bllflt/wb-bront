import React, { useState, useEffect } from "react";
import TutorialDataService from "../services/TutorialService";
import { Link } from "react-router-dom";

const TutorialsList = () => {
  const [tutorials, setTutorials] = useState([]);
  const [currentTutorial, setCurrentTutorial] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [searchTitle, setSearchTitle] = useState("");

  useEffect(() => {
    retrieveTutorials();
  }, []);

  const onChangeSearchTitle = e => {
    const searchTitle = e.target.value;
    setSearchTitle(searchTitle);
  };

  const retrieveTutorials = () => {
    TutorialDataService.getAll()
      .then(response => {
        setTutorials(response.data);
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  };

  const refreshList = () => {
    retrieveTutorials();
    setCurrentTutorial(null);
    setCurrentIndex(-1);
  };

  const setActiveTutorial = (tutorial, index) => {
    setCurrentTutorial(tutorial);
    setCurrentIndex(index);
    window.scrollTo(0, 0)
  };

  const findByName = () => {
    TutorialDataService.findByName(searchTitle)
      .then(response => {
        setTutorials(response.data);
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  };

  function moo(image) {
    console.log(image)
    return (
      <img
        src={"http://127.0.0.1:5000/images/".concat(image)}
        width="100"
        alt="mooo"></img>
    )
  }

  function handleChange(name) {
    const item = tutorials.find((i) => i.name === name)
    setCurrentTutorial(item);
  }

  return (
    <div className="list row">
      <div className="col-md-8">
      </div>
      <div className="col-md-6">
        <select
          list="character-names"
          value={currentTutorial && currentTutorial.name}
          onChange={e => handleChange(e.target.value)}
        >
          <option value="none" selected disabled hidden>Select an Option</option>
          {tutorials.map((e, key) => {
            return <option key={key} value={e.name}>{e.name}</option>
          })}
        </select>

        <div>
          {currentTutorial ? (
            <div>
              {currentTutorial.images.map((image) => moo(image))}
            </div>
          ) : (<div></div>)}
        </div>

      </div>
      <div className="col-md-6">
        {currentTutorial ? (
          <div>
            <div>
              <label>
                <strong>Name:</strong>
              </label>{" "}
              {currentTutorial.name}
            </div>
            <div>
              <label>
                <strong>Appearance:</strong>
              </label> {" "}
              {currentTutorial.appearance}
            </div>
            <div>
              <label><strong>Roleplaying:</strong></label>{" "}
              <ul>
                {currentTutorial.roleplaying.map(function (roleplaying) {
                  return (<li>{roleplaying}</li>)
                })}
              </ul>
            </div>
            <div>
              <label>
                <strong>Background:</strong>
              </label>{" "}
              {currentTutorial.background}
            </div>
            <div>
              <label>
                <strong>Status:</strong>
              </label>{" "}
              {currentTutorial.published ? "Published" : "Pending"}
            </div>

            <Link
              to={"/tutorials/" + currentTutorial.id}
            >
              Edit
            </Link>
          </div>
        ) : (
          <div>
            <br />
            <p>Please click on a Tutorial...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialsList;
