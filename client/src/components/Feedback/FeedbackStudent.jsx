import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ReflectionModal from "../Feedback/ReflectionModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Feedback.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import DefaultImage from "../../assets/img/default-image.jpg";
import { useAuth } from "../../context/AuthContext";

function FeedbackStudent() {
  const { userData } = useAuth();
  const [reflections, setReflections] = useState([]);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const fetchData = useCallback(async () => {
    if (userData && userData._id) {
      try {
        const res = await axios.get(
          `/api/feedback/student-requested-feedback`,
          {
            withCredentials: true,
          }
        );
        setReflections(res.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch reflections.");
      }
    } else {
      console.log("User or user._id is undefined");
    }
  }, [userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCardClick = (reflection) => {
    setLoadingReflection(true);
    try {
      setSelectedReflection(reflection);
    } catch (error) {
      console.error("Error fetching reflection:", error);
      toast.error("Failed to fetch reflection.");
    } finally {
      setLoadingReflection(false);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value.toLowerCase());
  };

  const handleFilterChange = (filterType) => {
    setFilter(filterType);
  };

  const handleFeedbackSubmit = (reflectionId) => {
    setReflections((prevReflections) =>
      prevReflections.map((reflection) =>
        reflection._id === reflectionId
          ? { ...reflection, feedbackGiven: true }
          : reflection
      )
    );
  };

  const filteredAndSearchedReflections = reflections.filter((reflection) => {
    const matchesSearch = reflection.title.toLowerCase().includes(search);

    if (filter === "All") {
      return matchesSearch;
    } else if (filter === "Given") {
      return matchesSearch && reflection.feedbackGiven;
    } else if (filter === "NotGiven") {
      return matchesSearch && !reflection.feedbackGiven;
    } else {
      return false;
    }
  });

  return (
    <div className="feedbacks">
      <div className="feedback-container">
        <h1>Your feedbacks</h1>
        <div className="classesHeader">
          <ul className="class-filter">
            <li
              className={filter === "All" ? "active" : ""}
              onClick={() => handleFilterChange("All")}
            >
              All Reflections
            </li>
            <li
              className={filter === "Given" ? "active" : ""}
              onClick={() => handleFilterChange("Given")}
            >
              Given Feedback
            </li>
            <li
              className={filter === "NotGiven" ? "active" : ""}
              onClick={() => handleFilterChange("NotGiven")}
            >
              Not Given Feedback
            </li>
          </ul>

          <div className="inputSearch">
            <FontAwesomeIcon icon={faSearch} className="fa-search-icon" />
            <input
              placeholder="Search Reflections"
              onChange={handleSearch}
              value={search}
            />
          </div>
        </div>
        <div className="feedback-entries">
          {filteredAndSearchedReflections.length === 0 ? (
            <p>No feedback available.</p>
          ) : (
            filteredAndSearchedReflections.map((reflection) => (
              <div key={reflection._id} className="feedback-entry">
                <div
                  className="reflection-card"
                  onClick={() => handleCardClick(reflection)}
                >
                  <div className="entry-image">
                    <img
                      src={
                        reflection.photo
                          ? `${process.env.REACT_APP_API_URL}/uploads/reflections/${reflection.photo}`
                          : DefaultImage
                      }
                      alt={reflection.title}
                    />
                  </div>
                  <h3>{reflection.title}</h3>
                  <p>Student: {reflection.userId.name}</p>
                </div>
              </div>
            ))
          )}
          {loadingReflection && <p>Loading reflection details...</p>}
          {selectedReflection && (
            <ReflectionModal
              entry={selectedReflection}
              onClose={() => setSelectedReflection(null)}
              onFeedbackSubmit={handleFeedbackSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackStudent;
